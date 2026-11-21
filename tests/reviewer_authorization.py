#!/usr/bin/env python3
"""Fictional grant-storage tests; no OAuth flow, network or credentials."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('authorize', Path(__file__).resolve().parents[1] / 'scripts/authorize-reviewer-google.py')
authorize = importlib.util.module_from_spec(spec)
spec.loader.exec_module(authorize)


class GrantStorage(unittest.TestCase):
    def test_renewal_preserves_old_bytes_and_owner_only_permissions(self):
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / 'fictional.encrypted'
            authorize.store_grant(path, b'fictional-old-encrypted-value')
            authorize.store_grant(path, b'fictional-new-encrypted-value', b'fictional-old-encrypted-value')
            backups = list(Path(raw).glob('*.pre-production-*.encrypted'))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].read_bytes(), b'fictional-old-encrypted-value')
            self.assertEqual(path.read_bytes(), b'fictional-new-encrypted-value')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(backups[0].stat().st_mode & 0o777, 0o600)

    def test_implicit_overwrite_changed_grant_and_symlink_are_refused(self):
        with tempfile.TemporaryDirectory() as raw:
            path = Path(raw) / 'fictional.encrypted'
            authorize.store_grant(path, b'current')
            with self.assertRaises(FileExistsError): authorize.store_grant(path, b'new')
            with self.assertRaises(ValueError): authorize.store_grant(path, b'new', b'stale')
            link = Path(raw) / 'link.encrypted'
            link.symlink_to(path)
            with self.assertRaises(ValueError): authorize.store_grant(link, b'new', b'current')
            self.assertEqual(path.read_bytes(), b'current')


if __name__ == '__main__': unittest.main()
