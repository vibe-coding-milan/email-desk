#!/usr/bin/env python3
"""Fictional hosted-worker tests. No network, real credentials or real messages."""
import copy
import datetime as dt
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cryptography.fernet import Fernet
from reviewer.engine import Engine, card_from, check_revisions, scan, load_thread, routine_labels
from reviewer.google import Gmail, bounded_json
from reviewer.model import validate, schema, source_key, source_rows, ground_deadlines
from reviewer.state import Journal, UTC, iso, scheduled_slot


class ReaderBoundaries(unittest.TestCase):
    def test_streaming_json_limit_stops_consuming_response(self):
        class Response:
            consumed = 0
            def raise_for_status(self): pass
            def iter_content(self, size):
                for unused in range(100):
                    self.consumed += 1
                    yield b' ' * 65536
        response = Response()
        with self.assertRaisesRegex(ValueError, 'google_response_limit'):
            bounded_json(response)
        self.assertEqual(response.consumed, 81)

    def test_metadata_first_auth_omission_retains_substantive_security_context(self):
        thread = 'abcdef1234567891'
        subjects = ['Your verification code', 'Security alert: suspicious verification code', 'Project photos']
        metadata = {'id': thread, 'messages': [
            {'id': 'abcdef123456789' + str(i + 2), 'threadId': thread, 'internalDate': str(i + 1),
             'payload': {'headers': [{'name': 'Subject', 'value': subject}]}}
            for i, subject in enumerate(subjects)]}
        calls = []
        class Mail:
            def get(self, path, params):
                calls.append((path, params))
                if path.startswith('threads/'): return copy.deepcopy(metadata)
                return copy.deepcopy(next(m for m in metadata['messages'] if path.endswith(m['id'])))
        raw = load_thread(Mail(), thread, [metadata['messages'][0]['id']])
        self.assertEqual(calls[0][1]['format'], 'metadata')
        self.assertEqual([path for path, unused in calls[1:]],
                         ['messages/' + m['id'] for m in metadata['messages'][1:]])
        self.assertEqual(raw['latest_id'], metadata['messages'][-1]['id'])
        with self.assertRaisesRegex(ValueError, 'thread_context_limit'):
            load_thread(Mail(), thread, ['missing-target'])


class Schedule(unittest.TestCase):
    def slot(self, stamp, state=None):
        return scheduled_slot(dt.datetime.fromisoformat(stamp), '2026-01-01T00:00:00+00:00', state or {})

    def test_weekday_weekend_and_latest_slot(self):
        self.assertIn('T13:00:00-05:00', self.slot('2026-11-20T18:01:00+00:00'))
        self.assertIn('T09:00:00-05:00', self.slot('2026-11-21T18:01:00+00:00'))
        self.assertIn('T17:30:00-05:00', self.slot('2026-11-20T23:00:00+00:00'))

    def test_dst_transitions(self):
        self.assertIn('T09:00:00-05:00', self.slot('2026-03-07T14:01:00+00:00'))
        self.assertIn('T09:00:00-04:00', self.slot('2026-03-08T13:01:00+00:00'))
        self.assertIn('T09:00:00-04:00', self.slot('2026-10-31T13:01:00+00:00'))
        self.assertIn('T09:00:00-05:00', self.slot('2026-11-01T14:01:00+00:00'))

    def test_completion_activation_and_retry_backoff(self):
        now = '2026-11-20T18:01:00+00:00'
        key = self.slot(now)
        self.assertIsNone(self.slot(now, {key: {'complete': True}}))
        self.assertIsNone(self.slot(now, {key: {'attempts': 3}}))
        self.assertIsNone(self.slot(now, {key: {'last_attempt': '2026-11-20T18:00:00+00:00'}}))
        self.assertEqual(self.slot('2026-11-20T18:16:00+00:00', {key: {'last_attempt': '2026-11-20T18:00:00+00:00'}}), key)
        self.assertIsNone(scheduled_slot(dt.datetime.fromisoformat(now), '2026-11-20T19:00:00+00:00', {}))


