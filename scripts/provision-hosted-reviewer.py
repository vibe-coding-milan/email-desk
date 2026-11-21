#!/usr/bin/env python3
"""Guarded private-host installation. Never creates SSH keys or exposes a web endpoint."""
import argparse
import datetime as dt
import hashlib
import fcntl
import io
import json
import os
from pathlib import Path
import pwd
import re
import shlex
import subprocess
import tarfile
import tempfile

MODULES = {'__init__', 'content', 'engine', 'google', 'main', 'model', 'state'}
ALLOWED = {'reviewer/' + name + '.py' for name in MODULES} | {'requirements.txt'}
SECRETS = ['openai-api-key.txt', 'token-encryption.key', 'google-personal.encrypted', 'google-workspace.encrypted', 'initial-journal.encrypted']
BEGIN, END = '# BEGIN EMAIL_DESK_HOSTED_REVIEWER', '# END EMAIL_DESK_HOSTED_REVIEWER'


def guard(home, digest):
    home = Path(home)
    homepage = home / 'mijatovic.com/index.html'
    if (home.name != 'dh_6zwyjw' or not re.fullmatch('[0-9a-f]{64}', digest)
            or any(p.is_symlink() for p in [home, homepage.parent, homepage, home / '.email-desk'])
            or hashlib.sha256(homepage.read_bytes()).hexdigest() != digest):
        raise ValueError('domain_guard')


def private(path, directory=False):
    if path.is_symlink() or not (path.is_dir() if directory else path.is_file()) or path.stat().st_mode & 0o077:
        raise ValueError('unsafe_private_path')
    return path


def write(path, raw):
    if path.is_symlink():
        raise ValueError('unsafe_private_path')
    fd, temporary = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as output:
            output.write(raw)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)


def unpack(raw):
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('archive_limit')
    contents = {}
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:gz') as archive:
        for member in archive:
            if (not member.isfile() or member.name not in ALLOWED | {'manifest.json'}
                    or member.name in contents or member.size > 1024 * 1024):
                raise ValueError('archive_entry')
            contents[member.name] = archive.extractfile(member).read()
    if set(contents) != ALLOWED | {'manifest.json'}:
        raise ValueError('archive_files')
    manifest = json.loads(contents.pop('manifest.json'))
    actual = {name: hashlib.sha256(data).hexdigest() for name, data in contents.items()}
    if manifest.get('files') != actual or not re.fullmatch('[0-9a-f]{40}', manifest.get('source_commit', '')):
        raise ValueError('manifest_mismatch')
    return contents, manifest


def command(args, cwd=None):
    result = subprocess.run(args, cwd=cwd, capture_output=True, timeout=300)
    if result.returncode:
        raise ValueError('installation_command_failed')
    return result


def verify_code(root):
    code = private(root / 'code', True)
    private(code / 'reviewer', True)
    manifest = json.loads(private(root / 'installed.json').read_text())
    if (set(manifest.get('files', {})) != ALLOWED
            or not re.fullmatch('[0-9a-f]{40}', manifest.get('source_commit', ''))
            or any(hashlib.sha256(private(code / name).read_bytes()).hexdigest() != value
                   for name, value in manifest['files'].items())):
        raise ValueError('installed_code_changed')
    return manifest


def install_code(root, archive, expected):
    raw = private(archive).read_bytes()
    if hashlib.sha256(raw).hexdigest() != expected:
        raise ValueError('archive_digest')
    files, manifest = unpack(raw)
    code = root / 'code'
    if code.exists():
        private(code, True)
        previous = verify_code(root)
        if previous != manifest:
            raise ValueError('different_installation_requires_review')
        if (root / 'activation.json').exists():
            private(root / 'activation.json')
            return {'code_installed': True, 'source_commit': manifest['source_commit'],
                    'credentials_copied': False, 'existing_activation_preserved': True}
    else:
        code.mkdir(mode=0o700)
        (code / 'reviewer').mkdir(mode=0o700)
        for name, data in files.items(): write(code / name, data)
        write(root / 'installed.json', json.dumps(manifest).encode())
    venv = root / 'venv'
    if venv.is_symlink(): raise ValueError('unsafe_private_path')
    if not (venv / 'bin/python').is_file(): command(['/usr/bin/python3', '-m', 'venv', str(venv)])
    command([str(venv / 'bin/python'), '-m', 'pip', 'install', '--disable-pip-version-check', '--no-cache-dir', '-r', str(code / 'requirements.txt')])
    command([str(venv / 'bin/python'), '-m', 'py_compile', *[str(code / 'reviewer' / (name + '.py')) for name in MODULES]])
    return {'code_installed': True, 'source_commit': manifest['source_commit'], 'credentials_copied': False, 'cron_enabled': False}


