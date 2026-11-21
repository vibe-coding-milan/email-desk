"""Private-host CLI entry point. Scheduled reviews never require SSH credentials."""
import argparse
import datetime as dt
import hashlib
import json
import logging
import os
from pathlib import Path
import subprocess
import sys

from .engine import Engine
from .google import ACCOUNTS, Gmail
from .state import Journal, UTC, iso, operation, private_file, scheduled_slot


class BridgeError(RuntimeError):
    pass


class Bridge:
    def __init__(self, command):
        self.command = command

    def call(self, payload):
        if payload.get('action') not in {'board', 'feedback', 'publish', 'acknowledge'}:
            raise ValueError('bridge_action')
        raw = json.dumps(payload, ensure_ascii=False).encode()
        if len(raw) > 524288:
            raise ValueError('bridge_payload_limit')
        result = subprocess.run(self.command, input=raw, capture_output=True, timeout=75)
        try:
            value = json.loads(result.stdout if not result.returncode else result.stderr)
        except Exception:
            raise BridgeError('bridge_unavailable')
        if result.returncode or not value.get('ok'):
            raise BridgeError(value.get('error', 'bridge_unavailable'))
        return value['result']


def configuration(directory):
    config = json.loads(private_file(directory / 'reviewer.json').read_text())
    for key, lower, upper in [('messages_per_account', 1, 100), ('max_model_requests', 1, 8),
                               ('max_context_bytes', 10000, 240000), ('max_output_tokens', 1024, 8192),
                               ('max_pages', 1, 30)]:
        if type(config.get(key)) is not int or not lower <= config[key] <= upper:
            raise ValueError('configuration_bounds')
    if dt.datetime.fromisoformat(config['activated_at']).tzinfo is None:
        raise ValueError('activation_timezone')
    return config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', type=Path, default=Path.home() / '.email-desk/reviewer')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--run-now', action='store_true')
    parser.add_argument('--local-validation', action='store_true')
    parser.add_argument('--health', action='store_true')
    args = parser.parse_args()
    logging.disable(logging.CRITICAL)
    os.umask(0o077)
    directory = args.directory.resolve()
    config = configuration(directory)
    if args.local_validation:
        if not args.dry_run or args.directory.is_symlink():
            raise ValueError('local_validation_read_only')
        root = Path(__file__).resolve().parents[1]
        bridge = Bridge([sys.executable, str(root / 'scripts/bridge.py')])
        labels = json.loads((root / 'server/labels.json').read_text())
    else:
        home = Path.home()
        homepage = home / 'mijatovic.com/index.html'
        if (home.name != 'dh_6zwyjw' or directory != home / '.email-desk/reviewer'
                or any(p.is_symlink() for p in [home, homepage.parent, homepage, home / '.email-desk'])
                or hashlib.sha256(homepage.read_bytes()).hexdigest() != config['homepage_sha256']):
            raise ValueError('domain_guard')
        bridge = Bridge(['/usr/local/php83/bin/php', str(home / '.email-desk/server/bridge.php')])
        labels = json.loads((home / '.email-desk/server/labels.json').read_text())
    if not args.dry_run and not args.health and (not config.get('enabled') or not config.get('api_data_authorized')
                            or not config.get('label_writes_authorized') or not config.get('google_production_confirmed')):
        raise ValueError('not_activated')
    with Journal(directory) as journal:
        if args.health:
            print(json.dumps(journal.data.get('last_result', {'status': 'not_reviewed'})))
            return 0
        now = dt.datetime.now(UTC)
        slot = ('manual-' + now.strftime('%Y%m%dT%H%M%S%fZ')) if args.run_now or args.dry_run else scheduled_slot(now, config['activated_at'], journal.data['slots'])
        if slot is None:
            print(json.dumps({'due': False}))
            return 0
        entry = journal.data['slots'].setdefault(slot, {'attempts': 0})
        entry.update(attempts=entry['attempts'] + 1, last_attempt=iso(now))
        journal.save()
        clients = {}
        try:
            for account in ACCOUNTS:
                clients[account] = Gmail(account, journal, labels)
            result = Engine(journal, bridge, clients, labels, config, slot, args.dry_run).run()
            journal.data['last_result'] = {'at': iso(), **result}
            journal.save()
            print(json.dumps(result))
            return 1 if result.get('errors') else 0
        except Exception as error:
            # Do not log exceptions, URLs, account contents, HTTP bodies or secrets.
            code = str(error) if isinstance(error, (ValueError, BridgeError)) and str(error).replace('_', '').isalnum() else 'review_failed'
            journal.data['last_result'] = {'at': iso(), 'status': 'error', 'code': code}
            journal.save()
            if not args.dry_run and not journal.data.get('pending_publication'):
                try:
                    bridge.call({'action': 'publish', 'operation_id': operation('error', slot + str(entry['attempts'])),
                                 'cards': [], 'run': {'status': 'error', 'summary': 'Hosted review failed verification; saved cards and account checkpoints are retained.'}})
                except Exception:
                    pass
            print(json.dumps({'status': 'error', 'code': code, 'saved_state_retained': True}))
            return 1
        finally:
            for gmail in clients.values():
                gmail.close()


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception:
        print(json.dumps({'status': 'error', 'code': 'startup_failed', 'activated': False}))
        raise SystemExit(1)
