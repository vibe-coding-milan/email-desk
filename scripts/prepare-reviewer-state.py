#!/usr/bin/env python3
"""Prepare encrypted hosted progress from verified local metadata. Never reads mail."""
import datetime as dt
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from reviewer.state import Journal, UTC, iso
from reviewer.google import ACCOUNTS


def build_state(records, checkpoints):
    state = {'version': 1, 'accounts': {}, 'slots': {}, 'usage': [], 'imported_at': iso()}
    now = dt.datetime.now(UTC)
    for account in ACCOUNTS:
        cursor = checkpoints.get(account)
        parsed = dt.datetime.fromisoformat(cursor) if isinstance(cursor, str) else None
        if parsed is None or parsed.tzinfo is None or parsed > now:
            raise ValueError('verified_checkpoint_required')
        state['accounts'][account] = {'done': {}, 'cursor': cursor, 'backfill_complete': False}
    for record in records:
        for account in record.get('accounts', []):
            name = account.get('account')
            if name not in ACCOUNTS:
                continue
            for entry in account.get('entries', []):
                mid = entry.get('message_id', '')
                if (entry.get('status') != 'verified' or not re.fullmatch('[0-9a-f]{10,64}', mid)
                        or not isinstance(entry.get('actual_label_ids'), list)
                        or set(entry['actual_label_ids']) & {'SENT', 'DRAFT', 'SPAM', 'TRASH'}):
                    continue
                # Only IDs and outcome timestamps cross into the new journal.
                stamp = entry.get('verified_at') or state['imported_at']
                state['accounts'][name]['done'][mid] = stamp
    return state


def main():
    os.umask(0o077)
    directory = ROOT / '.private/hosted-reviewer'
    destination = directory / 'initial-journal.encrypted'
    if destination.exists() or destination.is_symlink():
        raise ValueError('initial_state_already_prepared')
    result = subprocess.run([sys.executable, str(ROOT / 'scripts/bridge.py')],
                            input=b'{"action":"board"}', capture_output=True, timeout=70)
    board = json.loads(result.stdout)
    if result.returncode or not board.get('ok'):
        raise ValueError('restricted_board_read_failed')
    records = [json.loads(p.read_text()) for p in sorted((ROOT / '.private/reviewer').glob('run-*.json'))]
    state = build_state(records, board['result']['checkpoints'])
    journal = Journal(directory)
    journal.seal(destination, state)
    print(json.dumps({'encrypted_initial_state_prepared': True,
                      'verified_ids': {a: len(s['done']) for a, s in state['accounts'].items()},
                      'historical_complete': False, 'host_transfer': False}))


if __name__ == '__main__': main()