class EncryptedJournal(unittest.TestCase):
    def test_atomic_encryption_restart_and_exclusive_lock(self):
        with tempfile.TemporaryDirectory() as raw:
            directory = Path(raw)
            (directory / 'token-encryption.key').write_bytes(Fernet.generate_key())
            os.chmod(directory / 'token-encryption.key', 0o600)
            with Journal(directory) as journal:
                journal.data['fictional'] = 'Never store this plaintext marker'
                journal.save()
                self.assertNotIn(b'Never store', journal.path.read_bytes())
                self.assertEqual(journal.path.stat().st_mode & 0o777, 0o600)
                with self.assertRaisesRegex(RuntimeError, 'already_running'):
                    with Journal(directory):
                        pass
            with Journal(directory) as journal:
                self.assertEqual(journal.data['fictional'], 'Never store this plaintext marker')


class FakeJournal:
    def __init__(self):
        self.data = {}
        self.saves = 0

    def save(self):
        self.saves += 1


class LabelBoundary(unittest.TestCase):
    def gmail(self, before, after, timeout=False):
        client = Gmail.__new__(Gmail)
        client.account = 'mijatovic@gmail.com'
        client.ids = {'Home': 'Label_home', 'Needs Review': 'Label_review'}
        client.names = {v: k for k, v in client.ids.items()}
        client.journal = FakeJournal()
        calls = []
        messages = iter([before, after])
        client.get = lambda *unused: copy.deepcopy(next(messages))
        client.persist = lambda: None

        class Session:
            def post(self, url, **kwargs):
                self.assert_write_ahead = bool(client.journal.data.get('label_writes'))
                calls.append((url, kwargs))
                if timeout:
                    raise TimeoutError()

                class Response:
                    def raise_for_status(self):
                        pass
                return Response()
        client.session = Session()
        return client, calls

    def message(self, labels):
        return {'id': 'abcdef1234567890', 'threadId': 'abcdef1234567891', 'labelIds': labels}

    def test_exact_custom_delta_preserves_system_and_unknown_labels(self):
        protected = ['INBOX', 'UNREAD', 'STARRED', 'CATEGORY_PERSONAL', 'Label_unknown']
        client, calls = self.gmail(self.message(protected + ['Label_review']), self.message(protected + ['Label_home']))
        actual = client.apply('abcdef1234567890', 'abcdef1234567891', ['Home'], ['Needs Review'], 'test-operation')
        self.assertEqual(actual, ['Home'])
        self.assertEqual(calls[0][1]['json'], {'addLabelIds': ['Label_home'], 'removeLabelIds': ['Label_review']})
        self.assertTrue(client.session.assert_write_ahead)
        self.assertTrue(client.journal.data['label_writes']['test-operation']['verified'])

    def test_system_label_or_concurrent_custom_change_rejected_before_post(self):
        for desired, observed in [(['INBOX'], ['Needs Review']), (['Home'], ['Home'])]:
            client, calls = self.gmail(self.message(['INBOX', 'Label_review']), self.message(['INBOX', 'Label_home']))
            with self.assertRaises(ValueError):
                client.apply('abcdef1234567890', 'abcdef1234567891', desired, observed, 'test-operation')
            self.assertEqual(calls, [])

    def test_uncertain_write_is_journaled_and_readback_reconciles_without_second_post(self):
        client, calls = self.gmail(self.message(['INBOX', 'Label_review']), self.message(['INBOX', 'Label_home']), True)
        with self.assertRaises(TimeoutError):
            client.apply('abcdef1234567890', 'abcdef1234567891', ['Home'], ['Needs Review'], 'test-operation')
        pending = copy.deepcopy(client.journal.data)
        replay, replay_calls = self.gmail(self.message(['INBOX', 'Label_home']), self.message(['INBOX', 'Label_home']))
        replay.journal.data = pending
        self.assertEqual(replay.apply('abcdef1234567890', 'abcdef1234567891', ['Home'], ['Needs Review'], 'test-operation'), ['Home'])
        self.assertEqual(replay_calls, [])

    def test_changed_system_label_fails_verification(self):
        client, unused = self.gmail(self.message(['INBOX', 'UNREAD', 'Label_review']), self.message(['INBOX', 'Label_home']))
        with self.assertRaisesRegex(ValueError, 'label_verification'):
            client.apply('abcdef1234567890', 'abcdef1234567891', ['Home'], ['Needs Review'], 'test-operation')
        self.assertNotIn('verified', client.journal.data['label_writes']['test-operation'])