def configure(root, staging):
    private(staging, True)
    verify_code(root)
    config_path = root / 'reviewer.json'
    if config_path.exists() or any((root / name).exists() for name in SECRETS + ['journal.encrypted']):
        raise ValueError('credential_replacement_requires_review')
    config = json.loads(private(staging / 'reviewer.json').read_text())
    if any(config.get(k) is not True for k in ['api_data_authorized', 'label_writes_authorized', 'google_production_confirmed']):
        raise ValueError('authorization_required')
    command([str(root / 'venv/bin/python'), '-c',
             'from reviewer.main import configuration;from pathlib import Path;configuration(Path(' + repr(str(staging)) + '))'], root / 'code')
    # Check all source paths before making any copy. Secret values are never printed.
    values = {name: private(staging / name).read_bytes() for name in SECRETS}
    key = values['openai-api-key.txt'].decode().strip()
    if not key.startswith('sk-') or any(c.isspace() for c in key): raise ValueError('api_key_format')
    command([str(root / 'venv/bin/python'), '-c',
             'from reviewer.state import Journal;from pathlib import Path;'
             'j=Journal(Path(' + repr(str(staging)) + '));'
             'a=j.open(j.directory/"google-personal.encrypted");b=j.open(j.directory/"google-workspace.encrypted");'
             'assert all(x.get("refresh_token") and x.get("token_uri")=="https://oauth2.googleapis.com/token" for x in [a,b]);'
             's=j.open(j.directory/"initial-journal.encrypted");'
             'assert s.get("version")==1 and set(s.get("accounts",{}))=={"mijatovic@gmail.com","milan@mijatovic.com"};'
             'assert not s.get("slots") and not s.get("usage");'
             'assert set(s).issubset({"version","accounts","slots","usage","imported_at"});'
             'assert all(set(a)=={"done","cursor","backfill_complete"} and a["backfill_complete"] is False for a in s["accounts"].values())'], root / 'code')
    for name, value in values.items(): write(root / ('journal.encrypted' if name == 'initial-journal.encrypted' else name), value)
    config['enabled'] = True  # Allows a controlled manual run; cron is still absent.
    write(config_path, json.dumps(config, indent=2).encode())
    command([str(root / 'venv/bin/python'), '-c',
             'from reviewer.main import configuration;from pathlib import Path;configuration(Path(' + repr(str(root)) + '))'], root / 'code')
    return {'configured': True, 'cron_enabled': False, 'transfer_copies_retained': True}


