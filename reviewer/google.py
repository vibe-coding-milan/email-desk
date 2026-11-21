"""Fixed Gmail/Docs operations. No send, archive, trash, filter or label creation API."""
import hashlib
import json
import re

from google.auth.transport.requests import AuthorizedSession
from google.oauth2.credentials import Credentials

from .state import private_file

ACCOUNTS = {'mijatovic@gmail.com': 'personal', 'milan@mijatovic.com': 'workspace'}
MASTER = '1ztPK3AzpgE8cgl3CAjiCFQVEw4LjlksIitJmg9T1BJc'
IDENTIFIER = re.compile(r'^[0-9a-f]{10,64}$')


def bounded_json(response):
    response.raise_for_status()
    raw = bytearray()
    for block in response.iter_content(65536):
        raw.extend(block)
        if len(raw) > 5 * 1024 * 1024:
            raise ValueError('google_response_limit')
    return json.loads(raw)


class Gmail:
    def __init__(self, account, journal, labels):
        if account not in ACCOUNTS:
            raise ValueError('account')
        self.account, self.journal, self.labels = account, journal, labels
        self.write_count, self.verified_count = 0, 0
        self.path = journal.directory / ('google-' + ACCOUNTS[account] + '.encrypted')
        info = journal.open(self.path)
        if info.get('token_uri') != 'https://oauth2.googleapis.com/token':
            raise ValueError('token_endpoint')
        required = {'https://www.googleapis.com/auth/gmail.modify'}
        if account == 'milan@mijatovic.com':
            required.add('https://www.googleapis.com/auth/documents.readonly')
        if not info.get('refresh_token') or not required.issubset(set(info.get('scopes', []))):
            raise ValueError('google_scopes')
        self.credentials = Credentials.from_authorized_user_info(info)
        self.session = AuthorizedSession(self.credentials, refresh_timeout=30)
        if self.get('profile')['emailAddress'].lower() != account:
            raise ValueError('account_mismatch')
        inventory = self.get('labels')['labels']
        self.ids = {}
        for label in labels:
            matches = [x['id'] for x in inventory if x.get('type') == 'user' and x['name'] == label]
            if len(matches) != 1:
                raise ValueError('label_inventory')
            self.ids[label] = matches[0]
        if len(set(self.ids.values())) != len(labels):
            raise ValueError('label_inventory')
        self.names = {value: key for key, value in self.ids.items()}

    def close(self):
        self.persist()
        self.session.close()

    def persist(self):
        self.journal.seal(self.path, json.loads(self.credentials.to_json()))

    def get(self, path, params=None):
        if not re.fullmatch(r'(profile|labels|messages|(?:messages|threads)/[0-9a-f]{10,64})', path):
            raise ValueError('gmail_path')
        try:
            with self.session.get('https://gmail.googleapis.com/gmail/v1/users/me/' + path,
                                  params=params, timeout=45, allow_redirects=False, stream=True) as response:
                value = bounded_json(response)
        finally:
            self.persist()
        return value

    def master(self):
        if self.account != 'milan@mijatovic.com':
            raise ValueError('master_account')
        try:
            with self.session.get('https://docs.googleapis.com/v1/documents/' + MASTER,
                                  params={'includeTabsContent': 'true'}, timeout=45, allow_redirects=False, stream=True) as response:
                value = bounded_json(response)
        finally:
            self.persist()
        return value

    def custom(self, ids):
        return sorted(self.names[x] for x in ids if x in self.names)

    def apply(self, message_id, thread_id, desired, observed, journal_key):
        if not IDENTIFIER.fullmatch(message_id) or not IDENTIFIER.fullmatch(thread_id):
            raise ValueError('message_identifier')
        if len(desired) != len(set(desired)) or not set(desired).issubset(self.ids):
            raise ValueError('custom_labels')
        before = self.get('messages/' + message_id, {'format': 'minimal'})
        if before['threadId'] != thread_id:
            raise ValueError('thread_mismatch')
        current = self.custom(before.get('labelIds', []))
        pending = self.journal.data.setdefault('label_writes', {}).get(journal_key)
        if pending:
            if pending['account'] != self.account or pending['message_id'] != message_id or pending['desired'] != sorted(desired):
                raise ValueError('label_journal_conflict')
            protected = set(pending['protected'])
        else:
            if current != sorted(observed):
                raise ValueError('concurrent_label_change')
            protected = set(before.get('labelIds', [])) - set(self.names)
            self.journal.data['label_writes'][journal_key] = {
                'account': self.account, 'message_id': message_id, 'desired': sorted(desired),
                'protected': sorted(protected)}
            self.journal.save()  # Write ahead before any Gmail mutation.
        if set(before.get('labelIds', [])) - set(self.names) != protected:
            raise ValueError('concurrent_system_label_change')
        if current != sorted(desired):
            desired_ids = {self.ids[x] for x in desired}
            current_ids = set(before.get('labelIds', [])) & set(self.names)
            payload = {'addLabelIds': sorted(desired_ids - current_ids),
                       'removeLabelIds': sorted(current_ids - desired_ids)}
            # Only IDs known to be approved custom labels can reach this endpoint.
            try:
                response = self.session.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/' + message_id + '/modify',
                                             json=payload, timeout=45, allow_redirects=False)
            finally:
                self.persist()
            response.raise_for_status()
            self.write_count = getattr(self, 'write_count', 0) + 1
        after = self.get('messages/' + message_id, {'format': 'minimal'})
        if (after['threadId'] != thread_id or self.custom(after.get('labelIds', [])) != sorted(desired)
                or set(after.get('labelIds', [])) - set(self.names) != protected):
            raise ValueError('label_verification')
        self.journal.data['label_writes'][journal_key]['verified'] = True
        self.journal.save()
        self.verified_count = getattr(self, 'verified_count', 0) + 1
        return sorted(desired)
