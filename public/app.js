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
// Card timing uses elapsed hours, independent of timezone and daylight saving.
function cardTiming(c, now) {
  const received = Date.parse(c.date), start = Date.parse(c.attention_started_at || c.reopened_at || c.date);
  const duration = ms => {
    const hours = Math.floor(Math.max(0, ms) / 3600000), days = Math.floor(hours / 24);
    return days ? days + (days === 1 ? ' day' : ' days') : hours ? hours + (hours === 1 ? ' hour' : ' hours') : 'less than an hour';
  };
  if (!Number.isFinite(start) || !Number.isFinite(received)) return {tone:'unknown', text:'Message age unavailable', late:false};
  const age = Math.max(0, now - start), late = age > 48 * 3600000;
  const receivedText = received > now ? 'Received date is in the future' : 'Received ' + duration(now - received) + ' ago';
  if (c.state !== 'open') {
    const decided = Date.parse(c.decision_earned_at);
    return {tone:'resolved', late:false, text:Number.isFinite(decided) ? 'First decision after ' + duration(decided - Date.parse(c.decision_started_at || c.date)) + ' · ' + (c.decision_xp ?? 10) + ' XP earned' : receivedText};
  }
  const remaining = Math.max(0, Math.ceil((48 * 3600000 - age) / 3600000));
  const clock = c.reopened_at ? 'New request open for ' + duration(age) : start !== received ? 'Open for ' + duration(age) + ' · ' + receivedText : receivedText;
  return {tone:late ? 'late' : age >= 24 * 3600000 ? 'soon' : 'fresh', late,
    text:clock + ' · ' + (c.decision_earned_at ? (late ? 'Past 48h target' : remaining + 'h to 48h target') + ' · XP already earned' : late ? 'Past 48h target · 5 XP available' : '10 XP available · ' + (remaining ? remaining + 'h left' : '48h target now'))};
}
// End card timing helpers.

// Guest day engine: fictional state only; no network, storage or real clock reads.
const guestTimes = ['2026-11-16T14:00:00Z', '2026-11-16T18:00:00Z', '2026-11-16T22:30:00Z'].map(Date.parse);
function createGuestDay(batches) {
  return {stage:0, now:guestTimes[0], cards:batches[0].map(c => ({...c, date:new Date(guestTimes[0]).toISOString(), state:'open', note:'', earned:false})), xp:0, travelling:false, travel:0};
}
function resolveGuestCard(state, id, outcome) {
  const card = state.cards.find(c => c.id === id);
  if (!card || card.state !== 'open' || !['handled', 'dismissed'].includes(outcome)) return 0;
  card.state = outcome; card.decision_earned_at = new Date(state.now).toISOString(); card.decision_xp = 10;
  const earned = card.earned ? 0 : 10; card.earned = true; state.xp += earned;
  if (!state.cards.some(c => c.state === 'open') && state.stage < 2) { state.travelling = true; state.travel = 0; }
  return earned;
}
function advanceGuestDay(state, elapsed, batches) {
  if (!state.travelling || !Number.isFinite(elapsed) || elapsed <= 0) return false;
  state.travel = Math.min(1, state.travel + elapsed / 6000);
  state.now = guestTimes[state.stage] + (guestTimes[state.stage + 1] - guestTimes[state.stage]) * state.travel;
  if (state.travel < 1) return false;
  state.stage++; state.travelling = false;
  state.cards.push(...batches[state.stage].map(c => ({...c, date:new Date(guestTimes[state.stage]).toISOString(), state:'open', note:'', earned:false})));
  return true;
}
// End guest day engine.

