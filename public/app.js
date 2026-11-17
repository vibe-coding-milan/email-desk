'use strict';
// Review schedule mirrors review-email-desk: New York wall time, including DST.
const reviewZone = 'America/New_York';
function reviewSlots(now) {
  const local = new Intl.DateTimeFormat('en-CA', {timeZone: reviewZone, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const part = name => Number(local.find(p => p.type === name).value);
  const base = Date.UTC(part('year'), part('month') - 1, part('day'));
  const slots = [];
  for (let day = -1; day <= 1; day++) {
    const date = new Date(base + day * 86400000), weekday = date.getUTCDay();
    for (const [hour, minute] of [[9, 0], ...(weekday > 0 && weekday < 6 ? [[13, 0]] : []), [17, 30]]) {
      const wall = date.getTime() + hour * 3600000 + minute * 60000;
      let instant = wall;
      for (let i = 0; i < 3; i++) {
        const parts = new Intl.DateTimeFormat('en-GB', {timeZone: reviewZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'}).formatToParts(instant);
        const n = name => Number(parts.find(p => p.type === name).value);
        instant += wall - Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
      }
      slots.push(instant);
    }
  }
  return slots;
}
function reviewDay(now, runs = []) {
  const dateKey = value => new Intl.DateTimeFormat('en-CA', {timeZone: reviewZone, year:'numeric', month:'2-digit', day:'2-digit'}).format(value);
  const slots = reviewSlots(new Date(now)).filter(t => dateKey(t) === dateKey(now));
  const firstFuture = slots.find(t => t > now);
  return slots.map((time, i) => {
    const result = runs.filter(run => {
      const finished = Date.parse(run.finished_at);
      return finished >= time && finished <= now && finished < (slots[i + 1] ?? Infinity) && dateKey(finished) === dateKey(now);
    }).sort((a, b) => Date.parse(b.finished_at) - Date.parse(a.finished_at))[0];
    const state = result ? ({success:'updated', partial:'partial', error:'failed'}[result.status] || 'missed') : time <= now ? (now - time <= 15 * 60000 ? 'due' : 'missed') : time === firstFuture ? 'next' : 'later';
    return {time, state, finishedAt: result?.finished_at || null};
  });
}
function reviewStatus(now, runs = []) {
  const slots = reviewDay(now, runs), allSlots = reviewSlots(new Date(now));
  const next = allSlots.find(t => t > now);
  const finalDue = slots.at(-1).time <= now;
  const allUpdated = slots.every(s => s.state === 'updated');
  const pendingFinal = finalDue && ['due', 'missed'].includes(slots.at(-1).state);
  const phase = pendingFinal ? slots.at(-1).state : finalDue ? (allUpdated ? 'complete' : 'incomplete') : 'scheduled';
  // Equal route segments land exactly on each checkpoint at its planned time.
  const segment = slots.findIndex(t => t.time > now);
  const fraction = now <= slots[0].time ? 0 : segment < 0 ? 1 : ((segment - 1) + (now - slots[segment - 1].time) / (slots[segment].time - slots[segment - 1].time)) / (slots.length - 1);
  return {slots, next, fraction, phase, finalDue};
}
// End schedule helpers.
const $ = id => document.getElementById(id);
let csrf = '', data = {cards: [], labels: [], run: null}, toastTimer, rewardTimer, refreshing = false, boardLoaded = false, boardReadFailed = false;
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
function signedIn(value) { $('login').hidden = value; $('workspace').hidden = !value; for (const id of ['logout']) $(id).hidden = !value; }
function interactionLock() {
  const locked = refreshing || saving.size > 0;
  $('board').inert = locked; $('history').inert = locked;
  $('logout').disabled = locked;
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
function renderReviewDay() {
  const meter = $('reviewMeter');
  if (!boardLoaded) {
    $('reviewHeading').textContent = boardReadFailed ? 'Updates unavailable' : 'Loading updates…';
    $('reviewNote').textContent = boardReadFailed ? 'Could not load the board. It will retry automatically.' : 'Checking saved review results.';
    meter.removeAttribute('value'); $('reviewSlots').replaceChildren(); return;
  }
  const now = Date.now(), runs = data.runs || (data.run ? [data.run] : []), timing = reviewStatus(now, runs);
  const clock = new Intl.DateTimeFormat('en-US', {timeZone: reviewZone, hour:'numeric', minute:'2-digit'});
  const timeLabel = value => clock.format(value).replace(':00', '');
  const captions = {updated:'Updated', partial:'Partial', failed:'Failed', due:'Due', missed:'Missed', next:'Next', later:'Later'};
  $('reviewHeading').textContent = 'Today’s updates';
  meter.value = timing.fraction; meter.setAttribute('aria-valuetext', Math.round(timing.fraction * 100) + '% of today’s route from ' + timeLabel(timing.slots[0].time) + ' to ' + timeLabel(timing.slots.at(-1).time) + ' New York time. Checkpoints show actual publication results; the route measures time.');
  const latest = runs.filter(r => Number.isFinite(Date.parse(r.finished_at)) && Date.parse(r.finished_at) <= now).sort((a,b) => Date.parse(b.finished_at) - Date.parse(a.finished_at))[0];
  const dateKey = value => new Intl.DateTimeFormat('en-CA', {timeZone: reviewZone}).format(value);
  const nextText = timing.finalDue ? 'Next tomorrow ' + timeLabel(timing.next) + ' · New York' : 'New York time';
  const lastText = latest ? 'Last update ' + (dateKey(new Date(latest.finished_at)) === dateKey(new Date(now)) ? '' : new Intl.DateTimeFormat('en-US', {timeZone: reviewZone, month:'short', day:'numeric'}).format(new Date(latest.finished_at)) + ' ') + timeLabel(new Date(latest.finished_at)) : 'First review not published yet';
  $('reviewNote').textContent = boardReadFailed ? 'Connection lost · showing saved results' : nextText + ' · ' + lastText;
  $('reviewSlots').replaceChildren(...timing.slots.map(slot => {
    const item = node('li', 'review-slot ' + slot.state), mark = node('span', 'slot-mark'); mark.setAttribute('aria-hidden', 'true');
    if (slot.state === 'updated') mark.append(icon('check'));
    else if (slot.state === 'missed') mark.textContent = '–';
    const time = node('time', '', timeLabel(slot.time)); time.dateTime = new Date(slot.time).toISOString();
    item.append(mark, time, node('span', 'slot-state', captions[slot.state]));
    if (slot.state === 'next' || slot.state === 'due') item.setAttribute('aria-current', 'step');
    if (slot.state === 'missed') item.title = 'No publication recorded for this review time. Later reviews run independently.';
    if (slot.finishedAt) item.title = captions[slot.state] + ' · published ' + timeLabel(new Date(slot.finishedAt)) + ' New York time';
    return item;
  }));
}
function scanStatus(failed = false) {
  const run = data.run, stale = run?.last_success_at && Date.now() - new Date(run.last_success_at).getTime() > 36 * 3600000;
  $('scan').hidden = (!run && !failed) || (!!run && run.status === 'success' && !stale && !failed);
  $('scanTitle').textContent = failed ? 'Couldn’t refresh the board' : !run ? 'Waiting for the first inbox review' : run.status === 'error' ? 'Inbox review couldn’t finish' : run.status === 'partial' ? 'Inbox review is incomplete' : 'The inbox review may be out of date';
  $('scanDetails').textContent = failed ? 'Previously loaded cards and your unsaved changes are retained. The board will check for saved updates again automatically.' : run?.summary || 'Cards will appear after the scheduled review.';
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
  $('empty').querySelector('h2').textContent = history.length ? 'Board cleared. Nicely done.' : !data.run ? 'Your board is getting started.' : data.run.status === 'success' ? 'You’re up to date.' : 'No saved cards yet.';
  $('empty').querySelector('p').textContent = history.length ? 'Your decisions are saved in history. New updates appear automatically.' : !data.run ? 'Your first review will appear here. Planned update times are shown above.' : data.run.status === 'success' ? 'The latest review found nothing to show here. Planned updates continue above.' : 'The latest review could not cover everything. See the review notice for details.';
  renderProgress(); scanStatus(); renderReviewDay();
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
async function refresh(automatic = false) {
  // Let an active editor finish without moving focus or replacing their controls.
  if (automatic === true && (drafts.size || $('board').contains(document.activeElement) || $('history').contains(document.activeElement))) return;
  if (saving.size || refreshing) return; $('error').hidden = true; refreshing = true; interactionLock();
  try { const r = await api('board'); const changed = JSON.stringify(data) !== JSON.stringify(r.result); data = r.result; boardLoaded = true; boardReadFailed = false; if (automatic !== true || changed) render(); else { scanStatus(); renderReviewDay(); } } catch (e) { boardReadFailed = true; error(e.message); scanStatus(true); renderReviewDay(); } finally { refreshing = false; interactionLock(); }
}
$('loginForm').onsubmit = async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; $('error').hidden = true; try { const r = await api('login', {password: $('password').value}); csrf = r.csrf; $('password').value = ''; signedIn(true); await refresh(); } catch (e) { error(e.message); } finally { button.disabled = false; } };
// Read saved data only. Never starts a reviewer or mutates Gmail.
setInterval(() => { if (!document.hidden && !$('workspace').hidden) refresh(true); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('workspace').hidden) { renderReviewDay(); refresh(true); } });
setInterval(() => { if (!$('workspace').hidden) renderReviewDay(); }, 60000);
$('logout').onclick = async () => {
  if (saving.size || (drafts.size && !confirm('Sign out with unsaved feedback?'))) return;
  try { await api('logout', {}); data = {cards: [], labels: [], run: null}; boardLoaded = false; boardReadFailed = false; renderReviewDay(); drafts.clear(); attempts.clear(); opened.clear(); $('toast').hidden = true; clearTimeout(toastTimer); clearTimeout(rewardTimer); $('reward').hidden = true; signedIn(false); const s = await api('session'); csrf = s.csrf; } catch (e) { error(e.message); }
};
function today() { const date = new Date(); $('today').dateTime = date.toLocaleDateString('en-CA', {timeZone: reviewZone}); $('today').textContent = date.toLocaleDateString([], {timeZone: reviewZone, month: 'long', day: 'numeric', year: 'numeric'}); }
today(); setInterval(today, 60000);
(async () => { try { const s = await api('session'); csrf = s.csrf; signedIn(s.authenticated); if (s.authenticated) await refresh(); } catch (e) { error(e.message); } })();
