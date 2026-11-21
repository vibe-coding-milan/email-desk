#!/usr/bin/env python3
"""One-time Google OAuth bootstrap. No mail contents read and no mail changes."""
import argparse
import html
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import logging
import os
from pathlib import Path
import stat
import threading

from cryptography.fernet import Fernet
from google.auth.transport.requests import AuthorizedSession
from google_auth_oauthlib.flow import InstalledAppFlow

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / '.private/hosted-reviewer'
ACCOUNTS = {'mijatovic@gmail.com': 'personal', 'milan@mijatovic.com': 'workspace'}
GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify'
DOCS_SCOPE = 'https://www.googleapis.com/auth/documents.readonly'


def private_write(path, value):
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        output.write(value)


def checked_file(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError('Private configuration missing or unsafe')
    if stat.S_IMODE(path.stat().st_mode) & 0o077:
        raise ValueError('Private configuration requires owner-only permissions')
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--account', required=True, choices=ACCOUNTS)
    args = parser.parse_args()
    os.umask(0o077)
    logging.disable(logging.CRITICAL)  # No callback codes or token errors in logs.
    client_path = checked_file(PRIVATE / 'google-oauth-client.json')
    client = json.loads(client_path.read_text()).get('installed', {})
    if (client.get('project_id') != 'mijatovic-email-desk'
            or client.get('auth_uri') != 'https://accounts.google.com/o/oauth2/auth'
            or client.get('token_uri') != 'https://oauth2.googleapis.com/token'):
        raise ValueError('Unexpected Google project or endpoints')
    target = PRIVATE / ('google-' + ACCOUNTS[args.account] + '.encrypted')
    if target.exists() or target.is_symlink():
        raise ValueError('A grant already exists; explicit rotation is required')
    scopes = [GMAIL_SCOPE] + ([DOCS_SCOPE] if ACCOUNTS[args.account] == 'workspace' else [])
    ready = threading.Event()
    landing_data = {}

    class Landing(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path != '/':
                self.send_error(404)
                return
            if not ready.wait(3):
                self.send_error(503)
                return
            page = ('<!doctype html><html><meta charset="utf-8"><title>Email Desk authorization</title>'
                    '<h1>Connect Email Desk</h1><p>Account: ' + html.escape(args.account) + '</p>'
                    '<p>Authorize Gmail reading and label changes. '
                    + ('Also authorize Google Docs reading for the master playbook. '
                       if DOCS_SCOPE in scopes else '')
                    + 'No emails will be sent or changed during this setup.</p><p><a href="'
                    + html.escape(landing_data['url'], quote=True)
                    + '">Continue to Google</a></p></html>').encode()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Security-Policy', "default-src 'none'; base-uri 'none'; frame-ancestors 'none'")
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('Content-Length', str(len(page)))
            self.end_headers()
            self.wfile.write(page)

        def log_message(self, *unused):
            pass

    class PrivateFlow(InstalledAppFlow):
        def authorization_url(self, **kwargs):
            url, state = super().authorization_url(**kwargs)
            landing_data['url'] = url
            ready.set()
            print('Authorization ready at http://127.0.0.1:8766/ for ' + args.account, flush=True)
            return url, state

    landing = HTTPServer(('127.0.0.1', 8766), Landing)
    threading.Thread(target=landing.serve_forever, daemon=True).start()
    try:
        flow = PrivateFlow.from_client_secrets_file(str(client_path), scopes=scopes,
                                                   autogenerate_code_verifier=True)
        credentials = flow.run_local_server(
            host='127.0.0.1', port=8767, open_browser=False,
            authorization_prompt_message=None, timeout_seconds=600,
            success_message='Google returned authorization. Email Desk is verifying the account; check the setup conversation for the result.',
            login_hint=args.account, prompt='consent', access_type='offline',
        )
        granted = credentials.granted_scopes or []
        if isinstance(granted, str):
            granted = granted.split()
        if not credentials.refresh_token or not set(scopes).issubset(set(granted)):
            raise ValueError('Offline authorization or required scopes missing')
        with AuthorizedSession(credentials) as session:
            response = session.get('https://gmail.googleapis.com/gmail/v1/users/me/profile', timeout=30)
            response.raise_for_status()
            if response.json().get('emailAddress', '').lower() != args.account:
                raise ValueError('Wrong Google account; no grant stored')
        key_path = PRIVATE / 'token-encryption.key'
        if not key_path.exists():
            private_write(key_path, Fernet.generate_key())
        key = checked_file(key_path).read_bytes()
        private_write(target, Fernet(key).encrypt(credentials.to_json().encode()))
        print(json.dumps({'ok': True, 'account_verified': args.account,
                          'offline_grant': True, 'encrypted_local_storage': True,
                          'mail_read_or_changed': False, 'host_transfer': False}), flush=True)
    finally:
        landing.shutdown()
        landing.server_close()


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Exceptions may contain callback/token URLs; never echo them.
        print(json.dumps({'ok': False, 'error': 'Google authorization incomplete; no new grant confirmed'}), flush=True)
        raise SystemExit(1)
