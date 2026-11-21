"""Deterministic review orchestration; models propose, this module validates/applies."""
import datetime as dt
import hashlib
import json
import re

from .content import body_text, text_runs
from .google import ACCOUNTS, IDENTIFIER
from .model import Model
from .state import UTC, iso, operation

AUTH = re.compile(r'\bone[- ]time\b|verification code|sign.in code|passcode|magic link', re.I)


def routine_authentication(subject):
    return bool(AUTH.search(subject)) and not re.search(r'new login|security alert|password (changed|reset)|suspicious', subject, re.I)


def load_thread(gmail, thread_id, target_ids, metadata=None):
    raw = metadata or gmail.get('threads/' + thread_id, {'format': 'metadata', 'metadataHeaders': ['From', 'Subject', 'Date']})
    if raw.get('id') != thread_id or not raw.get('messages'):
        raise ValueError('thread_mismatch')
    ordered = sorted(raw['messages'], key=lambda m: int(m['internalDate']))
    wanted = set(target_ids) | {m['id'] for m in ordered[-18:]}
    selected = [m for m in ordered if m['id'] in wanted]
    if len(selected) > 40 or not set(target_ids).issubset({m['id'] for m in selected}):
        raise ValueError('thread_context_limit')
    messages = []
    for message in selected:
        headers = {h['name'].lower(): h['value'] for h in message.get('payload', {}).get('headers', [])}
        # Routine code messages need only metadata; their contents are never fetched.
        full = message if routine_authentication(headers.get('subject', '')) else gmail.get('messages/' + message['id'], {'format': 'full'})
        if full['threadId'] != thread_id:
            raise ValueError('thread_mismatch')
        messages.append(full)
    return {'id': raw['id'], 'messages': messages, 'latest_id': ordered[-1]['id']}


def scan(gmail, query, done, limit, max_pages):
    found, token = [], None
    for unused in range(max_pages):
        params = {'q': query, 'maxResults': 100}
        if token:
            params['pageToken'] = token
        page = gmail.get('messages', params)
        for message in page.get('messages', []):
            if message['id'] not in done:
                if len(found) >= limit:
                    return found, False
                found.append(message)
        token = page.get('nextPageToken')
        if not token:
            return found, True
    return found, False


def context_thread(account, raw, target_ids, old, gmail):
    targets = set(target_ids)
    ordered = sorted(raw['messages'], key=lambda m: int(m['internalDate']))
    selected = [m for m in ordered if m['id'] in targets or m in ordered[-18:]]
    if len(selected) > 40 or not targets.issubset({m['id'] for m in selected}):
        raise ValueError('thread_context_limit')
    messages = []
    for message in selected:
        headers = {h['name'].lower(): h['value'] for h in message.get('payload', {}).get('headers', [])}
        labels = message.get('labelIds', [])
        if message['id'] in targets and set(labels) & {'SENT', 'DRAFT', 'SPAM', 'TRASH'}:
            raise ValueError('incoming_target_changed')
        subject = headers.get('subject', '')
        authentication = routine_authentication(subject)
        text = body_text(message.get('payload', {})) or message.get('snippet', '')
        if authentication:
            text = '[Routine authentication details omitted]'
            subject = '[Routine authentication message]'
        text = re.sub(r'https?://\S+', '[URL omitted]', text)
        text = re.sub(r'(?i)((?:code|passcode|otp)\s*[:=-]?\s*)[A-Z0-9-]{4,}', r'\1[code omitted]', text)
        if len(text) > 12000:
            text = text[:8000] + '\n[Middle of message omitted]\n' + text[-4000:]
        messages.append({'id': message['id'], 'internal_date': message['internalDate'],
                         'date': headers.get('date', ''), 'sender': headers.get('from', ''),
                         'subject': subject, 'text': text, 'authentication': authentication,
                         'observed_custom': gmail.custom(labels), 'is_sent': 'SENT' in labels})
    return {'account': account, 'thread_id': raw['id'], 'candidate_message_ids': list(target_ids),
            'messages': messages, 'existing_card': old, 'thread_version': raw.get('latest_id', ordered[-1]['id']),
            'context_note': 'Targets plus latest 18 messages; maximum 40. Long message middles/URLs/authentication details and all attachments omitted.'}