class ProposalAndCoverage(unittest.TestCase):
    def test_routine_proposals_never_authorize_removal_and_owner_corrections_remain_exact(self):
        source = {'id': 'fictional', 'observed_custom': ['Work', 'Needs Review']}
        self.assertEqual(routine_labels(['Home'], source, None), ['Home', 'Needs Review', 'Work'])
        old = {'message_ids': ['fictional'], 'user_labels': ['Financial']}
        self.assertEqual(routine_labels(['Home'], source, old), ['Financial'])
        self.assertEqual(routine_labels(['Home'], {**source, 'id': 'new-message'}, old), ['Home', 'Needs Review', 'Work'])

    def setUp(self):
        self.thread = {'account': 'mijatovic@gmail.com', 'thread_id': 'abcdef1234567891',
                       'candidate_message_ids': ['abcdef1234567890'], 'existing_card': None,
                       'messages': [{'id': 'abcdef1234567890', 'internal_date': '1795200000000',
                                     'subject': 'Fictional request', 'sender': 'Example <a@example.test>',
                                     'text': 'Please reply by Tuesday.'}]}
        self.row = {'account': self.thread['account'], 'thread_id': self.thread['thread_id'],
                    'messages': [{'id': 'abcdef1234567890', 'labels': ['Home']}], 'bucket': 'action',
                    'description': 'A fictional request needs a reply.', 'reason': 'The sender asked.',
                    'deadline': '', 'deadline_evidence': '', 'question': '', 'reopen_reason': '', 'new_request_ids': []}

    def test_unknown_message_label_and_invented_deadline_rejected(self):
        validate([self.row], [self.thread], ['Home'])
        for kind in ['message', 'label', 'deadline']:
            row = copy.deepcopy(self.row)
            if kind == 'message': row['messages'][0]['id'] = 'sent-context'
            if kind == 'label': row['messages'][0]['labels'] = ['INBOX']
            if kind == 'deadline': row.update(deadline='Tomorrow', deadline_evidence='Invented evidence')
            with self.assertRaises(ValueError): validate([row], [self.thread], ['Home'])

    def test_schema_requires_every_target_and_normalizes_trusted_source(self):
        self.thread['candidate_message_ids'].append('second-target')
        shaped = schema(['Home'], [self.thread])
        decisions = shaped['properties']['decisions']
        key = source_key(self.thread)
        self.assertEqual(decisions['required'], [key])
        messages = decisions['properties'][key]['properties']['messages']
        self.assertEqual(messages['required'], self.thread['candidate_message_ids'])
        self.assertFalse(messages['additionalProperties'])
        proposal = {k: v for k, v in self.row.items() if k not in {'account', 'thread_id', 'messages'}}
        proposal['messages'] = {mid: ['Home'] for mid in self.thread['candidate_message_ids']}
        payload = {'decisions': {key: proposal}}
        rows = source_rows(payload, [self.thread])
        validate(rows, [self.thread], ['Home'])
        self.assertEqual(rows[0]['account'], self.thread['account'])
        self.assertEqual([m['id'] for m in rows[0]['messages']], self.thread['candidate_message_ids'])
        proposal['messages']['context-only'] = ['Home']
        with self.assertRaisesRegex(ValueError, 'decision_targets'):
            source_rows(payload, [self.thread])

        del proposal['messages']['context-only']
        del proposal['messages']['second-target']
        with self.assertRaisesRegex(ValueError, 'decision_targets'):
            source_rows(payload, [self.thread])

    def test_unsupported_deadline_becomes_explicit_uncertainty_without_coverage_failure(self):
        row = copy.deepcopy(self.row)
        row.update(deadline='Tuesday', deadline_evidence='Please reply by Tuesday.')
        self.assertEqual(ground_deadlines([row], [self.thread]), 0)
        validate([row], [self.thread], ['Home'])
        row.update(deadline='Tomorrow', deadline_evidence='Fictional unsupported quote',
                   description='Reply Tomorrow', reason='Due Tomorrow')
        self.assertEqual(ground_deadlines([row], [self.thread]), 1)
        self.assertEqual(row['deadline'], '')
        self.assertEqual(row['deadline_evidence'], '')
        self.assertIn('could not be verified', row['question'])
        self.assertNotIn('Tomorrow', row['description'] + row['reason'])
        self.assertEqual(row['messages'], self.row['messages'])
        validate([row], [self.thread], ['Home'])

    def test_closed_card_not_resurfaced_without_materially_new_source(self):
        self.thread['existing_card'] = {'state': 'handled', 'message_ids': ['abcdef1234567890'], 'updated_at': '2026-11-20T00:00:00+00:00'}
        self.assertIsNone(card_from(self.row, self.thread))
        self.row.update(reopen_reason='New request', new_request_ids=['abcdef1234567890'])
        with self.assertRaisesRegex(ValueError, 'reopen_evidence'):
            validate([self.row], [self.thread], ['Home'])

    def test_revision_change_detected_and_new_card_guarded(self):
        check_revisions({'fictional': 2, 'new': 0}, {'cards': [{'id': 'fictional', 'revision': 2}]})
        for cards in [[{'id': 'fictional', 'revision': 3}], [{'id': 'fictional', 'revision': 2}, {'id': 'new', 'revision': 1}]]:
            with self.assertRaisesRegex(ValueError, 'board_revision_changed'):
                check_revisions({'fictional': 2, 'new': 0}, {'cards': cards})

    def test_pagination_skips_processed_messages_without_advancing_incomplete_coverage(self):
        class Mail:
            def __init__(self): self.calls = 0
            def get(self, unused, params):
                self.calls += 1
                return ({'messages': [{'id': 'done'}], 'nextPageToken': 'page2'} if self.calls == 1 else
                        {'messages': [{'id': 'new1'}, {'id': 'new2'}]})
        found, complete = scan(Mail(), 'fictional query', {'done': True}, 1, 3)
        self.assertEqual(found, [{'id': 'new1'}])
        self.assertFalse(complete)
        found, complete = scan(Mail(), 'fictional query', {'done': True}, 2, 3)
        self.assertEqual(len(found), 2)
        self.assertTrue(complete)


