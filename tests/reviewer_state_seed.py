#!/usr/bin/env python3
"""Fictional initial-state imports; no private fixtures or remote reads."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('seed', Path(__file__).resolve().parents[1] / 'scripts/prepare-reviewer-state.py')
seed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed)


class StateImport(unittest.TestCase):
    def checkpoints(self):
        return {a: '2026-11-01T14:00:00+00:00' for a in seed.ACCOUNTS}

    def test_imports_only_verified_incoming_ids_and_leaves_backfill_incomplete(self):
        entries = [{'message_id': 'abcdef1234567890', 'status': 'verified', 'actual_label_ids': ['INBOX'],
                    'body': 'Fictional body must not be imported', 'desired_names': ['Home']},
                   {'message_id': 'abcdef1234567891', 'status': 'pending', 'actual_label_ids': ['INBOX']},
                   {'message_id': 'abcdef1234567892', 'status': 'verified', 'actual_label_ids': ['SENT']},
                   {'message_id': 'abcdef1234567893', 'status': 'verified'}]
        state = seed.build_state([{'accounts': [{'account': 'mijatovic@gmail.com', 'entries': entries}]}], self.checkpoints())
        self.assertEqual(set(state['accounts']['mijatovic@gmail.com']['done']), {'abcdef1234567890'})
        self.assertNotIn('Fictional body', str(state))
        self.assertNotIn('Home', str(state))
        self.assertFalse(state['accounts']['mijatovic@gmail.com']['backfill_complete'])
        self.assertEqual(state['slots'], {})
        self.assertEqual(state['usage'], [])

    def test_missing_unzoned_or_future_checkpoint_refused(self):
        for cursor in [None, '2026-11-01T14:00:00', '2999-01-01T00:00:00+00:00']:
            checkpoints = self.checkpoints()
            checkpoints['mijatovic@gmail.com'] = cursor
            with self.assertRaises(ValueError): seed.build_state([], checkpoints)

    def test_account_identity_does_not_merge_progress(self):
        state = seed.build_state([{'accounts': [{'account': 'unknown@example.test', 'entries': [
            {'message_id': 'abcdef1234567890', 'status': 'verified', 'actual_label_ids': ['INBOX']}]}]}], self.checkpoints())
        self.assertTrue(all(not a['done'] for a in state['accounts'].values()))


if __name__ == '__main__': unittest.main()