def revisions(threads):
    return {hashlib.sha256((t['account'] + ':' + t['thread_id']).encode()).hexdigest():
            t['existing_card']['revision'] if t.get('existing_card') else 0 for t in threads}


def check_revisions(expected, board):
    current = {c['id']: c['revision'] for c in board['cards']}
    if any(current.get(key, 0) != value for key, value in expected.items()):
        raise ValueError('board_revision_changed')


def card_from(row, thread):
    old = thread.get('existing_card')
    if old and old['state'] != 'open' and not row['reopen_reason']:
        return None
    if row['bucket'] == 'none' and not (old and old['state'] == 'open' and row['description'].strip() and row['reason'].strip()):
        return None
    incoming = [m for m in thread['messages'] if m['id'] in thread['candidate_message_ids']]
    latest = max(incoming, key=lambda m: int(m['internal_date']))
    message_ids = list(dict.fromkeys((old['message_ids'] if old else []) + thread['candidate_message_ids']))
    if len(message_ids) > 100:
        raise ValueError('card_message_limit')
    category = row['bucket'] if row['bucket'] != 'none' else old['category']
    return {'account': row['account'], 'thread_id': row['thread_id'], 'message_ids': message_ids,
            'subject': latest['subject'] or '(No subject)', 'sender': latest['sender'] or row['account'],
            'date': dt.datetime.fromtimestamp(int(latest['internal_date']) / 1000, UTC).isoformat(),
            'description': row['description'], 'reason': row['reason'], 'category': category,
            'labels': sorted(set(label for m in row['messages'] for label in m['labels'])),
            'deadline': row['deadline'], 'question': row['question'], 'reopen_reason': row['reopen_reason']}