class FakeBridge:
    def __init__(self, fail_final_ack=False):
        self.cards, self.operations, self.checkpoints = {}, {}, {}
        self.fail_final_ack = fail_final_ack

    def call(self, payload):
        action = payload['action']
        if action == 'board':
            return {'cards': copy.deepcopy(list(self.cards.values())), 'capabilities': {'publish_revisions': True},
                    'checkpoints': copy.deepcopy(self.checkpoints)}
        if action == 'feedback': return {'feedback': [], 'remaining': 0}
        if action != 'publish': raise AssertionError('Unexpected bridge action')
        op = payload['operation_id']
        if op in self.operations:
            old, result = self.operations[op]
            if old != payload: raise ValueError('operation_reused')
            return copy.deepcopy(result)
        for card in payload['cards']:
            import hashlib
            key = hashlib.sha256((card['account'] + ':' + card['thread_id']).encode()).hexdigest()
            old = self.cards.get(key, {})
            if payload.get('expected_revisions', {}).get(key) != old.get('revision', 0): raise ValueError('conflict')
            self.cards[key] = {**old, **card, 'id': key, 'revision': old.get('revision', 0) + 1,
                               'state': old.get('state', 'open'), 'user_labels': old.get('user_labels'),
                               'updated_at': iso()}
        self.checkpoints.update(payload['run'].get('checkpoints', {}))
        result = {'created': len(payload['cards']), 'updated': 0, 'run': {**payload['run'], 'finished_at': iso()}}
        self.operations[op] = copy.deepcopy(payload), copy.deepcopy(result)
        if self.fail_final_ack and op.startswith('hosted_finish_'):
            self.fail_final_ack = False
            raise RuntimeError('bridge_unavailable')  # Commit happened, acknowledgement was lost.
        return result


