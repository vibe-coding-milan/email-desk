#!/usr/bin/env python3
"""Read-only host inventory for a future reviewer. Never installs or authenticates."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
from zoneinfo import ZoneInfo


def version(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=10)
        return result.stdout.splitlines()[0][:160] if result.returncode == 0 and result.stdout else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def inspect(home, homepage_sha256):
    home = Path(home)
    # Match the existing provisioning guard before inspecting anything else.
    if home.name != 'dh_6zwyjw':
        raise ValueError('Unexpected domain account')
    homepage = home / 'mijatovic.com/index.html'
    if any(p.is_symlink() for p in [home, homepage.parent, homepage]):
        raise ValueError('Symlinked destination refused')
    if hashlib.sha256(homepage.read_bytes()).hexdigest() != homepage_sha256:
        raise ValueError('Homepage guard mismatch')
    private = home / '.email-desk'
    runtime = {'python': sys.version.split()[0], 'new_york_timezone': str(ZoneInfo('America/New_York'))}
    for name in ['node', 'codex']:
        path = shutil.which(name)
        runtime[name] = version([path, '--version']) if path else None
    php = next((p for p in ['/usr/local/php82/bin/php', '/usr/local/php83/bin/php', '/usr/bin/php'] if Path(p).is_file()), None)
    runtime['php'] = version([php, '--version']) if php else None
    cron = {'command_available': bool(shutil.which('crontab')), 'readable': False, 'entry_count': None}
    if cron['command_available']:
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            entries = [s for s in result.stdout.splitlines() if s.strip() and not s.lstrip().startswith('#') and '=' not in s.split()[0]]
            cron.update(readable=True, entry_count=len(entries))
        elif 'no crontab' in result.stderr.lower():
            cron.update(readable=True, entry_count=0)
    return {
        'domain_identity_verified': True,
        'homepage_verified': True,
        'runtime': runtime,
        'cron': cron,
        'store_present': (private / 'server/Store.php').is_file(),
        'bridge_present': (private / 'server/bridge.php').is_file(),
        'config_present': (private / 'config.php').is_file(),
        'activation_enabled': False,
        'scope': 'Read-only inventory; no authentication, installation, mail access or scheduling performed.'
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--homepage-sha256', required=True)
    args = parser.parse_args()
    if len(args.homepage_sha256) != 64 or any(c not in '0123456789abcdef' for c in args.homepage_sha256):
        parser.error('Expected a SHA-256 digest')
    try:
        print(json.dumps(inspect(Path.home(), args.homepage_sha256), indent=2))
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        # Only bounded, non-secret diagnostics. Never dump config or cron output.
        print(json.dumps({'ok': False, 'error': str(error) if isinstance(error, ValueError) else 'Host inventory unavailable'}))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
