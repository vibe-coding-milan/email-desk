#!/usr/bin/env python3
"""Fictional proposal safety checks; no network, credentials or real fixtures."""
import copy
import base64
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('pilot', Path(__file__).resolve().parents[1] / 'scripts/pilot-hosted-reviewer.py')
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)


class ProposalSafety(unittest.TestCase):
    def setUp(self):
        self.threads = [{'account': 'mijatovic@gmail.com', 'thread_id': 'abc', 'candidate_message_ids': ['def']}]
        self.rows = [{'account': 'mijatovic@gmail.com', 'thread_id': 'abc', 'message_ids': ['def'],
                      'labels': ['Home'], 'bucket': 'none', 'summary': '', 'reason': '', 'question': ''}]

    def test_valid_proposal(self):
        pilot.validate_decisions(self.rows, self.threads, ['Home', 'Needs Review'])

    def test_source_and_label_boundaries(self):
        for field, value in [('account', 'other@example.test'), ('thread_id', '999'),
                             ('message_ids', ['sent-context-only']), ('message_ids', []),
                             ('message_ids', ['def', 'def']), ('labels', ['INBOX']),
                             ('labels', ['Invented']), ('labels', []), ('bucket', 'send')]:
            with self.subTest(field=field, value=value):
                rows = copy.deepcopy(self.rows)
                rows[0][field] = value
                with self.assertRaises(ValueError):
                    pilot.validate_decisions(rows, self.threads, ['Home', 'Needs Review'])

    def test_no_missing_or_duplicate_threads(self):
        for rows in [[], self.rows + self.rows]:
            with self.assertRaises(ValueError):
                pilot.validate_decisions(rows, self.threads, ['Home'])

    def test_tabs_and_tables_read_in_document_order(self):
        fixture = {'tabs': [{'documentTab': {'body': {'content': [
            {'paragraph': {'elements': [{'textRun': {'content': 'Title\n'}}]}},
            {'table': {'tableRows': [{'tableCells': [{'content': [
                {'paragraph': {'elements': [{'textRun': {'content': 'Rule\n'}}]}}
            ]}]}]}}
        ]}}}]}
        self.assertEqual(''.join(pilot.text_runs(fixture)), 'Title\nRule\n')

    def test_unapproved_google_host_never_called(self):
        class NoNetwork:
            def get(self, *args, **kwargs):
                raise AssertionError('Network must not be called')
        with self.assertRaises(ValueError):
            pilot.google_get(NoNetwork(), 'https://example.test/collect')

    def part(self, mime, text, **extra):
        return {'mimeType': mime, 'body': {'data': base64.urlsafe_b64encode(text.encode()).decode().rstrip('=')}, **extra}

    def test_html_request_is_read_without_executable_or_hidden_content(self):
        part = self.part('text/html', '<html><head><style>.promo{color:red}</style></head><body>'
                         '<div style="display: none">Long preview hidden text</div>'
                         '<script>fetch("https://example.test/tracker")</script>'
                         '<p>Please send your availability &amp; project photos.</p>'
                         '<p>Reply by Tuesday.</p><img src="https://example.test/pixel"></body></html>')
        self.assertEqual(pilot.body_text(part), 'Please send your availability & project photos.\nReply by Tuesday.')

    def test_alternative_prefers_plain_and_omits_attachments(self):
        alternative = {'mimeType': 'multipart/alternative', 'parts': [
            self.part('text/plain', 'Please confirm.'), self.part('text/html', '<p>Please confirm.</p>')]}
        mixed = {'mimeType': 'multipart/mixed', 'parts': [alternative,
                 self.part('text/plain', 'Private attachment text', filename='private.txt')]}
        self.assertEqual(pilot.body_text(mixed), 'Please confirm.')

    def test_empty_plain_alternative_falls_back_to_html(self):
        self.assertEqual(pilot.body_text({'mimeType': 'multipart/alternative', 'parts': [
            self.part('text/plain', ' '), self.part('text/html', '<p>Full request.</p>')]}), 'Full request.')


if __name__ == '__main__':
    unittest.main()
