"""Encrypted atomic journal and New York schedule; no network operations."""
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import stat
import tempfile
from zoneinfo import ZoneInfo

from cryptography.fernet import Fernet

UTC = dt.timezone.utc
NY = ZoneInfo('America/New_York')


def iso(now=None):
    return (now or dt.datetime.now(UTC)).astimezone(UTC).isoformat()


def operation(kind, value):
    return 'hosted_' + kind + '_' + hashlib.sha256(value.encode()).hexdigest()[:48]


def private_file(path):
    path = Path(path)
    if path.is_symlink() or not path.is_file() or stat.S_IMODE(path.stat().st_mode) & 0o077:
        raise ValueError('unsafe_private_file')
    return path


def atomic(path, raw):
    path = Path(path)
    if path.is_symlink():
        raise ValueError('unsafe_private_file')
    fd, temporary = tempfile.mkstemp(dir=path.parent)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, 'wb') as output:
            output.write(raw)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        directory = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


class Journal:
    def __init__(self, directory):
        self.directory = Path(directory)
        if self.directory.is_symlink() or stat.S_IMODE(self.directory.stat().st_mode) & 0o077:
            raise ValueError('unsafe_private_directory')
        self.cipher = Fernet(private_file(self.directory / 'token-encryption.key').read_bytes())
        self.path = self.directory / 'journal.encrypted'
        self.lock = None
        self.data = {'version': 1, 'accounts': {}, 'slots': {}, 'usage': []}

    def __enter__(self):
        path = self.directory / 'reviewer.lock'
        fd = os.open(path, os.O_RDWR | os.O_CREAT | getattr(os, 'O_NOFOLLOW', 0), 0o600)
        self.lock = os.fdopen(fd, 'a+')
        try:
            fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            self.lock.close()
            raise RuntimeError('already_running')
        if self.path.exists():
            self.data = self.open(self.path)
            if self.data.get('version') != 1:
                raise ValueError('journal_version')
        return self

    def __exit__(self, *unused):
        self.lock.close()

    def open(self, path):
        return json.loads(self.cipher.decrypt(private_file(path).read_bytes()))

    def seal(self, path, value):
        atomic(path, self.cipher.encrypt(json.dumps(value, ensure_ascii=False).encode()))

    def save(self):
        self.seal(self.path, self.data)


def scheduled_slot(now, activated_at, slots):
    """Latest due slot only: missed historical slots never get fake publications."""
    now = now.astimezone(UTC)
    activated = dt.datetime.fromisoformat(activated_at).astimezone(UTC)
    candidates = []
    for offset in [-1, 0]:
        day = now.astimezone(NY).date() + dt.timedelta(days=offset)
        for hour, minute in [(9, 0), *([(13, 0)] if day.weekday() < 5 else []), (17, 30)]:
            value = dt.datetime.combine(day, dt.time(hour, minute), NY)
            if activated <= value.astimezone(UTC) <= now:
                candidates.append(value)
    if not candidates:
        return None
    value = max(candidates)
    key = value.isoformat()
    state = slots.get(key, {})
    if state.get('complete') or state.get('attempts', 0) >= 3:
        return None
    if state.get('last_attempt') and (now - dt.datetime.fromisoformat(state['last_attempt'])).total_seconds() < 900:
        return None
    return key
