#!/usr/bin/env python3
"""One bounded, content-free Responses API check; no mail or board access."""
import datetime
import json
import os
from pathlib import Path
import stat
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / '.private/hosted-reviewer'


def main():
    key_path = PRIVATE / 'openai-api-key.txt'
    if key_path.is_symlink() or not key_path.is_file():
        raise ValueError('Private API key file missing or unsafe')
    if stat.S_IMODE(key_path.stat().st_mode) & 0o077:
        raise ValueError('API key file must have owner-only permissions')
    key = key_path.read_text().strip()
    if not key.startswith('sk-') or any(c.isspace() for c in key):
        raise ValueError('Unexpected API key format')
    payload = {
        'model': 'gpt-6-luna', 'store': False, 'max_output_tokens': 128,
        'input': 'This is an API connectivity check. Reply with only OK.',
    }
    request = urllib.request.Request(
        'https://api.openai.com/v1/responses',
        data=json.dumps(payload).encode(), method='POST',
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
    )
    # No automatic retries: an uncertain response must not silently add spend.
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            body = json.load(response)
            request_id = response.headers.get('x-request-id')
    except urllib.error.HTTPError as error:
        print(json.dumps({'ok': False, 'http_status': error.code,
                          'error': 'API request rejected; no response body logged'}))
        return 1
    except urllib.error.URLError:
        print(json.dumps({'ok': False, 'error': 'API network connection unavailable'}))
        return 1
    result = {
        'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'kind': 'connectivity_only', 'model': body.get('model'),
        'status': body.get('status'), 'usage': body.get('usage'),
        'request_id': request_id, 'mail_messages_reviewed': 0,
        'store': False, 'max_output_tokens': 128, 'automatic_retries': 0,
    }
    text = ''.join(c.get('text', '') for item in body.get('output', [])
                   if item.get('type') == 'message' for c in item.get('content', [])
                   if c.get('type') == 'output_text')
    result['expected_reply'] = text.strip() == 'OK'
    # Only metadata is retained. Never persist the key or raw response content.
    path = PRIVATE / ('api-check-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ') + '.json')
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump(result, output, indent=2)
        output.write('\n')
    print(json.dumps(result))
    return 0 if result['status'] == 'completed' and result['expected_reply'] else 1


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError):
        print(json.dumps({'ok': False, 'error': 'API check configuration or response unavailable'}))
        sys.exit(1)
