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

# Only aggregate operational metadata crosses into the authenticated website.
# Pricing is a dated standard-rate calculation, never an account balance.
RATE_SOURCE = 'https://developers.openai.com/api/docs/models/gpt-6-luna'
RATE_VALUES = {'input': '0.10', 'cached': '0.01', 'cache_write': '0.125', 'output': '0.50'}
PURPOSES = {'routine', 'catch_up', 'mixed', 'manual', 'dry_run', 'legacy'}


def reporting_snapshot(data, config, now=None):
    from decimal import Decimal
    now = now or dt.datetime.now(UTC)
    since = (now.astimezone(NY).date() - dt.timedelta(days=89)).isoformat()
    groups, seen, unknown = {}, set(), 0
    for record in data.get('usage', []):
        try:
            day = dt.datetime.fromisoformat(record['at']).astimezone(NY).date().isoformat()
            if day < since:
                continue
            request_id = record.get('request_id')
            if request_id:
                if request_id in seen:
                    continue
                seen.add(request_id)
            usage = record.get('usage') or {}
            incoming, outgoing = usage.get('input_tokens'), usage.get('output_tokens')
            detail = usage.get('input_tokens_details') or {}
            cached, writes = detail.get('cached_tokens', 0), detail.get('cache_write_tokens', 0)
            if any(type(n) is not int or n < 0 for n in [incoming, outgoing, cached, writes]) or cached + writes > incoming:
                raise ValueError('usage_unknown')
            model = 'gpt-6-luna' if record.get('model') == 'gpt-6-luna' else 'other'
            purpose = record.get('purpose', 'legacy')
            if purpose not in PURPOSES:
                purpose = 'legacy'
            rate_date = record.get('rate_date', '2026-11-20')
            if rate_date not in {'2026-11-20', '2026-11-21'}:
                model = 'other'
                rate_date = 'unknown'
            key = (day, purpose, model, rate_date)
            row = groups.setdefault(key, dict(day=day, purpose=purpose, model=model, rate_date=rate_date,
                                              requests=0, retries=0, incomplete=0, input_tokens=0,
                                              output_tokens=0, cached_tokens=0, cache_write_tokens=0))
            row['requests'] += 1
            row['retries'] += int(record.get('attempt', 1) > 1)
            row['incomplete'] += int(record.get('status') != 'completed' or record.get('verification_failed', False))
            for field, value in [('input_tokens', incoming), ('output_tokens', outgoing), ('cached_tokens', cached), ('cache_write_tokens', writes)]:
                row[field] += value
        except (ValueError, TypeError, KeyError):
            unknown += 1
    rows = []
    for row in groups.values():
        row['calculated_usd'] = None
        if row['model'] == 'gpt-6-luna':
            ordinary = row['input_tokens'] - row['cached_tokens'] - row['cache_write_tokens']
            row['calculated_usd'] = str((ordinary * Decimal(RATE_VALUES['input']) + row['cached_tokens'] * Decimal(RATE_VALUES['cached'])
                                        + row['cache_write_tokens'] * Decimal(RATE_VALUES['cache_write'])
                                        + row['output_tokens'] * Decimal(RATE_VALUES['output'])) / Decimal(1000000))
        rows.append(row)
    uncertain = sum(bool(s.get('model_uncertain')) for s in data.get('slots', {}).values())
    accounts = []
    for account in ['mijatovic@gmail.com', 'milan@mijatovic.com']:
        state = data.get('accounts', {}).get(account, {})
        accounts.append({'account': account, 'recent_through': state.get('cursor'),
                         'historical_through': state.get('backfill_end'), 'historical_complete': bool(state.get('backfill_complete'))})
    return {'generated_at': iso(now), 'schedule_active': bool(config.get('schedule_active', False)),
            'activated_at': config['activated_at'], 'accounts': accounts,
            'playbook': data.get('playbook', {}),
            'usage': {'since': since, 'rows': sorted(rows, key=lambda r: (r['day'], r['purpose'], r['rate_date']), reverse=True),
                      'unknown_requests': unknown + uncertain}}