def upgrade_code(root, archive, expected, previous_commit):
    """Reviewed pre-activation repair only; retain old code and all private state."""
    if (root / 'activation.json').exists():
        raise ValueError('active_upgrade_requires_review')
    lock_path = root / 'reviewer.lock'
    fd = os.open(lock_path, os.O_RDWR | os.O_CREAT | getattr(os, 'O_NOFOLLOW', 0), 0o600)
    with os.fdopen(fd, 'a+') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        previous = verify_code(root)
        if previous['source_commit'] != previous_commit:
            raise ValueError('upgrade_base_changed')
        raw = private(archive).read_bytes()
        if hashlib.sha256(raw).hexdigest() != expected:
            raise ValueError('archive_digest')
        files, manifest = unpack(raw)
        if manifest['files']['requirements.txt'] != previous['files']['requirements.txt']:
            raise ValueError('dependency_upgrade_requires_review')
        for name, content in files.items():
            if name.endswith('.py'): compile(content, name, 'exec')
        staging = Path(tempfile.mkdtemp(prefix='code-upgrade-', dir=root))
        (staging / 'reviewer').mkdir(mode=0o700)
        for name, content in files.items(): write(staging / name, content)
        backup = root / ('code-backup-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        write(root / (backup.name + '.json'), json.dumps(previous).encode())
        os.rename(root / 'code', backup)
        try:
            os.rename(staging, root / 'code')
            write(root / 'installed.json', json.dumps(manifest).encode())
            verify_code(root)
        except Exception:
            if (root / 'code').exists(): os.rename(root / 'code', staging)
            os.rename(backup, root / 'code')
            write(root / 'installed.json', json.dumps(previous).encode())
            raise
        return {'code_upgraded': True, 'source_commit': manifest['source_commit'],
                'private_state_preserved': True, 'cron_enabled': False, 'backup': backup.name}


def managed_cron(existing, line):
    rows = existing.splitlines(keepends=True)
    starts = [i for i, row in enumerate(rows) if row.strip() == BEGIN]
    ends = [i for i, row in enumerate(rows) if row.strip() == END]
    if len(starts) > 1 or len(ends) > 1 or len(starts) != len(ends):
        raise ValueError('cron_markers')
    if starts:
        if ends[0] < starts[0]: raise ValueError('cron_markers')
        existing = ''.join(rows[:starts[0]] + rows[ends[0] + 1:])
    base = existing.rstrip('\n')
    return (base + '\n' if base else '') + BEGIN + '\n' + line + '\n' + END + '\n'


def enable_cron(root):
    verify_code(root)
    config = json.loads(private(root / 'reviewer.json').read_text())
    if not config.get('enabled') or not config.get('google_production_confirmed'):
        raise ValueError('not_activated')
    result = command([str(root / 'venv/bin/python'), '-m', 'reviewer.main', '--directory', str(root), '--health'], root / 'code')
    health = json.loads(result.stdout)
    if (health.get('errors') != 0 or health.get('modified_messages', 0) < 1 or health.get('mailboxes_verified', 0) != 2
            or not health.get('publication_verified') or health.get('dry_run')
            or (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(health['at'])).total_seconds() > 86400):
        raise ValueError('live_acceptance_required')
    # A fresh activation boundary prevents retroactively crediting old schedule slots.
    previous_activation = root / 'activation.json'
    config['activated_at'] = (json.loads(private(previous_activation).read_text())['activated_at'] if previous_activation.exists()
                              else dt.datetime.now(dt.timezone.utc).isoformat())
    write(root / 'reviewer.json', json.dumps(config, indent=2).encode())
    log = root / 'cron.log'
    if not log.exists(): write(log, b'')
    private(log)
    line = '*/5 * * * * cd ' + shlex.quote(str(root / 'code')) + ' && ' + shlex.quote(str(root / 'venv/bin/python')) + ' -m reviewer.main --directory ' + shlex.quote(str(root)) + ' >> ' + shlex.quote(str(log)) + ' 2>&1'
    current = subprocess.run(['crontab', '-l'], capture_output=True, text=True, timeout=15)
    if current.returncode and 'no crontab' not in current.stderr.lower(): raise ValueError('cron_unavailable')
    expected = managed_cron(current.stdout, line)
    with tempfile.NamedTemporaryFile(dir=root, mode='w', delete=True) as handle:
        handle.write(expected)
        handle.flush()
        command(['crontab', handle.name])
    actual = command(['crontab', '-l']).stdout.decode()
    if actual != expected: raise ValueError('cron_readback')
    write(root / 'activation.json', json.dumps({'activated_at': config['activated_at'], 'cron_verified': True,
                                              'mac_offline_verified': False}).encode())
    return {'cron_enabled': True, 'timezone': 'America/New_York', 'cadence': 'Weekdays 09:00/13:00/17:30; weekends 09:00/17:30', 'mac_offline_verified': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--homepage-sha256', required=True)
    parser.add_argument('--mode', choices=['code', 'upgrade-code', 'configure', 'cron'], required=True)
    parser.add_argument('--archive-sha256')
    parser.add_argument('--expected-current-commit')
    args = parser.parse_args()
    os.umask(0o077)
    home = Path.home()
    if pwd.getpwuid(os.getuid()).pw_name != 'dh_6zwyjw': raise ValueError('domain_owner')
    guard(home, args.homepage_sha256)
    root = home / '.email-desk/reviewer'
    if not root.exists(): root.mkdir(mode=0o700)
    private(root, True)
    if args.mode == 'code': result = install_code(root, home / '.email-desk/reviewer-code.tar.gz', args.archive_sha256)
    elif args.mode == 'upgrade-code': result = upgrade_code(root, home / '.email-desk/reviewer-code.tar.gz', args.archive_sha256, args.expected_current_commit)
    elif args.mode == 'configure': result = configure(root, home / '.email-desk/reviewer-transfer')
    else: result = enable_cron(root)
    print(json.dumps({'domain_guard': True, **result}))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        print(json.dumps({'ok': False, 'error': 'Guarded reviewer installation incomplete; no credential values logged'}))
        raise SystemExit(1)
