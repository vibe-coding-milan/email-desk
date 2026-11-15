'use strict';
const $ = id => document.getElementById(id);
let csrf = '', data = {cards: [], labels: [], run: null}, toastTimer, rewardTimer, refreshing = false;
const drafts = new Map(), opened = new Set(), attempts = new Map(), saving = new Set();
const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const icon = name => { const e = node('span', 'icon icon-' + name); e.setAttribute('aria-hidden', 'true'); return e; };
const errors = {sign_in: 'Please sign in again. Your unsaved feedback is kept on this page.', invalid_login: 'That password did not work.', try_later: 'Too many sign-in attempts. Please wait 15 minutes.', conflict: 'This card changed. Your edits are preserved. Reload the latest card before saving.', not_configured: 'Email Desk is not configured yet.', origin: 'This request was blocked. Reload the page and try again.', csrf: 'Your session changed. Reload the page before trying again.', temporary: 'The server is unavailable. Displayed cards may be out of date.'};
function error(message) { $('error').textContent = message; $('error').hidden = false; }
async function api(action, body) {
  let r;
  try { r = await fetch('api.php?action=' + encodeURIComponent(action), {method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', headers: body ? {'Content-Type': 'application/json', 'X-CSRF-Token': csrf} : {}, ...(body ? {body: JSON.stringify(body)} : {})}); }
  catch { throw Error('Could not reach the server. Your changes have not been confirmed.'); }
  let p; try { p = await r.json(); } catch { throw Error('The server returned an unreadable response. Your changes have not been confirmed.'); }
  if (!r.ok || p.ok !== true) { if (p.error === 'sign_in') signedIn(false); throw Error(errors[p.error] || 'Could not complete the request (' + (p.error || r.status) + ').'); }
  return p;
}
function signedIn(value) { $('login').hidden = value; $('workspace').hidden = !value; for (const id of ['refresh', 'logout']) $(id).hidden = !value; }
function interactionLock() {
  const locked = refreshing || saving.size > 0;
  $('board').inert = locked; $('history').inert = locked;
  $('refresh').disabled = locked; $('logout').disabled = locked;
}
function dateLabel(date) { const d = new Date(date); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], {month: 'short', day: 'numeric'}); }
const category = c => c.user_category || c.category;
const labels = c => c.user_labels ?? c.labels;
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const feedbackLabel = {pending: 'Saved · awaiting review', applied: 'Labels updated in Gmail', recorded: 'Context reviewed', superseded: 'Replaced by a newer decision', error: 'Feedback needs another attempt'};
function notify(message) { clearTimeout(toastTimer); $('toastMessage').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 7000); }
function celebrate(earned, levelUp) {
  if (!earned && !levelUp) return;
  clearTimeout(rewardTimer);
  $('rewardTitle').textContent = levelUp ? 'LEVEL UP!' : 'DECISION COMPLETE';
  $('rewardValue').textContent = levelUp ? 'LEVEL ' + progress().level : '+' + earned + ' XP';
  $('rewardDetail').textContent = levelUp ? 'Another level of clarity.' : 'One less thing on your mind.';
  $('reward').hidden = false;
  $('reward').classList.remove('reward-enter'); void $('reward').offsetWidth; $('reward').classList.add('reward-enter');
  rewardTimer = setTimeout(() => { $('reward').hidden = true; }, levelUp ? 4500 : 2200);
}
$('closeToast').onclick = () => { clearTimeout(toastTimer); $('toast').hidden = true; };
function progress() {
  // Derive from durable server-authored awards, never from browser clicks or current status.
  const decisions = data.cards.filter(c => c.decision_earned_at).length, xp = decisions * 10;
  return {xp, decisions, level: Math.floor(xp / 100) + 1, levelXP: xp % 100};
}
function renderProgress() {
  const p = progress(); $('level').textContent = 'Level ' + String(p.level).padStart(2, '0'); $('levelXP').textContent = p.levelXP + ' / 100 XP';
  $('xpMeter').setAttribute('aria-valuenow', p.levelXP); $('xpMeter').setAttribute('aria-valuetext', p.levelXP + ' of 100 XP toward level ' + (p.level + 1));
  $('xpMeter').replaceChildren(...Array.from({length: 10}, (_, i) => { const segment = node('span', 'xp-segment' + (i < p.levelXP / 10 ? ' filled' : '')); segment.setAttribute('aria-hidden', 'true'); return segment; }));
  $('progressDetails').textContent = p.decisions + (p.decisions === 1 ? ' decision' : ' decisions') + ' · ' + p.xp + ' total XP. Earn 10 XP the first time you handle or dismiss a card. Every 100 XP is a level. Reopening or editing a card never earns extra XP. Take it at your own pace.';
}
function scanStatus(failed = false) {
  const run = data.run, stale = run?.last_success_at && Date.now() - new Date(run.last_success_at).getTime() > 36 * 3600000;
  $('scan').hidden = !!run && run.status === 'success' && !stale && !failed;
  $('scanTitle').textContent = failed ? 'Couldn’t refresh the board' : !run ? 'Waiting for the first inbox review' : run.status === 'error' ? 'Inbox review couldn’t finish' : run.status === 'partial' ? 'Inbox review is incomplete' : 'The inbox review may be out of date';
  $('scanDetails').textContent = failed ? 'Previously loaded cards and your unsaved changes are retained. Refresh reloads saved cards; it does not start a new inbox review.' : run?.summary || 'Cards will appear after the scheduled review.';
}
function render() {
  const historyOpen = $('history').open;
  for (const id of ['actionCards', 'awarenessCards', 'historyCards']) $(id).replaceChildren();
  const active = data.cards.filter(c => c.state === 'open');
  for (const cat of ['action', 'awareness']) {
    const group = active.filter(c => category(c) === cat); $(cat + 'Count').textContent = group.length;
    for (const c of group) $(cat + 'Cards').append(card(c));
    if (!group.length) $(cat + 'Cards').append(node('p', 'column-empty', cat === 'action' ? 'Nothing needs a decision here.' : 'You’re up to date here.'));
  }
  const history = data.cards.filter(c => c.state !== 'open'); $('history').hidden = !history.length;
  $('historyTitle').textContent = 'Handled & dismissed · ' + history.length;
  for (const c of history) $('historyCards').append(card(c));
  $('history').open = historyOpen; $('empty').hidden = !!active.length;
  $('empty').querySelector('h2').textContent = history.length ? 'Board cleared. Nicely done.' : 'No active cards yet.';
  $('empty').querySelector('p').textContent = history.length ? 'Your decisions are saved in history. Come back when there’s something new.' : 'Cards will appear here after an inbox review.';
  renderProgress(); scanStatus();
}
function selectField(form, labelText, values, current, name) {
  const label = node('label', 'field', labelText), select = node('select'); select.name = name;
  for (const [v, t] of values) select.append(new Option(t, v)); select.value = current; label.append(select); form.append(label); return select;
}
function card(c) {
  const draft = drafts.get(c.id), wrapper = node('article', 'card'), details = node('div', 'card-details'); wrapper.id = 'card-' + c.id;
  const summary = node('div', 'card-summary'), meta = node('div', 'meta'), time = node('time', '', dateLabel(c.date)); time.dateTime = c.date;
  meta.append(node('span', '', c.sender), time);
  summary.append(meta, node('h3', '', c.subject), node('p', 'description', c.description));
  const tags = node('div', 'tags'); for (const l of labels(c)) tags.append(node('span', 'tag', l));
  if (c.state !== 'open') tags.append(node('span', 'tag', c.state === 'handled' ? 'Handled' : 'Dismissed'));
  summary.append(tags); details.append(summary);
  const body = node('div', 'card-body'); body.id = 'details-' + c.id; body.hidden = !opened.has(c.id); wrapper.classList.toggle('expanded', !body.hidden);
  if (c.reason) body.append(node('p', 'reason', c.reason)); if (c.deadline) body.append(node('p', 'deadline', c.deadline)); if (c.question) body.append(node('p', 'question', c.question));
  if (c.context_history?.length) {
    const history = node('details', 'earlier-context'); history.append(node('summary', '', 'Earlier context · ' + c.context_history.length));
    for (const previous of [...c.context_history].reverse()) {
      const entry = node('section', 'context-entry'); entry.append(node('h4', '', previous.subject));
      for (const key of ['description', 'reason', 'deadline', 'question']) if (previous[key]) entry.append(node('p', '', previous[key]));
      history.append(entry);
    }
    body.append(history);
  }
  const link = node('a', 'email-link', 'Open email'); link.append(icon('right')); link.href = 'https://mail.google.com/mail/u/?authuser=' + encodeURIComponent(c.account) + '#all/' + encodeURIComponent(c.thread_id); link.target = '_blank'; link.rel = 'noopener noreferrer'; body.append(link, node('span', 'account', c.account));
  const form = node('form', 'feedback-form'); form.setAttribute('aria-label', 'Feedback for ' + c.subject);
  const fields = node('fieldset', 'feedback-fields'), row = node('div', 'fields');
  const cat = selectField(row, 'Where should this appear?', [['action', 'Needs action'], ['awareness', 'Worth knowing']], draft?.category ?? category(c), 'category');
  const state = selectField(row, 'Status', [['open', 'Active'], ['handled', 'Handled'], ['dismissed', 'Dismissed']], draft?.state ?? c.state, 'state'); fields.append(row);
  const picker = node('details', 'label-picker'), pickerSummary = node('summary', '', 'Labels'), boxes = node('div', 'label-options'), chosen = draft?.labels ?? labels(c); picker.append(pickerSummary);
  for (const l of data.labels) { const label = node('label'), box = node('input'); box.type = 'checkbox'; box.name = 'labels'; box.value = l; box.checked = chosen.includes(l); label.append(box, node('span', '', l)); boxes.append(label); }
  picker.append(boxes); fields.append(picker);
  const noteLabel = node('label', 'field', 'Context or explanation'), note = node('textarea'); note.name = 'note'; note.rows = 3; note.maxLength = 8000; note.placeholder = 'Anything that would help me understand or route this email?'; note.value = draft?.note ?? c.note ?? ''; noteLabel.append(note); fields.append(noteLabel); form.append(fields);
  const result = node('p', 'save-result', draft ? 'Unsaved changes' : c.feedback_status ? feedbackLabel[c.feedback_status] || c.feedback_status : ''); result.setAttribute('role', 'status'); if (c.feedback_explanation) result.title = c.feedback_explanation;
  const actions = node('div', 'save-row'), save = node('button', 'primary', 'Save'); save.type = 'submit'; save.disabled = !draft; actions.append(save, result); form.append(actions); body.append(form); wrapper.append(details);
  const quick = node('div', 'quick-actions'), quickButtons = [];
  if (c.state === 'open') {
    for (const [value, caption] of [['handled', 'Handled'], ['dismissed', 'Dismiss']]) {
      const button = node('button', value === 'handled' ? 'primary' : 'dismiss'); button.type = 'button'; button.setAttribute('aria-label', (value === 'handled' ? 'Mark handled: ' : 'Dismiss: ') + c.subject);
      if (value === 'handled') button.append(icon('check')); button.append(document.createTextNode(caption));
      button.onclick = () => { state.value = value; changed(); form.requestSubmit(); }; quick.append(button); quickButtons.push(button);
    }
  }
  const toggle = node('button', 'detail-toggle', 'Details & feedback'); toggle.type = 'button'; toggle.append(icon('right')); toggle.setAttribute('aria-label', 'Details & feedback: ' + c.subject); toggle.setAttribute('aria-controls', body.id); toggle.setAttribute('aria-expanded', String(!body.hidden));
  function setExpanded(value) { body.hidden = !value; wrapper.classList.toggle('expanded', value); toggle.setAttribute('aria-expanded', String(value)); if (value) opened.add(c.id); else opened.delete(c.id); }
  toggle.onclick = () => setExpanded(body.hidden); quick.append(toggle); wrapper.append(quick, body);
  const read = () => ({category: cat.value, state: state.value, labels: [...boxes.querySelectorAll('input:checked')].map(x => x.value), note: note.value, revision: draft?.revision ?? c.revision});
  function changed() {
    const v = read(); pickerSummary.textContent = 'Labels' + (v.labels.length ? ' · ' + v.labels.length : '');
    const dirty = v.category !== category(c) || v.state !== c.state || v.note !== (c.note || '') || !same(v.labels, labels(c));
    save.disabled = !dirty; if (dirty) drafts.set(c.id, v); else drafts.delete(c.id);
    result.classList.remove('save-error'); result.textContent = dirty ? 'Unsaved changes' : c.feedback_status ? feedbackLabel[c.feedback_status] || c.feedback_status : '';
  }
  function busy(value) {
    if (value) saving.add(c.id); else saving.delete(c.id);
    wrapper.classList.toggle('saving', value); wrapper.setAttribute('aria-busy', String(value)); fields.disabled = value; save.disabled = value || !drafts.has(c.id);
    for (const button of quickButtons) button.disabled = value;
    interactionLock();
  }
  pickerSummary.textContent = 'Labels' + (chosen.length ? ' · ' + chosen.length : ''); form.addEventListener('input', changed); form.addEventListener('change', changed);
  if (saving.has(c.id)) busy(true);
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (saving.size || refreshing) return;
    const v = read(), hadFocus = wrapper.contains(document.activeElement), previousLevel = progress().level;
    const payload = {operation_id: crypto.randomUUID(), card_id: c.id, revision: v.revision, state: v.state, category: v.category, note: v.note, labels: same(v.labels, c.labels) ? null : v.labels};
    const signature = JSON.stringify({...payload, operation_id: ''}), old = attempts.get(c.id);
    if (old?.signature === signature) payload.operation_id = old.operation_id; else attempts.set(c.id, {signature, operation_id: payload.operation_id});
    busy(true); result.textContent = 'Saving…';
    try {
      const r = await api('feedback', payload);
      // Animate only after the server confirms the write. No optimistic disappearance or XP.
      if (c.state === 'open' && r.result.card.state !== 'open' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { wrapper.classList.add('departing'); await new Promise(resolve => setTimeout(resolve, 180)); }
      data.cards = data.cards.map(x => x.id === c.id ? r.result.card : x); drafts.delete(c.id); attempts.delete(c.id);
      if (r.result.card.state !== 'open') opened.delete(c.id); busy(false); render();
      const earned = r.result.xp_earned || 0, levelUp = progress().level > previousLevel;
      notify((levelUp ? 'Level ' + progress().level + '! ' : '') + (r.result.card.state === 'handled' ? 'Handled' : r.result.card.state === 'dismissed' ? 'Dismissed' : 'Changes saved') + (earned ? ' · +' + earned + ' XP' : ''));
      celebrate(earned, levelUp);
      if (levelUp) { $('level').classList.remove('level-up'); void $('level').offsetWidth; $('level').classList.add('level-up'); }
      if (hadFocus) { const target = r.result.card.state === 'open' ? $('card-' + c.id)?.querySelector('.detail-toggle') : $(category(c) + 'Cards').querySelector('.quick-actions button'); if (target) target.focus({preventScroll: true}); else { const heading = $(category(c) + 'Title'); heading.tabIndex = -1; heading.focus({preventScroll: true}); } }
    } catch (err) {
      busy(false); result.textContent = err.message; result.classList.add('save-error'); setExpanded(true); if ($('workspace').hidden) error(err.message);
      if (err.message.startsWith('This card changed') && !actions.querySelector('button[type=button]')) {
        const reload = node('button', '', 'Load latest'); reload.type = 'button';
        reload.onclick = async () => { if (!confirm('Discard this card’s unsaved changes and load the latest version?')) return; try { const latest = await api('board'); drafts.delete(c.id); attempts.delete(c.id); data = latest.result; render(); } catch (e) { result.textContent = e.message; } }; actions.append(reload);
      }
    }
  });
  return wrapper;
}
async function refresh() {
  if (saving.size || refreshing) return; $('error').hidden = true; refreshing = true; interactionLock();
  try { const r = await api('board'); data = r.result; render(); } catch (e) { error(e.message); scanStatus(true); } finally { refreshing = false; interactionLock(); }
}
$('loginForm').onsubmit = async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; $('error').hidden = true; try { const r = await api('login', {password: $('password').value}); csrf = r.csrf; $('password').value = ''; signedIn(true); await refresh(); } catch (e) { error(e.message); } finally { button.disabled = false; } };
$('refresh').onclick = refresh;
$('logout').onclick = async () => {
  if (saving.size || (drafts.size && !confirm('Sign out with unsaved feedback?'))) return;
  try { await api('logout', {}); data = {cards: [], labels: [], run: null}; drafts.clear(); attempts.clear(); opened.clear(); $('toast').hidden = true; clearTimeout(toastTimer); clearTimeout(rewardTimer); $('reward').hidden = true; signedIn(false); const s = await api('session'); csrf = s.csrf; } catch (e) { error(e.message); }
};
function today() { const date = new Date(); $('today').dateTime = date.toLocaleDateString('en-CA'); $('today').textContent = date.toLocaleDateString([], {month: 'long', day: 'numeric', year: 'numeric'}); }
today(); setInterval(today, 60000);
(async () => { try { const s = await api('session'); csrf = s.csrf; signedIn(s.authenticated); if (s.authenticated) await refresh(); } catch (e) { error(e.message); } })();