class FakeGmail:
    def __init__(self, account, fail=False):
        self.account, self.fail, self.writes = account, fail, []
        self.id = 'abcdef1234567890' if account.startswith('mijatovic@') else 'bcdefa1234567890'
        self.thread = self.id[:-1] + '1'

    def master(self):
        return {'body': {'content': [{'paragraph': {'elements': [{'textRun': {
            'content': 'Email Organization Playbook\n' + 'Fictional rules. ' * 100}}]}}]}}

    def get(self, path, params=None):
        if self.fail: raise RuntimeError('fictional_account_failure')
        if path == 'messages': return {'messages': [{'id': self.id, 'threadId': self.thread}]}
        if path.startswith('threads/'):
            import base64
            return {'id': self.thread, 'messages': [{'id': self.id, 'threadId': self.thread, 'internalDate': '1795200000000', 'labelIds': ['INBOX'],
                'payload': {'mimeType': 'text/plain', 'headers': [{'name': 'Subject', 'value': 'Fictional photo request'},
                            {'name': 'From', 'value': 'Example <a@example.test>'}],
                            'body': {'data': base64.urlsafe_b64encode(b'Please send project photos.').decode()}}}]}
        if path.startswith('messages/'):
            return self.get('threads/' + self.thread)['messages'][0]
        raise AssertionError(path)

    def custom(self, ids): return ['Needs Review'] if 'Label_review' in ids else []

    def apply(self, message, thread, desired, observed, key):
        self.writes.append((message, desired))
        return desired


class FakeModel:
    calls = 0
    def __init__(self, *unused): pass
    def classify(self, threads, master):
        type(self).calls += 1
        return [{'account': t['account'], 'thread_id': t['thread_id'],
                 'messages': [{'id': mid, 'labels': ['Home']} for mid in t['candidate_message_ids']],
                 'bucket': 'action', 'description': 'Send the requested project photos.', 'reason': 'A direct request is outstanding.',
                 'deadline': '', 'deadline_evidence': '', 'question': '', 'reopen_reason': '', 'new_request_ids': []} for t in threads]


