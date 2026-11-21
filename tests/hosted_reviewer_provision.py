#!/usr/bin/env python3
"""Fictional installer guards; never touches a host, crontab or credential file."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value


installer = module('installer', 'scripts/provision-hosted-reviewer.py')
builder = module('builder', 'scripts/prepare-hosted-reviewer.py')


class Provisioning(unittest.TestCase):
    def test_inactive_upgrade_preserves_private_state_and_rejects_changed_base(self):
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            archive, manifest = builder.build(ROOT, 'a' * 40)
            files, unused = installer.unpack(archive)
            (root / 'code').mkdir(mode=0o700)
            (root / 'code/reviewer').mkdir(mode=0o700)
            for name, content in files.items(): installer.write(root / 'code' / name, content)
            installer.write(root / 'installed.json', json.dumps(manifest).encode())
            installer.write(root / 'journal.encrypted', b'fictional-encrypted-marker')
            archive, unused = builder.build(ROOT, 'b' * 40)
            bundle = root / 'bundle.tar.gz'
            installer.write(bundle, archive)
            digest = hashlib.sha256(archive).hexdigest()
            with self.assertRaisesRegex(ValueError, 'upgrade_base_changed'):
                installer.upgrade_code(root, bundle, digest, 'c' * 40)
            result = installer.upgrade_code(root, bundle, digest, 'a' * 40)
            self.assertTrue(result['private_state_preserved'])
            self.assertEqual(installer.verify_code(root)['source_commit'], 'b' * 40)
            self.assertEqual((root / 'journal.encrypted').read_bytes(), b'fictional-encrypted-marker')
            self.assertEqual((root / result['backup'] / 'reviewer/model.py').read_bytes(), files['reviewer/model.py'])
            installer.write(root / 'activation.json', b'{}')
            with self.assertRaisesRegex(ValueError, 'active_upgrade_requires_review'):
                installer.upgrade_code(root, bundle, digest, 'b' * 40)

    def test_reviewed_active_upgrade_preserves_activation_cron_and_credentials(self):
        with tempfile.TemporaryDirectory() as raw:
            root=Path(raw)
            archive, manifest=builder.build(ROOT,'a'*40)
            files, unused=installer.unpack(archive)
            (root/'code').mkdir(mode=0o700);(root/'code/reviewer').mkdir(mode=0o700)
            for name, content in files.items():installer.write(root/'code'/name,content)
            installer.write(root/'installed.json',json.dumps(manifest).encode())
            for name in ['activation.json','journal.encrypted','reviewer.json','token-encryption.key']:
                installer.write(root/name,b'fictional-private-marker')
            bundle=root/'bundle.tar.gz';archive,unused=builder.build(ROOT,'b'*40);installer.write(bundle,archive)
            with patch.object(installer,'command') as command:
                result=installer.upgrade_code(root,bundle,hashlib.sha256(archive).hexdigest(),'a'*40,True)
                command.assert_not_called()
            self.assertTrue(result['cron_enabled'])
            for name in ['activation.json','journal.encrypted','reviewer.json','token-encryption.key']:
                self.assertEqual((root/name).read_bytes(),b'fictional-private-marker')

    def test_changed_installed_code_blocks_activation_and_active_reinstall_does_not_run_pip(self):
        with tempfile.TemporaryDirectory() as raw:
            root = Path(raw)
            archive, manifest = builder.build(ROOT, 'a' * 40)
            files, unused = installer.unpack(archive)
            code = root / 'code'
            code.mkdir(mode=0o700)
            (code / 'reviewer').mkdir(mode=0o700)
            for name, content in files.items(): installer.write(code / name, content)
            installer.write(root / 'installed.json', json.dumps(manifest).encode())
            installer.write(root / 'activation.json', b'{}')
            bundle = root / 'bundle.tar.gz'
            installer.write(bundle, archive)
            self.assertEqual(installer.verify_code(root), manifest)
            with patch.object(installer, 'command') as command:
                result = installer.install_code(root, bundle, hashlib.sha256(archive).hexdigest())
                self.assertTrue(result['existing_activation_preserved'])
                command.assert_not_called()
            installer.write(code / 'reviewer/main.py', b'# fictional unexpected change')
            with self.assertRaisesRegex(ValueError, 'installed_code_changed'):
                installer.enable_cron(root)

    def test_code_bundle_exact_allowlist_deterministic_and_no_private_data(self):
        first, manifest = builder.build(ROOT, 'a' * 40)
        second, unused = builder.build(ROOT, 'a' * 40)
        self.assertEqual(first, second)
        files, loaded = installer.unpack(first)
        self.assertEqual(set(files), installer.ALLOWED)
        self.assertEqual(loaded, manifest)
        self.assertFalse(any('.private' in name or 'key' in name or 'encrypted' in name for name in files))

    def archive(self, name, kind=tarfile.REGTYPE):
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w:gz') as archive:
            info = tarfile.TarInfo(name)
            info.type, info.linkname = kind, '/tmp/outside'
            archive.addfile(info, io.BytesIO(b''))
        return data.getvalue()

    def test_traversal_symlinks_unknown_files_and_missing_members_refused(self):
        for name, kind in [('../escape', tarfile.REGTYPE), ('reviewer/main.py', tarfile.SYMTYPE),
                           ('openai-api-key.txt', tarfile.REGTYPE), ('manifest.json', tarfile.REGTYPE)]:
            with self.subTest(name=name), self.assertRaises((ValueError, json.JSONDecodeError)):
                installer.unpack(self.archive(name, kind))

    def test_wrong_domain_or_homepage_and_symlink_refused(self):
        with tempfile.TemporaryDirectory() as raw:
            home = Path(raw) / 'dh_6zwyjw'
            (home / 'mijatovic.com').mkdir(parents=True)
            page = home / 'mijatovic.com/index.html'
            page.write_text('Fictional homepage')
            digest = hashlib.sha256(page.read_bytes()).hexdigest()
            installer.guard(home, digest)
            for destination, expected in [(Path(raw) / 'other_account', digest), (home, 'f' * 64)]:
                with self.assertRaises((ValueError, OSError)): installer.guard(destination, expected)
            page.unlink()
            page.symlink_to(home.parent / 'elsewhere')
            with self.assertRaises(ValueError): installer.guard(home, digest)

    def test_cron_update_preserves_other_jobs_and_is_idempotent(self):
        unrelated = 'MAILTO=""\n17 3 * * * /usr/bin/fictional-backup\n'
        line = '*/5 * * * * fictional-reviewer'
        first = installer.managed_cron(unrelated, line)
        self.assertTrue(first.startswith(unrelated))
        self.assertEqual(installer.managed_cron(first, line), first)
        second = installer.managed_cron(first, line + ' --changed')
        self.assertTrue(second.startswith(unrelated))
        self.assertEqual(second.count(installer.BEGIN), 1)
        # Marker text inside a command must not be treated as a managed block.
        embedded = "1 * * * * echo '" + installer.BEGIN + "'\n"
        self.assertTrue(installer.managed_cron(embedded, line).startswith(embedded))

    def test_malformed_cron_block_refused(self):
        for value in [installer.BEGIN, installer.END, installer.END + '\n' + installer.BEGIN,
                      installer.BEGIN + '\n' + installer.BEGIN + '\n' + installer.END]:
            with self.assertRaises(ValueError): installer.managed_cron(value, 'fictional')


if __name__ == '__main__': unittest.main()