const $ = id => document.getElementById(id);
let guestActive = false, stopGuest = () => {};
let csrf = '', data = {cards: [], labels: [], run: null}, toastTimer, rewardTimer, refreshing = false, boardLoaded = false, boardReadFailed = false;
const drafts = new Map(), opened = new Set(), attempts = new Map(), saving = new Set();
const node = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const icon = name => { const e = node('span', 'icon icon-' + name); e.setAttribute('aria-hidden', 'true'); return e; };
// Actual drawn idle frames; visibility and the explicit motion preference control playback.
const companionObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
  for (const entry of entries) entry.target.classList.toggle('sprite-visible', entry.isIntersecting);
}, {threshold:0.2}) : null;
function watchCompanion(art) {
  art.classList.add('agent-idle');
  if (companionObserver) companionObserver.observe(art); else art.classList.add('sprite-visible');
}
for (const art of document.querySelectorAll('.agent-idle')) watchCompanion(art);
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = false;
function syncMotion() {
  document.documentElement.classList.toggle('motion-paused', motionPaused || motionPreference.matches);
  $('toggleMotion').disabled = motionPreference.matches;
  $('toggleMotion').textContent = motionPreference.matches ? 'Animation off' : motionPaused ? 'Resume animation' : 'Pause animation';
  $('toggleMotion').setAttribute('aria-pressed', String(motionPaused || motionPreference.matches));
}
$('toggleMotion').onclick = () => { motionPaused = !motionPaused; syncMotion(); };
motionPreference.addEventListener('change', syncMotion); syncMotion();
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
function signedIn(value) {
  if (value) { guestActive = false; stopGuest(); }
  $('login').hidden = value || guestActive; $('welcome').hidden = value || guestActive;
  $('ownerLink').hidden = value; $('demoBack').hidden = value || !guestActive;
  $('guestDemo').hidden = value || !guestActive;
  $('workspace').hidden = !value; $('logout').hidden = !value;
  $('skipLink').href = value ? '#workspace' : guestActive ? '#guestDemo' : '#welcome';
  if (!value) $('ownerLogin').open = false;
}
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
  $('rewardArt').hidden = !levelUp;
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
  const awarded = data.cards.filter(c => c.decision_earned_at), decisions = awarded.length, xp = awarded.reduce((sum, c) => sum + (c.decision_xp ?? 10), 0);
  return {xp, decisions, level: Math.floor(xp / 100) + 1, levelXP: xp % 100};
}
function renderProgress() {
  const p = progress(); $('level').textContent = 'Level ' + String(p.level).padStart(2, '0'); $('levelXP').textContent = p.levelXP + ' / 100 XP';
  $('xpMeter').setAttribute('aria-valuenow', p.levelXP); $('xpMeter').setAttribute('aria-valuetext', p.levelXP + ' of 100 XP toward level ' + (p.level + 1));
  $('xpMeter').replaceChildren(...Array.from({length: 10}, (_, i) => { const segment = node('span', 'xp-segment' + (i < Math.floor(p.levelXP / 10) ? ' filled' : i < p.levelXP / 10 ? ' half' : '')); segment.setAttribute('aria-hidden', 'true'); return segment; }));
  $('progressDetails').textContent = p.decisions + (p.decisions === 1 ? ' decision' : ' decisions') + ' · ' + p.xp + ' total XP. 10 XP within 48 hours of receipt; 5 XP afterward. Once per card, handled or dismissed. Past awards stay earned. Level up every 100 XP.';
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
  $('scanDetails').textContent = failed ? 'Saved cards and unsaved edits are kept. Retrying automatically.' : run?.summary || 'Cards will appear after the scheduled review.';
}
// Shared empty-column presentation; a missing/failed review never means a clear inbox.
function emptyColumnCopy(category, mode) {
  const action = category === 'action';
  if (mode === 'unconfirmed') return {title: 'No saved ' + (action ? 'action cards' : 'updates'), detail: 'Review coverage is unconfirmed. Check the review notice above; an empty column does not mean the inbox is clear.'};
  if (mode === 'waiting') return {title: action ? 'Ready for the first review' : 'Watching for useful updates', detail: action ? 'Requests appear after the first review.' : 'Useful updates appear after the first review.'};
  return {title: action ? 'No decisions waiting' : 'Nothing new to catch up on', detail: action ? 'New requests appear after the next review.' : 'Useful updates appear after the next review.'};
}
function emptyColumn(category, mode = 'clear') {
  const copy = emptyColumnCopy(category, mode), section = node('div', 'column-empty illustrated-empty ' + mode);
  const scene = node('span', 'companion-scene empty-state-art'), bot = node('span','agent-idle'); scene.setAttribute('aria-hidden','true');
  watchCompanion(bot); scene.append(bot);
  if (mode === 'clear') {
    const prop = node('img','companion-prop'); prop.src = category === 'action' ? 'assets/desk-clear.png' : 'assets/lookout.png';
    prop.width = 170; prop.height = 170; prop.alt = ''; scene.append(prop);
  } else scene.classList.add('companion-solo');
  section.append(scene, node('h3', '', copy.title), node('p', '', copy.detail));
  return section;
}
// End empty-column presentation.
function render() {
  const historyOpen = $('history').open;
  for (const id of ['actionCards', 'awarenessCards', 'historyCards']) { for (const art of $(id).querySelectorAll('.agent-idle')) companionObserver?.unobserve(art); $(id).replaceChildren(); }
  const active = data.cards.filter(c => c.state === 'open');
  for (const cat of ['action', 'awareness']) {
    const group = active.filter(c => category(c) === cat); $(cat + 'Count').textContent = group.length;
    for (const c of group) $(cat + 'Cards').append(card(c));
    if (!group.length) $(cat + 'Cards').append(emptyColumn(cat, boardReadFailed || (data.run && data.run.status !== 'success') ? 'unconfirmed' : !data.run ? 'waiting' : 'clear'));
  }
  const history = data.cards.filter(c => c.state !== 'open'); $('history').hidden = !history.length;
  $('historyTitle').textContent = 'Handled & dismissed · ' + history.length;
  for (const c of history) $('historyCards').append(card(c));
  $('history').open = historyOpen; $('empty').hidden = !!active.length;
  $('empty').querySelector('h2').textContent = boardReadFailed || (data.run && data.run.status !== 'success') ? 'No active saved cards. Coverage needs attention.' : history.length ? 'Board cleared. Nicely done.' : !data.run ? 'Your board is getting started.' : data.run.status === 'success' ? 'You’re up to date.' : 'No saved cards yet.';
  $('empty').querySelector('p').textContent = boardReadFailed || (data.run && data.run.status !== 'success') ? 'An empty board is not a confirmed all-clear. Check the review notice for coverage details.' : history.length ? 'Decisions saved in history. New cards appear automatically.' : !data.run ? 'Waiting for the first review. Planned times are above.' : data.run.status === 'success' ? 'The latest review found no cards to add.' : 'The latest review could not cover everything. See the review notice for details.';
  if (!data.run && !data.cards.length) $('deskGuide').open = true;
  renderProgress(); scanStatus(); renderReviewDay(); renderCardTiming();
}
function renderCardTiming() {
  const now = Date.now();
  for (const c of data.cards) {
    const element = document.getElementById('card-' + c.id)?.querySelector('.card-timing');
    if (!element) continue;
    const timing = cardTiming(c, now); element.textContent = timing.text; element.className = 'card-timing ' + timing.tone;
  }
  const late = data.cards.filter(c => c.state === 'open' && cardTiming(c, now).late).length;
  $('attentionNote').hidden = !late;
  $('attentionNote').textContent = late + (late === 1 ? ' card has' : ' cards have') + ' been waiting more than 48 hours. Start with one.';
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
  const timing = node('p', 'card-timing'); timing.dataset.cardTiming = c.id; summary.append(timing, tags); details.append(summary);
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
  const cat = selectField(row, 'Category', [['action', 'Needs action'], ['awareness', 'Worth knowing']], draft?.category ?? category(c), 'category');
  const state = selectField(row, 'Status', [['open', 'Active'], ['handled', 'Handled'], ['dismissed', 'Dismissed']], draft?.state ?? c.state, 'state'); fields.append(row);
  const picker = node('details', 'label-picker'), pickerSummary = node('summary', '', 'Labels'), boxes = node('div', 'label-options'), chosen = draft?.labels ?? labels(c); picker.append(pickerSummary);
  for (const l of data.labels) { const label = node('label'), box = node('input'); box.type = 'checkbox'; box.name = 'labels'; box.value = l; box.checked = chosen.includes(l); label.append(box, node('span', '', l)); boxes.append(label); }
  picker.append(boxes); fields.append(picker);
  const noteLabel = node('label', 'field', 'Note'), note = node('textarea'); note.name = 'note'; note.rows = 3; note.maxLength = 8000; note.placeholder = 'Add context for the next review.'; note.value = draft?.note ?? c.note ?? ''; noteLabel.append(note); fields.append(noteLabel); form.append(fields);
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
  const toggle = node('button', 'detail-toggle', 'Details'); toggle.type = 'button'; toggle.append(icon('right')); toggle.setAttribute('aria-label', 'Details: ' + c.subject); toggle.setAttribute('aria-controls', body.id); toggle.setAttribute('aria-expanded', String(!body.hidden));
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
  try { const r = await api('board'); const changed = JSON.stringify(data) !== JSON.stringify(r.result); data = r.result; boardLoaded = true; boardReadFailed = false; if (automatic !== true || changed) render(); else { scanStatus(); renderReviewDay(); } } catch (e) { boardReadFailed = true; error(e.message);
    if (!boardLoaded) render();
    else for (const cat of ['action','awareness']) if ($(cat + 'Cards').querySelector('.illustrated-empty')) { for (const art of $(cat + 'Cards').querySelectorAll('.agent-idle')) companionObserver?.unobserve(art); $(cat + 'Cards').replaceChildren(emptyColumn(cat,'unconfirmed')); }
    if (!$('empty').hidden) { $('empty').querySelector('h2').textContent = 'No active saved cards. Coverage needs attention.'; $('empty').querySelector('p').textContent = 'An empty board is not a confirmed all-clear. Check the review notice for coverage details.'; }
    scanStatus(true); renderReviewDay(); } finally { refreshing = false; interactionLock(); }
}
$('loginForm').onsubmit = async e => { e.preventDefault(); const button = e.submitter; button.disabled = true; $('error').hidden = true; try { const r = await api('login', {password: $('password').value}); csrf = r.csrf; $('password').value = ''; signedIn(true); await refresh(); } catch (e) { error(e.message); } finally { button.disabled = false; } };
// Read saved data only. Never starts a reviewer or mutates Gmail.
setInterval(() => { if (!document.hidden && !$('workspace').hidden) refresh(true); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('workspace').hidden) { renderReviewDay(); renderCardTiming(); refresh(true); } });
setInterval(() => { if (!$('workspace').hidden) { renderReviewDay(); renderCardTiming(); } }, 60000);
$('logout').onclick = async () => {
  if (saving.size || (drafts.size && !confirm('Sign out with unsaved feedback?'))) return;
  try { await api('logout', {}); data = {cards: [], labels: [], run: null}; boardLoaded = false; boardReadFailed = false; renderReviewDay(); drafts.clear(); attempts.clear(); opened.clear(); $('toast').hidden = true; clearTimeout(toastTimer); clearTimeout(rewardTimer); $('reward').hidden = true; signedIn(false); const s = await api('session'); csrf = s.csrf; } catch (e) { error(e.message); }
};
function today() { const date = new Date(); $('today').dateTime = date.toLocaleDateString('en-CA', {timeZone: reviewZone}); $('today').textContent = date.toLocaleDateString([], {timeZone: reviewZone, month: 'long', day: 'numeric', year: 'numeric'}); }
today(); setInterval(today, 60000);
(async () => { try { const s = await api('session'); csrf = s.csrf; signedIn(s.authenticated); if (s.authenticated) await refresh(); } catch (e) { error(e.message); } })();