class EngineIntegration(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.directory = Path(self.temporary.name)
        (self.directory / 'token-encryption.key').write_bytes(Fernet.generate_key())
        os.chmod(self.directory / 'token-encryption.key', 0o600)
        self.slot = '2026-11-20T13:00:00-05:00'
        self.config = {'activated_at': '2026-11-20T00:00:00+00:00', 'messages_per_account': 2,
                       'max_pages': 2, 'max_context_bytes': 80000}
        self.clients = {account: FakeGmail(account) for account in ['mijatovic@gmail.com', 'milan@mijatovic.com']}
        self.patch = patch('reviewer.engine.Model', FakeModel)
        self.patch.start()
        FakeModel.calls = 0

    def tearDown(self):
        self.patch.stop()
        self.temporary.cleanup()

    def prepare(self, journal):
        journal.data['slots'][self.slot] = {'attempts': 1}
        for account in self.clients:
            journal.data['accounts'][account] = {'done': {}, 'backfill_complete': True}
        journal.save()

    def test_complete_review_verifies_targets_then_publishes_and_advances_both_cursors(self):
        bridge = FakeBridge()
        with Journal(self.directory) as journal:
            self.prepare(journal)
            result = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot).run()
            self.assertEqual({key: result[key] for key in ['status', 'processed', 'errors']},
                             {'status': 'success', 'processed': 2, 'errors': 0})
            self.assertTrue(result['publication_verified'])
            self.assertEqual(len(bridge.cards), 2)
            for account, client in self.clients.items():
                self.assertEqual(client.writes, [(client.id, ['Home'])])
                self.assertIn(client.id, journal.data['accounts'][account]['done'])
                self.assertIn('cursor', journal.data['accounts'][account])

    def test_failed_account_never_advances_its_cursor_or_erases_other_cards(self):
        self.clients['milan@mijatovic.com'].fail = True
        # Master remains available; simulate failure confined to mail coverage.
        bridge = FakeBridge()
        with Journal(self.directory) as journal:
            self.prepare(journal)
            result = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot).run()
            self.assertEqual(result['status'], 'partial')
            self.assertEqual(len(bridge.cards), 1)
            self.assertIn('cursor', journal.data['accounts']['mijatovic@gmail.com'])
            self.assertNotIn('cursor', journal.data['accounts']['milan@mijatovic.com'])
            self.assertEqual(journal.data['slots'][self.slot]['issues'][0]['code'], 'review_failed')

    def test_uncertain_final_ack_replays_exact_publication_before_cursor_commit(self):
        bridge = FakeBridge(fail_final_ack=True)
        with Journal(self.directory) as journal:
            self.prepare(journal)
            with self.assertRaisesRegex(RuntimeError, 'bridge_unavailable'):
                Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot).run()
            self.assertIn('pending_final', journal.data)
            for account in self.clients: self.assertNotIn('cursor', journal.data['accounts'][account])
        calls = FakeModel.calls
        with Journal(self.directory) as journal:
            engine = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot)
            engine.recover_publication()
            self.assertNotIn('pending_final', journal.data)
            self.assertNotIn('pending_publication', journal.data)
            self.assertEqual(FakeModel.calls, calls)
            for account in self.clients: self.assertIn('cursor', journal.data['accounts'][account])

    def test_dry_run_has_no_label_or_board_writes_and_no_coverage_commit(self):
        bridge = FakeBridge()
        with Journal(self.directory) as journal:
            self.prepare(journal)
            result = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot, dry=True).run()
            self.assertEqual(result['gmail_changes'], 0)
            self.assertEqual(result['board_writes'], 0)
            self.assertEqual(bridge.cards, {})
            for account, client in self.clients.items():
                self.assertEqual(client.writes, [])
                self.assertEqual(journal.data['accounts'][account]['done'], {})
                self.assertNotIn('cursor', journal.data['accounts'][account])

    def feedback_bridge(self, requested):
        bridge = FakeBridge()
        account = 'mijatovic@gmail.com'
        client = self.clients[account]
        import hashlib
        key = hashlib.sha256((account + ':' + client.thread).encode()).hexdigest()
        bridge.cards[key] = {'id': key, 'revision': 1, 'account': account, 'thread_id': client.thread,
                             'message_ids': [client.id], 'state': 'handled', 'latest_feedback_id': 9,
                             'user_labels': requested, 'comments': [{'text': 'Fictional saved owner context'}]}
        events = [{'id': 9, 'card_id': key, 'account': account, 'thread_id': client.thread,
                   'message_ids': [client.id], 'requested_labels': requested}]
        original = bridge.call
        bridge.acknowledgements = []
        def call(payload):
            if payload['action'] == 'feedback': return {'feedback': events, 'remaining': 0}
            if payload['action'] == 'acknowledge':
                bridge.acknowledgements.append(copy.deepcopy(payload))
                return {'ok': True}
            return original(payload)
        bridge.call = call
        return bridge, key

    def test_failed_feedback_blocks_account_cursors_and_preserves_handled_context(self):
        bridge, key = self.feedback_bridge(['Home'])
        self.clients['mijatovic@gmail.com'].apply = lambda *args: (_ for _ in ()).throw(ValueError('label_verification'))
        with Journal(self.directory) as journal:
            self.prepare(journal)
            self.slot = 'manual-feedback-test'
            journal.data['slots'][self.slot] = {'attempts': 1}
            journal.data['accounts']['mijatovic@gmail.com']['backfill_complete'] = False
            result = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot).run()
            state = journal.data['accounts']['mijatovic@gmail.com']
            self.assertNotEqual(result['status'], 'success')
            self.assertEqual(bridge.acknowledgements[0]['status'], 'error')
            self.assertNotIn('cursor', state)
            self.assertNotIn('backfill_end', state)
            self.assertEqual(bridge.cards[key]['state'], 'handled')
            self.assertEqual(bridge.cards[key]['comments'][0]['text'], 'Fictional saved owner context')

    def test_context_only_and_superseded_feedback_never_modify_gmail(self):
        for newer in [False, True]:
            bridge, key = self.feedback_bridge(None)
            if newer: bridge.cards[key]['latest_feedback_id'] = 10
            with Journal(self.directory) as journal:
                engine = Engine(journal, bridge, self.clients, ['Home', 'Needs Review'], self.config, self.slot)
                engine.board = bridge.call({'action': 'board'})
                self.assertEqual(engine.reconcile_feedback(), 0)
                self.assertEqual(bridge.acknowledgements[0]['status'], 'superseded' if newer else 'recorded')
                self.assertTrue(all(not client.writes for client in self.clients.values()))


if __name__ == '__main__':
    unittest.main()