class Engine:
    def __init__(self, journal, bridge, clients, labels, config, slot, dry=False):
        self.journal, self.bridge, self.clients = journal, bridge, clients
        self.labels, self.config, self.slot, self.dry = labels, config, slot, dry
        self.model = Model(journal, slot, labels, config)
        self.board = None
        self.feedback_failed = set()

    def publish(self, payload):
        self.journal.data['pending_publication'] = payload
        self.journal.save()
        result = self.bridge.call(payload)
        actual = self.bridge.call({'action': 'board'})
        present = {c['id']: c for c in actual['cards']}
        for card in payload['cards']:
            key = hashlib.sha256((card['account'] + ':' + card['thread_id']).encode()).hexdigest()
            if key not in present or not set(card['message_ids']).issubset(present[key]['message_ids']):
                raise ValueError('publication_readback')
        self.board = actual
        self.journal.data.pop('pending_publication', None)
        self.journal.save()
        return result

    def recover_publication(self):
        try:
            if self.journal.data.get('pending_publication'):
                self.publish(self.journal.data['pending_publication'])
            if self.journal.data.get('pending_batch'):
                self.apply_batch(self.journal.data['pending_batch'])
            if self.journal.data.get('pending_final'):
                final = self.journal.data['pending_final']
                self.publish(final['payload'])
                self.finish_state(final)
        except Exception as error:
            if not self.abandon_conflict(error):
                raise

    def abandon_conflict(self, error):
        if str(error) not in {'conflict', 'board_revision_changed', 'concurrent_label_change', 'concurrent_system_label_change'}:
            return False
        # Known rejected/stale work is not retried over a newer owner decision.
        self.journal.seal(self.journal.directory / ('superseded-' + operation('audit', iso()) + '.encrypted'),
                          {'at': iso(), 'reason': str(error), 'batch': self.journal.data.get('pending_batch'),
                           'publication': self.journal.data.get('pending_publication')})
        for field in ['pending_batch', 'pending_publication', 'pending_final']:
            self.journal.data.pop(field, None)
        self.journal.save()
        self.board = self.bridge.call({'action': 'board'})
        return True

    def finish_state(self, final):
        for account, changes in final['updates'].items():
            self.journal.data['accounts'][account].update(changes)
        self.journal.data['slots'][final['slot']]['complete'] = final['complete']
        self.journal.data.pop('pending_final', None)
        self.journal.save()

    def reconcile_feedback(self):
        queue = self.bridge.call({'action': 'feedback'})
        cards = {c['id']: c for c in self.board['cards']}
        errors = 0
        for event in queue['feedback']:
            card = cards.get(event['card_id'])
            ack = {'action': 'acknowledge', 'feedback_id': event['id']}
            if not card or card.get('latest_feedback_id') != event['id']:
                ack.update(status='superseded', explanation='A newer saved correction supersedes this event; notes remain preserved.')
            elif event['requested_labels'] is None:
                ack.update(status='recorded', explanation='Saved board context recorded for later reviews; no Gmail change requested.')
            else:
                try:
                    desired = event['requested_labels']
                    if not set(desired).issubset(self.labels):
                        raise ValueError('feedback_labels')
                    check_revisions({card['id']: card['revision']}, self.bridge.call({'action': 'board'}))
                    gmail = self.clients[event['account']]
                    for message_id in event['message_ids']:
                        check_revisions({card['id']: card['revision']}, self.bridge.call({'action': 'board'}))
                        message = gmail.get('messages/' + message_id, {'format': 'minimal'})
                        gmail.apply(message_id, event['thread_id'], desired, gmail.custom(message.get('labelIds', [])),
                                    operation('feedback', event['id'] + message_id))
                    ack.update(status='applied', explanation='Requested custom labels verified on every exact message; system labels preserved.', actual_labels=sorted(desired))
                except Exception:
                    errors += 1
                    self.feedback_failed.add(event['account'])
                    ack.update(status='error', explanation='Label correction could not be safely verified; it remains queued for review.')
            ack['operation_id'] = operation('ack', json.dumps(ack, sort_keys=True))
            self.bridge.call(ack)
            self.board = self.bridge.call({'action': 'board'})
            cards = {c['id']: c for c in self.board['cards']}
        return errors + queue.get('remaining', 0)

    def apply_batch(self, batch):
        # A successful replay returns its original acknowledgement before revisions are checked.
        if batch.get('publication_prepared'):
            self.publish(batch['payload'])
        else:
            check_revisions(batch['revisions'], self.bridge.call({'action': 'board'}))
            for row, thread in zip(batch['rows'], batch['threads']):
                gmail = self.clients[row['account']]
                old = thread.get('existing_card')
                for proposed in row['messages']:
                    source = next(m for m in thread['messages'] if m['id'] == proposed['id'])
                    desired = proposed['labels']
                    if old and old.get('user_labels') is not None and proposed['id'] in old['message_ids']:
                        desired = old['user_labels']
                    gmail.apply(proposed['id'], row['thread_id'], desired, source['observed_custom'],
                                operation('label', batch['id'] + row['account'] + proposed['id']))
                # Detect a correction made during Gmail application before publishing.
                check_revisions(batch['revisions'], self.bridge.call({'action': 'board'}))
            batch['publication_prepared'] = True
            self.journal.data['pending_batch'] = batch
            self.journal.save()
            self.publish(batch['payload'])
        for thread in batch['threads']:
            account = self.journal.data['accounts'][thread['account']]
            for message_id in thread['candidate_message_ids']:
                account.setdefault('done', {})[message_id] = iso()
            account.setdefault('thread_versions', {})[thread['thread_id']] = thread['thread_version']
        self.journal.data.pop('pending_batch', None)
        self.journal.save()

    def classify_batch(self, threads, master):
        rows = self.model.classify(threads, master)
        by_key = {(r['account'], r['thread_id']): r for r in rows}
        rows = [by_key[t['account'], t['thread_id']] for t in threads]
        for row, thread in zip(rows, threads):
            old = thread.get('existing_card')
            if old and old.get('user_labels') is not None:
                for proposed in row['messages']:
                    if proposed['id'] in old['message_ids']:
                        proposed['labels'] = old['user_labels']
        batch_id = operation('batch', self.slot + json.dumps([(t['account'], t['candidate_message_ids']) for t in threads]))
        cards = [card for row, thread in zip(rows, threads) if (card := card_from(row, thread))]
        expected = revisions(threads)
        payload = {'action': 'publish', 'operation_id': batch_id, 'cards': cards,
                   'expected_revisions': {c: expected[c] for c in expected if any(
                       hashlib.sha256((n['account'] + ':' + n['thread_id']).encode()).hexdigest() == c for n in cards)},
                   'run': {'status': 'partial', 'summary': 'Bounded review batch verified; account coverage is still being reconciled.', 'checkpoints': {}}}
        batch = {'id': batch_id, 'threads': threads, 'rows': rows, 'revisions': expected, 'payload': payload}
        if self.dry:
            self.journal.seal(self.journal.directory / 'validation-last.encrypted', batch)
        else:
            self.journal.data['pending_batch'] = batch
            self.journal.save()
            self.apply_batch(batch)

    def run(self):
        self.board = self.bridge.call({'action': 'board'})
        if not self.board.get('capabilities', {}).get('publish_revisions') and not self.dry:
            raise ValueError('revision_capability_required')
        if not self.dry:
            self.recover_publication()
        errors = self.reconcile_feedback() if not self.dry else 0
        master = ''.join(text_runs(self.clients['milan@mijatovic.com'].master()))
        if len(master) < 1000 or 'Email Organization Playbook' not in master:
            raise ValueError('master_unavailable')
        now = dt.datetime.now(UTC)
        checkpoints, complete, updates, processed = {}, {}, {}, 0
        old_cards = {(c['account'], c['thread_id']): c for c in self.board['cards']}
        for account, gmail in self.clients.items():
            state = self.journal.data['accounts'].setdefault(account, {'done': {}})
            try:
                lower = dt.datetime.fromisoformat(state.get('cursor', iso(now - dt.timedelta(days=3)))) - dt.timedelta(hours=2)
                query = f'after:{int(lower.timestamp())} before:{int(now.timestamp())} -in:spam -in:trash -in:sent -in:drafts'
                messages, recent_complete = scan(gmail, query, state['done'], self.config['messages_per_account'], self.config['max_pages'])
                historical_complete = state.get('backfill_complete', False)
                backfill_lower = None
                if ('T09:00:' in self.slot or self.slot.startswith('manual')) and len(messages) < self.config['messages_per_account']:
                    end = dt.datetime.fromisoformat(state.get('backfill_end', iso(now - dt.timedelta(days=3))))
                    floor = dt.datetime.fromisoformat(self.config['activated_at']) - dt.timedelta(days=90)
                    backfill_lower = max(floor, end - dt.timedelta(days=7))
                    if end > floor:
                        older, historical_complete = scan(gmail, f'after:{int(backfill_lower.timestamp())} before:{int(end.timestamp())} -in:spam -in:trash -in:sent -in:drafts',
                                                          state['done'], self.config['messages_per_account'] - len(messages), self.config['max_pages'])
                        messages += older
                    else:
                        historical_complete = True
                grouped = {}
                for message in {m['id']: m for m in messages}.values():
                    grouped.setdefault(message['threadId'], []).append(message['id'])
                refreshed = {}
                watched = [c for c in self.board['cards'] if c['account'] == account and c['state'] == 'open'][:4]
                if self.dry:
                    watched += [c for c in self.board['cards'] if c['account'] == account and c['state'] != 'open'][:1]
                for card in watched:
                    if card['thread_id'] in grouped:
                        continue
                    raw = gmail.get('threads/' + card['thread_id'], {'format': 'metadata', 'metadataHeaders': ['From', 'Subject', 'Date']})
                    latest = max(raw['messages'], key=lambda m: int(m['internalDate']))['id']
                    if not self.dry and state.get('thread_versions', {}).get(card['thread_id']) == latest:
                        continue
                    ids = [m['id'] for m in raw['messages'] if m['id'] in card['message_ids']
                           and not set(m.get('labelIds', [])) & {'SENT', 'DRAFT', 'SPAM', 'TRASH'}][-4:]
                    if ids:
                        grouped[card['thread_id']] = ids
                        refreshed[card['thread_id']] = raw
                chunk = []
                for thread_id, ids in grouped.items():
                    if not IDENTIFIER.fullmatch(thread_id):
                        raise ValueError('thread_identifier')
                    raw = load_thread(gmail, thread_id, ids, refreshed.get(thread_id))
                    thread = context_thread(account, raw, ids, old_cards.get((account, thread_id)), gmail)
                    size = len(json.dumps({'master': master, 'threads': chunk + [thread]}).encode())
                    if chunk and (len(chunk) >= 4 or size > self.config['max_context_bytes'] - 2000):
                        self.classify_batch(chunk, master)
                        processed += sum(len(t['candidate_message_ids']) for t in chunk)
                        chunk = []
                    chunk.append(thread)
                if chunk:
                    self.classify_batch(chunk, master)
                    processed += sum(len(t['candidate_message_ids']) for t in chunk)
                if not self.dry:
                    if recent_complete and account not in self.feedback_failed:
                        checkpoints[account] = iso(now)
                    if backfill_lower is not None and historical_complete:
                        updates[account] = {'backfill_end': iso(backfill_lower), 'backfill_complete':
                                            backfill_lower <= dt.datetime.fromisoformat(self.config['activated_at']) - dt.timedelta(days=90)}
                complete[account] = recent_complete and account not in self.feedback_failed and updates.get(account, {}).get('backfill_complete', state.get('backfill_complete', False))
            except Exception as error:
                errors += 1
                complete[account] = False
                self.abandon_conflict(error)
                if self.journal.data.get('pending_batch') or self.journal.data.get('pending_publication'):
                    break  # Preserve exact uncertain work before any new batch.
        if self.dry:
            return {'dry_run': True, 'processed': processed, 'errors': errors, 'gmail_changes': 0, 'board_writes': 0}
        status = 'success' if len(complete) == 2 and all(complete.values()) and not errors else ('partial' if processed or checkpoints else 'error')
        payload = {'action': 'publish', 'operation_id': operation('finish', self.slot + str(self.journal.data['slots'][self.slot]['attempts'])),
                   'cards': [], 'run': {'status': status,
                   'summary': f'{processed} messages processed; recent coverage complete for {len(checkpoints)} of 2 mailboxes. '
                              + ('Historical catch-up is complete.' if len(complete) == 2 and all(complete.values()) else 'Historical catch-up or bounded coverage remains incomplete.')
                              + (f' Verification issues: {errors}.' if errors else ''),
                   'checkpoints': checkpoints if status != 'error' else {}}}
        if not self.journal.data.get('pending_publication'):
            for account, cursor in checkpoints.items():
                updates.setdefault(account, {})['cursor'] = cursor
            final = {'payload': payload, 'slot': self.slot, 'updates': updates, 'complete': not errors}
            self.journal.data['pending_final'] = final
            self.journal.save()
            self.publish(payload)
            self.finish_state(final)
        self.journal.save()
        return {'status': status, 'processed': processed, 'errors': errors,
                'verified_messages': sum(getattr(g, 'verified_count', 0) for g in self.clients.values()),
                'modified_messages': sum(getattr(g, 'write_count', 0) for g in self.clients.values()),
                'mailboxes_verified': sum(getattr(g, 'verified_count', 0) > 0 for g in self.clients.values()),
                'publication_verified': not self.journal.data.get('pending_publication')}