// Guest workspace: isolated fictional day, styled like the authenticated board.
(() => {
  const examples = [
    {id: 'garden', sender: 'Maple Street volunteers', subject: 'Confirm your garden volunteer shift', description: 'The garden crew needs your yes or no for the morning planting shift.', category: 'action', label: 'Neighborhood', reason: 'The later supply update leaves the attendance question unanswered.', next: 'Decide whether to take the morning shift, then reply in your email app.'},
    {id: 'shelf', sender: 'Rowan at Corner Workshop', subject: 'The shelf plan needs your pick', description: 'Choose a finish so the workshop can start your bookshelf.', category: 'action', label: 'Home / Projects', reason: 'Work is on hold until you choose a finish.', next: 'Add your preferred finish in a note for the next review.'},
    {id: 'library', sender: 'Lantern Library', subject: 'The repair café is coming back', description: 'The library’s monthly repair café returns with volunteers offering household repairs.', category: 'awareness', label: 'Around town', reason: 'A local event that requires no RSVP.', next: 'Keep it on your radar, or dismiss it if it is not for you.'},
    {id: 'tools', sender: 'Small Tools Dispatch', subject: 'A tiny tool for a calmer desktop', description: 'This week’s digest features a window organizer and an essay on personal software.', category: 'awareness', label: 'Technology', reason: 'Relevant to your interests; no request or deadline.', next: 'Read when you have space. Dismiss when you have the gist.'}
  ];
  const example = (id, sender, subject, description, category, label, reason, next) => ({id, sender, subject, description, category, label, reason, next});
  const batches = [examples, [
    example('agenda', 'Maple Street volunteers', 'Review the updated planting plan', 'Choose between two garden layouts before supplies are ordered.', 'action', 'Neighborhood', 'A new decision arrived after the morning review. The earlier volunteer confirmation remains handled.', 'Review the two layouts and send your preference in email.'),
    example('delivery', 'Corner Workshop', 'Choose a delivery window', 'Your finish is confirmed. Choose one of two delivery windows.', 'action', 'Home / Projects', 'A new question needs a decision. Your earlier bookshelf card stays in history.', 'Pick a delivery window. You can keep scheduling context below.'),
    example('minutes', 'Harbor Neighbors', 'Meeting notes are available', 'Meeting notes cover street improvements and an updated project calendar.', 'awareness', 'Neighborhood', 'An informational follow-up. There is no outstanding vote or request.', 'Keep it for reference or dismiss once you have the update.'),
    example('exhibit', 'Lantern Library', 'A new exhibit opens this weekend', 'A free exhibit on neighborhood print shops opens at the library. No booking needed.', 'awareness', 'Around town', 'A relevant local event with no action required.', 'Decide whether it is worth keeping on your radar.')
  ], [
    example('proof', 'Studio Finch', 'Approve the poster proof', 'The designer needs your approval to print the workshop poster.', 'action', 'Neighborhood', 'A direct approval request is waiting. The print job depends on your response.', 'Review the proof and reply with approval or specific changes.'),
    example('rsvp', 'Weekend Makers', 'Confirm your workshop place', 'Reply to reserve an open place in the weekend bookbinding session.', 'action', 'Learning', 'Your place is unconfirmed until you reply.', 'Decide whether to attend and reply in email.'),
    example('dispatch', 'Small Tools Dispatch', 'Window organizer: release notes', 'The organizer from the morning digest has a new release with keyboard shortcut improvements.', 'awareness', 'Technology', 'A product update tied to an earlier interest. It does not require a response.', 'Read if useful, or dismiss the update.'),
    example('receipt', 'Paper & Thread', 'Your supplies receipt', 'Your notebook and binding supplies receipt is ready.', 'awareness', 'Records', 'Payment is complete; keep the receipt for reference.', 'Dismiss when you’re done; the email stays in place.')
  ]];
  let state, paused = false, timer = null, lastTick = 0, generation = 0, levelRewardUntil = 0;
  const pending = new Set();
  const timeLabel = time => new Intl.DateTimeFormat('en-US', {timeZone:reviewZone, hour:'numeric', minute:'2-digit'}).format(time).replace(':00', '');
  const focusHeading = id => { const heading = $(id); heading.tabIndex = -1; heading.focus({preventScroll:true}); };
  function stop() { clearInterval(timer); timer = null; }
  stopGuest = () => { stop(); clearTimeout(rewardTimer); $('reward').hidden = true; };
  function runClock() {
    stop(); lastTick = performance.now();
    timer = setInterval(() => {
      const tick = performance.now(), elapsed = Math.min(250, tick - lastTick); lastTick = tick;
      if (!guestActive || document.hidden || paused || !state.travelling) return;
      const arrived = advanceGuestDay(state, elapsed, batches); renderTime();
      if (arrived) arrive();
    }, 100);
  }
  function renderTime() {
    const runs = guestTimes.slice(0, state.stage + 1).map(time => ({finished_at:new Date(time).toISOString(), status:'success'}));
    const timing = reviewStatus(state.now, runs);
    $('demoReviewMeter').value = timing.fraction;
    $('demoReviewMeter').setAttribute('aria-valuetext', timeLabel(state.now) + ' simulated time. Checkpoints show published fictional reviews.');
    $('demoReviewNote').textContent = 'Demo time ' + timeLabel(state.now) + ' · Last update ' + timeLabel(guestTimes[state.stage]);
    $('demoSlots').replaceChildren(...timing.slots.map(slot => {
      const item = node('li', 'review-slot ' + slot.state), mark = node('span', 'slot-mark'); mark.setAttribute('aria-hidden','true');
      if (slot.state === 'updated') mark.append(icon('check'));
      item.append(mark, node('span','',timeLabel(slot.time)), node('span','slot-state',slot.state === 'updated' ? 'Updated' : slot.state === 'next' ? 'Next' : 'Later'));
      if (slot.state === 'next') item.setAttribute('aria-current','step');
      return item;
    }));
    $('skipDemo').hidden = !state.travelling;
    $('skipDemo').textContent = state.stage < 2 ? 'Skip to ' + timeLabel(guestTimes[state.stage + 1]) : 'Skip ahead';
    $('pauseDemo').textContent = paused ? 'Resume timeline' : 'Pause timeline';
    $('pauseDemo').setAttribute('aria-pressed', String(paused));
    $('pauseDemo').hidden = state.stage === 2 && !state.travelling;
    if (state.travelling) $('demoEmptyText').textContent = paused ? 'Timeline paused. Resume or skip ahead to the next review.' : 'Fast-forwarding to ' + timeLabel(guestTimes[state.stage + 1]) + '. The next review will add new cards.';
  }
  function renderXP() {
    const xp = state.xp % 100, level = Math.floor(state.xp / 100) + 1;
    $('demoLevel').textContent = 'Level ' + String(level).padStart(2,'0'); $('demoXP').textContent = xp + ' / 100 XP';
    $('demoMeter').setAttribute('aria-valuenow', xp);
    $('demoMeter').setAttribute('aria-valuetext', xp + ' of 100 XP toward level ' + (level + 1));
    $('demoMeter').replaceChildren(...Array.from({length:10}, (_,i) => node('span','xp-segment' + (i < xp / 10 ? ' filled' : ''))));
    $('demoProgressDetails').textContent = state.xp + ' demo XP. 10 XP within 48 hours; 5 XP afterward. This demo stays within one day.';
  }
  function renderDemo() {
    $('demoBoard').classList.remove('demo-arrival');
    renderXP(); renderTime();
    for (const [cat, prefix] of [['action','demoAction'],['awareness','demoAwareness']]) {
      const group = state.cards.filter(c => c.category === cat && c.state === 'open');
      $(prefix + 'Count').textContent = group.length;
      for (const art of $(prefix + 'Cards').querySelectorAll('.agent-idle')) companionObserver?.unobserve(art);
      $(prefix + 'Cards').replaceChildren(...group.map(demoCard));
      if (!group.length) $(prefix + 'Cards').append(emptyColumn(cat));
    }
    const history = state.cards.filter(c => c.state !== 'open'), clear = !state.cards.some(c => c.state === 'open');
    $('demoHistory').hidden = !history.length; $('demoHistoryTitle').textContent = 'Handled & dismissed · ' + history.length;
    $('demoHistoryCards').replaceChildren(...history.map(demoCard));
    $('demoEmpty').hidden = !clear;
    if (clear && state.stage === 2) $('demoEmptyText').textContent = 'Day complete · ' + state.xp + ' XP · Level ' + (Math.floor(state.xp / 100) + 1) + '. Decisions saved in history.';
  }
  function arrive() {
    renderDemo(); $('demoBoard').classList.remove('demo-arrival'); void $('demoBoard').offsetWidth; $('demoBoard').classList.add('demo-arrival');
    $('demoAnnouncement').textContent = timeLabel(guestTimes[state.stage]) + ' review ready. Four new cards; earlier decisions saved in history.';
  }
  function reward(earned, levelUp) {
    if (!levelUp && performance.now() < levelRewardUntil) return;
    if (levelUp) levelRewardUntil = performance.now() + 4500;
    clearTimeout(rewardTimer);
    $('rewardArt').hidden = !levelUp;
  $('rewardTitle').textContent = levelUp ? 'LEVEL UP!' : 'DECISION COMPLETE';
    $('rewardValue').textContent = levelUp ? 'LEVEL ' + (Math.floor(state.xp / 100) + 1) : '+' + earned + ' XP';
    $('rewardDetail').textContent = levelUp ? '100 demo XP earned.' : 'Demo decision saved.';
    $('reward').hidden = false; $('reward').classList.remove('reward-enter'); void $('reward').offsetWidth; $('reward').classList.add('reward-enter');
    rewardTimer = setTimeout(() => { $('reward').hidden = true; }, levelUp ? 4500 : 1800);
    if (levelUp) { $('demoLevel').classList.remove('level-up'); void $('demoLevel').offsetWidth; $('demoLevel').classList.add('level-up'); }
  }
  function demoCard(c) {
    const article = node('article','card demo-card'), summary = node('div','card-summary'), meta = node('div','meta');
    meta.append(node('span','',c.sender));
    summary.append(meta, node('h3','',c.subject), node('p','description',c.description));
    const tags = node('div','tags'); for (const label of c.labels ?? [c.label]) tags.append(node('span','tag',label));
    if (c.state !== 'open') tags.append(node('span','tag',c.state === 'handled' ? 'Handled' : 'Dismissed'));
    const timing = cardTiming(c, state.now); summary.append(node('p','card-timing ' + timing.tone,timing.text), tags); article.append(summary);
    const body = node('div','card-body'); body.id = 'demo-details-' + c.id; body.hidden = !c.expanded;
    article.classList.toggle('expanded', !!c.expanded);
    body.append(node('p','reason',c.reason), node('p','',c.next), node('span','account','Sample account · No original email'));
    const form = node('form','feedback-form'); form.setAttribute('aria-label','Demo feedback for ' + c.subject);
    const fields = node('div','fields');
    const categoryInput = selectField(fields,'Category', [['action','Needs action'],['awareness','Worth knowing']],c.draftCategory || c.category,'category');
    const stateInput = selectField(fields,'Status', [['open','Active'],['handled','Handled'],['dismissed','Dismissed']],c.state,'state');
    stateInput.disabled = c.state !== 'open';
    form.append(fields);
    const picker = node('details','label-picker'), pickerTitle = node('summary','','Labels'), boxes = node('div','label-options');
    const chosenLabels = c.draftLabels ?? c.labels ?? [c.label];
    for (const value of [...new Set(batches.flat().map(item => item.label))]) {
      const label = node('label'), box = node('input'); box.type = 'checkbox'; box.value = value; box.checked = chosenLabels.includes(value);
      box.onchange = () => { c.draftLabels = [...boxes.querySelectorAll('input:checked')].map(input => input.value); };
      label.append(box,node('span','',value)); boxes.append(label);
    }
    picker.append(pickerTitle,boxes); form.append(picker);
    const readLabels = () => [...boxes.querySelectorAll('input:checked')].map(input => input.value);
    const label = node('label','field','Note'), note = node('textarea');
    note.rows = 3; note.maxLength = 500; note.value = c.draftNote ?? c.note; note.placeholder = 'Add context for the next review.'; label.append(note); form.append(label);
    note.oninput = () => { c.draftNote = note.value; }; categoryInput.onchange = () => { c.draftCategory = categoryInput.value; };
    const result = node('p','save-result'), saveRow = node('div','save-row'), save = node('button','primary','Save'); save.type = 'submit';
    result.setAttribute('role','status'); saveRow.append(save,result); form.append(saveRow); body.append(form);
    async function decide(outcome) {
      if (pending.has(c.id)) return;
      pending.add(c.id); const currentGeneration = generation;
      const controls = article.querySelectorAll('button,select,textarea'); controls.forEach(control => { control.disabled = true; });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { article.classList.add('departing'); await new Promise(resolve => setTimeout(resolve,180)); }
      if (generation !== currentGeneration) return;
      if (!guestActive) { pending.delete(c.id); return; }
      c.note = note.value; c.category = categoryInput.value; c.labels = readLabels(); delete c.draftNote; delete c.draftCategory; delete c.draftLabels; c.expanded = false;
      const oldLevel = Math.floor(state.xp / 100), earned = resolveGuestCard(state,c.id,outcome);
      pending.delete(c.id); const levelUp = Math.floor(state.xp / 100) > oldLevel; renderDemo(); reward(earned,levelUp);
      $('demoAnnouncement').textContent = state.travelling ? 'Board cleared. Advancing to ' + timeLabel(guestTimes[state.stage + 1]) + ' for the next review.' : state.stage === 2 && !state.cards.some(x => x.state === 'open') ? 'Day complete. All three reviews handled. Restart to explore again.' : (outcome === 'handled' ? 'Handled' : 'Dismissed') + ' · +10 demo XP.';
      if (levelUp) $('demoAnnouncement').textContent = 'Level ' + (Math.floor(state.xp / 100) + 1) + '! ' + $('demoAnnouncement').textContent;
      if (!state.cards.some(x => x.state === 'open')) {
        (state.travelling ? $('skipDemo') : $('resetDemo')).focus({preventScroll:true});
        $('guestDemo').scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      } else focusHeading(c.category === 'action' ? 'demoActionTitle' : 'demoAwarenessTitle');
    }
    form.onsubmit = e => {
      e.preventDefault();
      if (c.state === 'open' && stateInput.value !== 'open') { decide(stateInput.value); return; }
      c.note = note.value; c.category = categoryInput.value; c.labels = readLabels(); delete c.draftNote; delete c.draftCategory; delete c.draftLabels;
      tags.replaceChildren(...c.labels.map(value => node('span','tag',value)));
      if (c.state !== 'open') tags.append(node('span','tag',c.state === 'handled' ? 'Handled' : 'Dismissed'));
      result.textContent = 'Saved for this demo.';
      // Keep history read-only for outcomes; editing context never awards XP.
      if (c.state !== 'open') stateInput.value = c.state;
      if (categoryInput.value !== article.dataset.category) { renderDemo(); focusHeading(c.category === 'action' ? 'demoActionTitle' : 'demoAwarenessTitle'); }
    };
    article.dataset.category = c.category;
    const actions = node('div','quick-actions');
    if (c.state === 'open') for (const [outcome,caption] of [['handled','Handled'],['dismissed','Dismiss']]) {
      const button = node('button',outcome === 'handled' ? 'primary' : 'dismiss'); button.type = 'button';
      if (outcome === 'handled') button.append(icon('check')); button.append(document.createTextNode(caption));
      button.setAttribute('aria-label',caption + ': ' + c.subject); button.onclick = () => decide(outcome); actions.append(button);
    }
    const toggle = node('button','detail-toggle','Details'); toggle.type = 'button'; toggle.append(icon('right'));
    toggle.setAttribute('aria-label','Details: ' + c.subject); toggle.setAttribute('aria-controls',body.id); toggle.setAttribute('aria-expanded',String(!body.hidden));
    toggle.onclick = () => { c.expanded = !c.expanded; body.hidden = !c.expanded; article.classList.toggle('expanded',c.expanded); toggle.setAttribute('aria-expanded',String(c.expanded)); };
    actions.append(toggle); article.append(actions,body);
    return article;
  }
  function reset() {
    generation++; pending.clear(); state = createGuestDay(batches); paused = false; levelRewardUntil = 0;
    clearTimeout(rewardTimer); $('reward').hidden = true; $('demoHistory').open = false;
    renderDemo(); $('demoAnnouncement').textContent = '9 AM review ready. Handle or dismiss the cards to advance to 1 PM.';
    if (guestActive) runClock();
  }
  function enter() {
    if (!$('workspace').hidden) return;
    guestActive = true; signedIn(false); runClock();
    history.replaceState(null,'','#guestDemo'); $('guestDemo').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'});
  }
  function leave() {
    guestActive = false; generation++; pending.clear(); stopGuest(); signedIn(false);
    history.replaceState(null,'','#welcome'); $('startDemo').focus();
  }
  $('startDemo').onclick = e => { e.preventDefault(); enter(); };
  $('processDemo').onclick = e => { e.preventDefault(); enter(); };
  $('demoBack').onclick = e => { e.preventDefault(); leave(); };
  $('resetDemo').onclick = reset;
  $('pauseDemo').onclick = () => { paused = !paused; lastTick = performance.now(); renderTime(); };
  $('skipDemo').onclick = () => { if (state.travelling) { advanceGuestDay(state,6000,batches); arrive(); focusHeading('demoActionTitle'); } };
  $('ownerLink').onclick = e => { e.preventDefault(); if (guestActive) leave(); $('ownerLogin').open = true; $('password').focus(); };
  reset();
})();
