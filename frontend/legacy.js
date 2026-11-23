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
function reviewOutcome(run, report) {
  const coverage = run?.coverage || {}, values = Object.values(coverage);
  const recentComplete = ['mijatovic@gmail.com','milan@mijatovic.com'].every(account => coverage[account] === 'complete');
  if (run?.status === 'error' || values.includes('error')) return {state:'failed', label:'Needs attention'};
  if (run?.details?.phase === 'batch') return {state:'reviewing', label:'Review in progress'};
  if (recentComplete) return {state:'updated', label:'Updated', olderOngoing:report?.accounts?.length === 2 && report.accounts.some(account => account.historical_complete === false)};
  if (values.includes('partial')) return {state:'reviewing', label:'Review ongoing'};
  if (run?.status === 'success' && !values.length) return {state:'updated', label:'Updated'};
  return {state:'unknown', label:'Coverage unconfirmed'};
}
function reviewSummary(run, report) {
  return reviewOutcome(run, report).olderOngoing ? 'Recent mail has been reviewed in both inboxes. Review of older mail is ongoing.' : run?.summary || 'Waiting for the first verified review.';
}
function coverageLabel(value) {
  return {complete:'Reviewed',partial:'Review ongoing',error:'Needs attention',unknown:'Unconfirmed'}[value] || 'Unconfirmed';
}
function reviewDay(now, runs = [], activatedAt = null) {
  const dateKey = value => new Intl.DateTimeFormat('en-CA', {timeZone: reviewZone, year:'numeric', month:'2-digit', day:'2-digit'}).format(value);
  const slots = reviewSlots(new Date(now)).filter(t => dateKey(t) === dateKey(now));
  const firstFuture = slots.find(t => t > now);
  return slots.map((time, i) => {
    const result = runs.filter(run => {
      const finished = Date.parse(run.finished_at), detail = run.details;
      return detail?.trigger === 'scheduled' && detail.phase === 'final' && Date.parse(detail.scheduled_at) === time && finished <= now;
    }).sort((a, b) => Date.parse(b.finished_at) - Date.parse(a.finished_at))[0];
    const legacy = runs.some(run => !run.details && Date.parse(run.finished_at)>=time && Date.parse(run.finished_at)<(slots[i+1]??Infinity) && Date.parse(run.finished_at)<=now);
    const outcome = result ? reviewOutcome(result) : null;
    const state = time < Date.parse(activatedAt) ? 'inactive' : outcome ? outcome.state : legacy ? 'unknown' : time <= now ? (now - time <= 15 * 60000 ? 'due' : 'missed') : time === firstFuture ? 'next' : 'later';
    return {time, state, olderOngoing:outcome?.olderOngoing || false, finishedAt: result?.finished_at || null};
  });
}
function reviewStatus(now, runs = [], activatedAt = null) {
  const slots = reviewDay(now, runs, activatedAt), allSlots = reviewSlots(new Date(now));
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
function reviewHealth(run, report, now = Date.now()) {
  if (run?.status === 'error' || Object.values(run?.coverage || {}).includes('error')) return {title:'A recent inbox review needs attention', tone:'error'};
  if (!report) return {title:'Recent coverage is not yet confirmed', tone:'unknown'};
  const accounts = report.accounts || [], fresh = accounts.length === 2 && accounts.every(a => Number.isFinite(Date.parse(a.recent_through)) && Date.parse(a.recent_through) <= now && now - Date.parse(a.recent_through) <= 36 * 3600000);
  if (!fresh) return {title:'Recent inbox coverage needs attention', tone:'unknown'};
  if (Object.values(run?.coverage || {}).includes('partial')) return {title:'Recent mail review is ongoing', tone:'unknown'};
  return {title:accounts.every(a => a.historical_complete) ? 'Inboxes updated' : 'Inboxes updated · Older mail review ongoing', tone:'current'};
}
// End schedule helpers.
// Card timing uses elapsed hours, independent of timezone and daylight saving.
function cardTiming(c, now) {
  const received = Date.parse(c.date), start = Date.parse(c.attention_started_at || c.reopened_at || c.date);
  const duration = ms => {
    const hours = Math.floor(Math.max(0, ms) / 3600000), days = Math.floor(hours / 24);
    return days ? days + (days === 1 ? ' day' : ' days') : hours ? hours + (hours === 1 ? ' hour' : ' hours') : 'under 1 hour';
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
    text:clock + ' · ' + (c.decision_earned_at ? (late ? 'Past 48h target' : remaining + 'h left') + ' · XP already earned' : late ? 'Past 48h target · 5 XP available' : '10 XP available · ' + (remaining ? remaining + 'h left' : '48h target now'))};
}
// End card timing helpers.

// Present a single mailbox by its display name; keep ambiguous/list values intact.
function senderName(sender) {
  const raw = String(sender ?? '').trim();
  const mailbox = raw.match(/^(.*?)\s*<[^<>\s@]+@[^<>\s@]+>$/);
  if (!mailbox) return raw;
  let name = mailbox[1].trim();
  if (/^"(?:[^"\\]|\\.)*"$/.test(name)) name = name.slice(1,-1).replace(/\\(["\\])/g,'$1').trim();
  else if (/["<>@]/.test(name)) return raw;
  return name || raw.slice(1,-1);
}
function senderElement(sender) {
  const element = node('span','sender-name',senderName(sender));
  element.title = String(sender ?? '');
  return element;
}
// End sender presentation helpers.

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
let deskView = 'board', systemData = null, systemLoading = false;
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
function syncMotion() { document.documentElement.classList.toggle('motion-paused', motionPreference.matches); }
motionPreference.addEventListener('change', syncMotion); syncMotion();
const errors = {sign_in: 'Please sign in again. Your unsaved feedback is kept on this page.', invalid_login: 'That password did not work.', try_later: 'Too many sign-in attempts. Please wait 15 minutes.', conflict: 'This card changed. Your edits are preserved. Reload the latest card before saving.', not_configured: 'Email Desk is not configured yet.', origin: 'This request was blocked. Reload the page and try again.', csrf: 'Your session changed. Reload the page before trying again.', temporary: 'The server is unavailable. Displayed cards may be out of date.'};
function error(message) { $('error').textContent = message; $('error').hidden = false; }
async function api(action, body) {
  let r;
  try { r = await fetch('api.php?action=' + encodeURIComponent(action), {method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store', headers: body ? {'Content-Type': 'application/json', 'X-CSRF-Token': csrf} : {}, ...(body ? {body: JSON.stringify(body)} : {})}); }
  catch { throw Error('Could not reach the server. Your changes have not been confirmed.'); }
  let p; try { p = await r.json(); } catch { throw Error('The server returned an unreadable response. Your changes have not been confirmed.'); }
  if (!r.ok || p.ok !== true) { if (p.error === 'sign_in'&&!document.body.classList.contains('game-active')) signedIn(false); throw Error(errors[p.error] || 'Could not complete the request (' + (p.error || r.status) + ').'); }
  return p;
}
function signedIn(value) {
  if (!value) { window.questSystem=false; if(document.body.classList.contains('game-active'))window.exitQuest?.(); closeContextPanel(false,true); $('contextPanelContent').replaceChildren(); }
  if (value) { guestActive = false; stopGuest(); history.replaceState(null,'','#workspace'); }
  $('login').hidden = true; $('welcome').hidden = value || guestActive;
  $('ownerLink').hidden = value || guestActive; $('demoBack').hidden = value || !guestActive;
  $('guestDemo').hidden = value || !guestActive;
  $('workspace').hidden = !value; $('logout').hidden = !value;
  $('skipLink').href = value ? '#workspace' : guestActive ? '#guestDemo' : '#welcome';
  $('navSystem').hidden = !value;
  document.querySelector('.appearance').open = false;
  $('navBoard').setAttribute('aria-current','page'); $('navHistory').removeAttribute('aria-current');
  document.body.dataset.view = value ? 'workspace' : guestActive ? 'demo' : 'welcome';
  document.querySelector('.desk-nav').hidden = !(value || guestActive);
  const previousProgress = $('railProgress').firstElementChild;
  if (previousProgress) $(previousProgress.id === 'progressInfo' ? 'workspace' : 'guestDemo').querySelector('.status-strip').prepend(previousProgress);
  const progress = value ? $('progressInfo') : document.querySelector('#guestDemo .progress-info');
  if (value || guestActive) $('railProgress').replaceChildren(progress);
  $('railProgress').hidden = !(value || guestActive);
  if (value) setDeskView(deskView);
  $('navHistoryCount').textContent = value ? data.cards.filter(c => c.state !== 'open').length || '' : '';

}
function setDeskView(view) {
  if(view !== deskView) closeContextPanel(false);
  deskView = view;
  $('boardOverview').hidden = view !== 'board'; $('history').hidden = view !== 'history'; $('system').hidden = view !== 'system';
  $('deskTitle').textContent = {board:'Your board',history:'Your decisions',system:'System'}[view];
  for (const [id, target] of [['navBoard','board'],['navHistory','history'],['navSystem','system']]) {
    if (target === view) $(id).setAttribute('aria-current','page'); else $(id).removeAttribute('aria-current');
  }
}
function goToDesk(historyView = false) {
 if(window.questSystem){window.questSystem=false;window.questInitialView=historyView?'history':'round';render();return;}
  if ($('workspace').hidden && !guestActive) return;
  closeContextPanel(false);
  if (!guestActive) {
    setDeskView(historyView ? 'history' : 'board'); renderHistory();
    $('deskTitle').tabIndex = -1; $('deskTitle').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); return;
  }
  const target = $(historyView ? 'demoHistory' : 'guestDemo');
  if (target.hidden) { notify('No handled or dismissed cards yet.'); return; }
  if (historyView) target.open = true;
  target.tabIndex = -1; target.focus({preventScroll:true}); target.scrollIntoView({block:'start'});
  $('navBoard').toggleAttribute('aria-current', !historyView); $('navHistory').toggleAttribute('aria-current', historyView);
}
$('navBoard').onclick = () => goToDesk();
$('navHistory').onclick = () => goToDesk(true);
$('navSystem').onclick = () => { setDeskView('system'); $('deskTitle').tabIndex=-1; $('deskTitle').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); loadSystem(); };
$('reviewReceipt').onclick = () => $('navSystem').click();
$('brandHome').onclick = e => { if (!$('workspace').hidden || guestActive) { e.preventDefault(); goToDesk(); } else { e.preventDefault(); $('login').hidden=true; $('welcome').hidden=false; history.replaceState(null,'','#welcome'); window.scrollTo({top:0,behavior:'instant'}); } };
$('loginBack').onclick = () => { $('login').hidden=true; $('welcome').hidden=false; $('skipLink').href='#welcome'; };
function interactionLock() {
  const locked = refreshing || saving.size > 0;
  $('board').inert = locked; $('history').inert = locked;
  $('logout').disabled = locked;
  $('navBoard').disabled = locked; $('navHistory').disabled = locked; $('navSystem').disabled = locked;
}
function dateLabel(date) { const d = new Date(date); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], {month: 'short', day: 'numeric'}); }
const category = c => c.user_category || c.category;
const labels = c => c.user_labels ?? c.labels;
const same = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const feedbackLabel = {processing:'Applying reviewed-message archive',pending: 'Saved · awaiting review', applied: 'Labels updated in Gmail', recorded: 'Guidance reviewed', superseded: 'Replaced by a newer decision', error: 'Feedback needs another attempt'};
function notify(message) { clearTimeout(toastTimer); $('toastMessage').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 7000); }
function celebrate(earned, levelUp) {
  if (!earned && !levelUp) return;
  clearTimeout(rewardTimer);
  $('rewardArt').hidden = !levelUp;
  $('rewardTitle').hidden = !levelUp; $('rewardDetail').hidden = true;
  $('rewardTitle').textContent = levelUp ? 'LEVEL UP' : '';
  $('rewardValue').textContent = levelUp ? 'LEVEL ' + progress().level : '+' + earned + ' XP';
  $('rewardDetail').textContent = levelUp ? '' : '';
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
    $('reviewNote').hidden = false;
    $('reviewNote').textContent = boardReadFailed ? 'Could not load the board. It will retry automatically.' : 'Checking saved review results.';
    meter.removeAttribute('value'); $('reviewSlots').replaceChildren(); return;
  }
  const now = Date.now(), runs = data.runs || (data.run ? [data.run] : []), timing = reviewStatus(now, runs, data.report?.activated_at);
  const clock = new Intl.DateTimeFormat('en-US', {timeZone: reviewZone, hour:'numeric', minute:'2-digit'});
  const timeLabel = value => clock.format(value).replace(':00', '').replace(' ', '\u00a0');
  const captions = {inactive:'Before activation',unknown:'Coverage unconfirmed',updated:'Updated', reviewing:'Review ongoing', failed:'Needs attention', due:'Due', missed:'Missed', next:'Next', later:'Later'};
  const missed=timing.slots.filter(slot=>slot.state==='missed').length;
  $('reviewHeading').textContent = (data.run ? reviewOutcome(data.run,data.report).label + ' · ' + stampLabel(data.run.finished_at) : 'Coverage unconfirmed') + (timing.next ? ' · Next review ' + timeLabel(timing.next) : '') + (missed ? ' · ' + missed + ' missed review' + (missed===1?'':'s') : '');
  meter.value = timing.fraction; meter.setAttribute('aria-valuetext', Math.round(timing.fraction * 100) + '% of today’s route from ' + timeLabel(timing.slots[0].time) + ' to ' + timeLabel(timing.slots.at(-1).time) + ' New York time. Checkpoints show actual publication results; the route measures time.');
  $('reviewNote').hidden = !boardReadFailed;
  $('reviewNote').textContent = boardReadFailed ? 'Connection lost · showing saved results' : '';
  $('reviewSlots').replaceChildren(...timing.slots.map(slot => {
    const item = node('li', 'review-slot ' + slot.state), mark = node('span', 'slot-mark'); mark.setAttribute('aria-hidden', 'true');
    if (slot.state === 'updated') mark.append(icon('check'));
    else if (slot.state === 'missed') mark.textContent = '–';
    const time = node('time', '', timeLabel(slot.time)); time.dateTime = new Date(slot.time).toISOString();
    item.append(mark, time, node('span', 'slot-state', captions[slot.state]));
    if (slot.state === 'next' || slot.state === 'due') item.setAttribute('aria-current', 'step');
    if (slot.state === 'missed') item.title = 'No publication recorded for this review time. Later reviews run independently.';
    if (slot.finishedAt) item.title = captions[slot.state] + (slot.olderOngoing ? ' · Older mail review ongoing' : '') + ' · published ' + timeLabel(new Date(slot.finishedAt)) + ' New York time';
    return item;
  }));
}
function stampLabel(value) {
  return Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-US',{timeZone:reviewZone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)) + ' New York' : 'Not yet confirmed';
}
function scanStatus(failed = false) {
  const run = data.run, health = reviewHealth(run, data.report);
  $('scan').hidden = false;
  $('scanTitle').textContent = failed ? (boardLoaded ? 'Couldn’t refresh the board · Showing saved results' : 'Couldn’t load the board') : health.title;
  $('scan').dataset.health = failed ? 'error' : health.tone;
  const details = $('scanDetails'); details.replaceChildren();
  details.append(node('p','',failed ? 'Saved cards and unsaved edits are kept. Retrying automatically.' : reviewSummary(run, data.report)));
  details.append(node('p','', 'Latest publication: ' + stampLabel(run?.finished_at)));
  if (data.report) {
    details.append(node('p','',data.report.schedule_active ? 'Hosted schedule active · Weekdays 9 AM, 1 PM, 5:30 PM; weekends 9 AM, 5:30 PM New York.' : 'Hosted schedule activation is not confirmed.'));
    for (const account of data.report.accounts) details.append(node('p','',account.account + (run?.coverage?.[account.account] ? ' · Recent mail: '+coverageLabel(run.coverage[account.account]) : '') + ' · Checked through ' + stampLabel(account.recent_through) + '. ' + (account.historical_complete ? 'Older mail review complete.' : 'Older mail review ongoing' + (account.historical_through ? ' · reached ' + stampLabel(account.historical_through) : '') + '.')));
  } else for (const [account, time] of Object.entries(data.checkpoints || {})) details.append(node('p','',account + ': last confirmed coverage ' + stampLabel(time)));
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
  if(boardLoaded&&!window.questSystem)window.startQuest?.({api:async(action,body)=>{if(body){const session=await api('session');csrf=session.csrf;}return api(action,body);},board:data,timeline:questTimeline,health:questHealth,initialView:window.questInitialView,focusCard:window.questFocusCard,onSystem:()=>{window.questSystem=true;$('navSystem').click();refresh();}});window.questInitialView=null;window.questFocusCard=null;
  closeContextPanel(false);
  for (const id of ['actionCards', 'awarenessCards', 'historyCards']) { for (const art of $(id).querySelectorAll('.agent-idle')) companionObserver?.unobserve(art); $(id).replaceChildren(); }
  const active = data.cards.filter(c => c.state === 'open');
  for (const cat of ['action', 'awareness']) {
    const group = active.filter(c => category(c) === cat); $(cat + 'Count').textContent = group.length;
    for (const c of group) $(cat + 'Cards').append(card(c));
    if (!group.length) $(cat + 'Cards').append(emptyColumn(cat, boardReadFailed || reviewHealth(data.run,data.report).tone !== 'current' ? 'unconfirmed' : !data.run ? 'waiting' : 'clear'));
  }
  const history = data.cards.filter(c => c.state !== 'open'); renderHistory();
  $('empty').hidden = !!active.length;
  $('empty').querySelector('h2').textContent = boardReadFailed || reviewHealth(data.run,data.report).tone !== 'current' ? 'No active saved cards. Coverage needs attention.' : history.length ? 'No active cards' : !data.run ? 'Your board is getting started.' : reviewOutcome(data.run).state === 'updated' ? 'You’re up to date.' : 'No saved cards yet.';
  $('empty').querySelector('p').textContent = boardReadFailed || reviewHealth(data.run,data.report).tone !== 'current' ? 'An empty board is not a confirmed all-clear. Check the review notice for coverage details.' : history.length ? 'Decisions saved in history. New cards appear automatically.' : !data.run ? 'Waiting for the first review. Planned times are above.' : reviewOutcome(data.run).state === 'updated' ? 'The latest review found no cards to add.' : 'Review is ongoing. See the review notice for details.';
  renderProgress(); scanStatus(); renderReviewDay(); renderCardTiming(); setDeskView(deskView);
}
function renderHistory() {
  const all=data.cards.filter(c=>c.state!=='open'), query=$('historySearch').value.trim().toLocaleLowerCase(), state=$('historyState').value, since=$('historySince').value;
  const matches=all.filter(c=>(state==='all'||c.state===state)&&(!since||(c.decision_earned_at||'').slice(0,10)>=since)&&(!query||[c.subject,c.sender,c.description,c.note,...labels(c)].join(' ').toLocaleLowerCase().includes(query)));
  matches.sort((a,b)=>String(b.decision_earned_at||b.updated_at||b.date).localeCompare(String(a.decision_earned_at||a.updated_at||a.date)));
  $('navHistoryCount').textContent=all.length||''; $('historyTitle').textContent='Done & not important';
  $('historyResult').textContent=all.length ? matches.length + ' of ' + all.length + ' decisions' + (!matches.length ? ' · No matching decisions. Try another search or clear the filters.' : '') : 'No decisions yet. Handled and dismissed cards will appear here.';
  $('historyCards').replaceChildren(...matches.map(card));
}
for(const id of ['historySearch','historyState','historySince']) $(id).addEventListener('input',renderHistory);
async function loadSystem() {
  if(systemLoading) return; systemLoading=true; $('systemState').textContent='Loading saved system information…';
  try { const result=await api('system'); systemData=result.result; renderSystem(); $('systemState').textContent='Saved reporting · ' + stampLabel(systemData.report?.generated_at); }
  catch(e) { $('systemState').textContent='Could not refresh system information. ' + (systemData?'Showing previously loaded data. ':'') + e.message; }
  finally { systemLoading=false; }
}
function systemSection(title) { const section=node('section','system-panel'); section.append(node('h4','',title)); return section; }
function renderSystem() {
  const root=$('systemContent'); root.replaceChildren(); const report=systemData?.report;
  const health=systemSection('Review health');
  health.append(node('p','',reviewHealth(data.run,report).title));
  health.append(node('p','',report?.schedule_active?'Hosted schedule active · New York time, including daylight saving.':'Hosted schedule status is not yet available.'));
  health.append(node('p','','Weekdays: 9 AM, 1 PM and 5:30 PM. Weekends: 9 AM and 5:30 PM.'));
  health.append(node('p','','Latest board publication: '+stampLabel(data.run?.finished_at)));
  for(const a of report?.accounts||[]) health.append(node('p','',a.account+(data.run?.coverage?.[a.account]?' · Recent mail: '+coverageLabel(data.run.coverage[a.account]):'')+' · Checked through '+stampLabel(a.recent_through)+' · '+(a.historical_complete?'Older mail review complete':'Older mail review ongoing'+(a.historical_through?' · reached '+stampLabel(a.historical_through):''))));
  root.append(health);
  const usage=systemSection('API usage');
  usage.append(node('p','','Calculated from returned tokens, not posted billing. No balance or monthly forecast is inferred. Includes incomplete responses with recorded usage; network-uncertain requests may have unknown usage.'));
  if(!report) usage.append(node('p','','Usage has not been published by the hosted worker yet. This is unknown, not zero.'));
  else {
    const controls=node('div','history-tools'), rangeLabel=node('label','','Date range'), range=node('select'), purposeLabel=node('label','','Work type'), purpose=node('select');
    for(const [value,caption] of [['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days']]) { const option=node('option','',caption);option.value=value;range.append(option); }
    range.value='30'; rangeLabel.append(range);
    for(const [value,caption] of [['all','All work'],['routine','Routine'],['mixed','Routine + catch-up'],['manual','Manual validation'],['dry_run','Dry-run'],['legacy','Legacy / unclassified'],['catch_up','Catch-up']]) { const option=node('option','',caption);option.value=value;purpose.append(option); }
    purposeLabel.append(purpose); controls.append(rangeLabel,purposeLabel); usage.append(controls);
    const totals=node('p','usage-total'), note=node('p',''), list=node('div','usage-rows'); totals.setAttribute('role','status'); usage.append(totals,note,list);
    const update=()=>{
      const cutoff=new Date(Date.now()-(Number(range.value)-1)*86400000).toLocaleDateString('en-CA',{timeZone:reviewZone});
      const rows=report.usage.rows.filter(r=>r.day>=cutoff&&(purpose.value==='all'||r.purpose===purpose.value));
      const count=key=>rows.reduce((n,r)=>n+r[key],0), known=rows.filter(r=>r.calculated_usd!==null), cost=known.reduce((n,r)=>n+Number(r.calculated_usd),0);
      totals.textContent=count('requests').toLocaleString()+' requests · '+count('input_tokens').toLocaleString()+' input tokens · '+count('output_tokens').toLocaleString()+' output tokens · $'+cost.toFixed(6)+' calculated'+(known.length<rows.length?' (known rates only)':'');
      note.textContent=count('cached_tokens').toLocaleString()+' cached reads · '+count('cache_write_tokens').toLocaleString()+' cache writes (both included in input) · '+count('retries')+' retry requests · '+count('incomplete')+' incomplete or unverified responses. '+report.usage.unknown_requests+' requests have unknown usage across the reporting snapshot. Legacy work cannot be reliably divided into routine and catch-up.';
      list.replaceChildren(); if(!rows.length) list.append(node('p','','No recorded usage matches this range. Reporting begins '+report.usage.since+'.'));
      for(const row of rows) {const item=node('p','usage-row'); item.textContent=row.day+' · '+({routine:'Routine',mixed:'Routine + catch-up',manual:'Manual validation',dry_run:'Dry-run',legacy:'Legacy / unclassified',catch_up:'Catch-up'}[row.purpose])+' · '+row.requests+' requests · '+row.model+' · '+(row.calculated_usd===null?'Cost unknown':'$'+Number(row.calculated_usd).toFixed(6))+' · rate snapshot '+row.rate_date; list.append(item);}
    }; range.onchange=update;purpose.onchange=update;update();
    const rates=node('details','rate-details'), source=node('a','','Official pricing');source.href='https://developers.openai.com/api/docs/models/gpt-6-luna';source.target='_blank';source.rel='noopener noreferrer';
    rates.append(node('summary','','How calculated cost works'),node('p','','GPT-6 Luna standard rates per million tokens: input $0.10, cached reads $0.01, cache writes $0.125, output $0.50. Snapshots November 20 and 21, 2026. Cached reads and writes are subtracted from ordinary input; reasoning is included in output. Other models or unknown rate snapshots have unknown cost.'),source);usage.append(rates);
  } root.append(usage);
  const runs=systemSection('Recent publications'); runs.append(node('p','','Scheduled reviews are matched to an explicit slot. Manual publications and older records do not fill a scheduled checkpoint. Intermediate batches are separate from final results.'));
  for(const run of systemData.runs||[]) {const detail=run.details; runs.append(node('p','run-row',stampLabel(run.finished_at)+' · '+reviewOutcome(run).label+(reviewOutcome(run).olderOngoing?' · Older mail review ongoing':'')+' · '+(detail ? (detail.trigger==='scheduled'?'Scheduled '+stampLabel(detail.scheduled_at):'Manual')+' · '+detail.phase+' · attempt '+detail.attempt+' · started '+stampLabel(detail.started_at)+' · review completed '+stampLabel(detail.completed_at) : 'Legacy · trigger and slot unknown')));}
  if(!systemData.runs?.length) runs.append(node('p','','No publications recorded yet.')); root.append(runs);
  const feedback=systemSection('Feedback awaiting review');
  feedback.append(node('p','','Guidance is saved immediately. Gmail label changes are confirmed only after exact-message verification.'));
  for(const event of systemData.feedback||[]) { const item=node('div','feedback-row'), link=node('button','','Find card');link.type='button';link.onclick=()=>{const c=data.cards.find(c=>c.id===event.card_id);if(!c){notify('This card is not loaded.');return;}window.questSystem=false;window.questInitialView=c.state==='open'?'classic':'history';window.questFocusCard=c.id;render();return;opened.add(c.id);$('historySearch').value='';$('historyState').value='all';$('historySince').value='';setDeskView(c.state==='open'?'board':'history');render();const target=$('card-'+c.id);target.tabIndex=-1;target.focus();target.scrollIntoView({block:'start'});target.querySelector('.detail-toggle')?.click();};item.append(node('p','',event.subject+' · '+(feedbackLabel[event.status]||event.status)+' · '+stampLabel(event.created_at)),link);if(event.explanation)item.append(node('p','',event.explanation));feedback.append(item); }
  if(!systemData.feedback?.length) feedback.append(node('p','','No pending or failed feedback in the saved queue.'));
  if(systemData.remaining)feedback.append(node('p','',systemData.remaining+' more events remain.'));root.append(feedback);
  const rules=systemSection('Organization rules'), master=node('a','','Open the master Google Doc');master.href='https://docs.google.com/document/d/1ztPK3AzpgE8cgl3CAjiCFQVEw4LjlksIitJmg9T1BJc/edit';master.target='_blank';master.rel='noopener noreferrer';rules.append(node('p','','Guidance stays with its conversation and relevant saved guidance is supplied for related future emails. Shared senders or subject words are clues, not blanket rules. Guidance is editable and does not retrain model weights. Explicit label corrections are applied only after exact-message verification. Dismissal does not retrain model weights or adopt a broad rule; the master playbook governs shared preferences.'),master,node('p','','Last successful rule fetch: '+stampLabel(report?.playbook?.fetched_at)),node('p','',report?.playbook?.revision?'Source revision: '+report.playbook.revision:'Source revision was not recorded. The Google Doc remains master; the local Markdown is a reference.'));root.append(rules);
}

// Compact visual timing keeps the full policy/date explanation available to assistive tech and focus.
function timingBadge(c, now) {
  const badge = node('div','card-timing'); updateTimingBadge(badge,c,now); return badge;
}
function updateTimingBadge(badge,c,now) {
  const timing = cardTiming(c,now), hours = Math.max(0,Math.floor((now-Date.parse(c.date))/3600000));
  badge.className = 'card-timing ' + timing.tone; badge.replaceChildren();
  badge.tabIndex = 0; badge.setAttribute('role','group'); badge.setAttribute('aria-label',timing.text); badge.title = timing.text;
  const visual = node('span','timing-visual'); visual.setAttribute('aria-hidden','true');
  const age = Date.parse(c.date) > now ? 'Date ahead' : Number.isFinite(hours) ? hours >= 24 ? Math.floor(hours/24) + 'd old' : hours ? hours + 'h old' : '<1h old' : 'Age unknown';
  visual.append(node('span','age-chip',age));
  if (c.state === 'open' && !c.decision_earned_at) {
    const start = Date.parse(c.attention_started_at || c.reopened_at || c.date);
    if (Number.isFinite(start) && !timing.late) { const meter = node('meter','age-meter'); meter.min=0; meter.max=48; meter.value=Math.max(0,Math.min(48,48-(now-start)/3600000)); visual.append(meter); }
    if (timing.late) visual.append(node('span','age-target','Past 48h'));
  }
  visual.append(node('span','xp-chip',c.decision_earned_at ? (c.decision_xp ?? 10) + ' XP earned' : timing.tone === 'unknown' ? 'XP on decision' : (timing.late ? '5' : '10') + ' XP'));
  const explanation=node('span','timing-detail',timing.text + (c.state === 'open' && !c.decision_earned_at ? ' 10 XP within the 48-hour target; 5 XP afterward. This is not a sender deadline.' : '')); explanation.setAttribute('aria-hidden','true'); badge.append(visual,explanation);
}
function renderCardTiming() {
  const now = Date.now();
  for (const c of data.cards) { const element = document.getElementById('card-' + c.id)?.querySelector('.card-timing'); if (element) updateTimingBadge(element,c,now); }
}
// The panel reuses each card's existing editor and save path; drafts stay with the card.
let panelSession = null, panelPending = false;
function closeContextPanel(restoreFocus = true,force = false) {
  if (!panelSession || ((saving.size || panelPending) && !force)) return;
  const session = panelSession; panelSession = null;
  session.home.append(session.body); session.body.hidden = true; session.home.classList.remove('context-selected'); session.onClose();
  $('contextPanel').hidden = true; document.body.classList.remove('context-panel-open');
  if (restoreFocus && session.trigger.isConnected) session.trigger.focus({preventScroll:true});
}
function openContextPanel(body, c, trigger, home, onClose, fictional = false) {
  if (saving.size || panelPending || panelSession?.body === body) return;
  closeContextPanel(false);
  panelSession = {body, trigger, home, onClose}; home.classList.add('context-selected');
  $('contextPanelSender').textContent = senderName(c.sender);
  $('contextPanelSubject').textContent = c.subject;
  body.hidden = false; $('contextPanelContent').replaceChildren(body);
  $('contextPanel').dataset.fictional = String(fictional);
  document.body.classList.add('context-panel-open'); $('contextPanel').hidden = false;
  $('contextPanel').querySelector('.context-panel-scroll').scrollTop = 0; $('contextPanelTitle').focus({preventScroll:true});
}
$('closeContextPanel').onclick = () => closeContextPanel();
document.addEventListener('keydown', e => {
  if(!panelSession) return;
  if(e.key === 'Escape') { e.preventDefault(); closeContextPanel(); return; }
  // On phones the editor fills the screen; desktop focus remains nonmodal.
  if(e.key !== 'Tab' || !matchMedia('(max-width:760px)').matches) return;
  const panel=$('contextPanel'), controls=[...panel.querySelectorAll('button,input,textarea,a[href],summary')].filter(el=>!el.matches(':disabled') && el.getClientRects().length);
  const first=controls[0], last=controls.at(-1); if(!first) return;
  if(!panel.contains(document.activeElement) || (e.shiftKey && (document.activeElement===first || document.activeElement===$('contextPanelTitle')))) { e.preventDefault(); (e.shiftKey?last:first).focus(); }
  else if(!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
});
function bucketField(form,current,includeDismiss = false,dismissed = false) {
  const group = node('fieldset','bucket-picker'), options=node('div','bucket-options'); group.append(node('legend','','Show in'));
  for (const [value,caption] of [['action','Needs action'],['awareness','Worth knowing'],...(includeDismiss ? [['dismissed','Not important']] : [])]) {
    const label=node('label'), input=node('input'); input.type='radio'; input.name='category'; input.value=value; input.checked=(dismissed ? 'dismissed' : current)===value;
    label.append(input,node('span','',caption)); options.append(label);
  }
  group.append(options);
  Object.defineProperty(group,'value',{get:()=>group.querySelector('input:checked').value === 'dismissed' ? current : group.querySelector('input:checked').value});
  Object.defineProperty(group,'dismissed',{get:()=>group.querySelector('input:checked').value === 'dismissed'}); form.append(group); return group;
}
function labelChoices(picker,boxes) {
  const update=()=>{ for(const option of boxes.children) option.style.order=option.querySelector('input').checked?'-1':'0'; };
  boxes.addEventListener('change',update); update();
}
function card(c) {
  const draft = drafts.get(c.id), wrapper = node('article', 'card'), details = node('div', 'card-details'); wrapper.id = 'card-' + c.id;
  const summary = node('div', 'card-summary'), meta = node('div', 'meta'), time = node('time', '', dateLabel(c.date)); time.dateTime = c.date;
  meta.append(senderElement(c.sender), time);
  summary.append(meta, node('h3', '', c.subject), node('p', 'description', c.description));
  if (c.deadline) summary.append(node('p', 'deadline', c.deadline));
  const tags = node('div', 'tags'); for (const l of labels(c)) tags.append(node('span', 'tag', l));
  if (c.state !== 'open') tags.append(node('span', 'tag state-tag', c.state === 'handled' ? 'Done' : 'Not important'));
  const context = node('div', 'card-context'); context.append(tags); summary.append(context); details.append(summary);
  const body = node('div', 'card-body'); body.id = 'details-' + c.id; body.hidden = true;
  if (c.question) body.append(node('p', 'question', c.question));
  const link = node('a', 'email-link primary', 'Open email'); link.append(icon('right')); link.href = 'https://mail.google.com/mail/u/?authuser=' + encodeURIComponent(c.account) + '#all/' + encodeURIComponent(c.thread_id); link.target = '_blank'; link.rel = 'noopener noreferrer';
  const form = node('form', 'feedback-form'); form.setAttribute('aria-label', 'Feedback for ' + c.subject);
  const fields = node('fieldset', 'feedback-fields'), row = node('div', 'fields');
  const cat = bucketField(row,draft?.category ?? category(c),c.state !== 'handled',(draft?.state ?? c.state) === 'dismissed' && c.state !== 'handled'); let decision = draft?.state ?? c.state; fields.append(row);
  cat.querySelector('legend').textContent = 'Attention';
  const picker = node('details', 'label-picker'), pickerSummary = node('summary', '', 'Change labels'), boxes = node('div', 'label-options'), chosen = draft?.labels ?? labels(c); picker.append(pickerSummary);
  for (const l of data.labels) { const label = node('label'), box = node('input'); box.type = 'checkbox'; box.name = 'labels'; box.value = l; box.checked = chosen.includes(l); label.append(box, node('span', '', l)); boxes.append(label); }
  labelChoices(picker,boxes); picker.append(boxes); fields.append(picker);
  const noteLabel = node('label', 'field', 'Guidance'), note = node('textarea'); note.name = 'note'; note.rows = 3; note.maxLength = 8000; note.placeholder = 'What should I remember when sorting emails like this?'; note.value = draft?.note ?? c.note ?? ''; noteLabel.append(note); fields.insertBefore(noteLabel,picker); form.append(fields);
  const result = node('p', 'save-result'); result.setAttribute('role', 'status');
  const actions = node('div', 'save-row'), save = node('button', 'context-save', 'Save'); save.type = 'submit'; save.disabled = !draft; save.hidden = !draft; actions.append(save, result); form.append(actions); body.append(form); wrapper.append(details);
  const quick = node('div', 'quick-actions'), quickButtons = []; quick.append(link);
  for (const [value, caption] of c.state === 'open' ? [['handled','Done']] : [['open','Reopen']]) {
    const button = node('button',value === 'handled' ? 'handled' : value === 'open' ? 'reopen' : 'dismiss'); button.type='button'; button.dataset.outcome=value;
    const text=node('span','decision-caption',caption); button.append(text);
    button.setAttribute('aria-label',caption + ': ' + c.subject);
    button.onclick=()=>{ decision=value; changed(); form.requestSubmit(); }; quick.append(button); quickButtons.push(button);
  }
  const toggle = node('button', 'detail-toggle', 'Guidance'); toggle.type = 'button'; toggle.setAttribute('aria-label', 'Guidance: ' + c.subject); toggle.setAttribute('aria-controls', body.id); toggle.setAttribute('aria-expanded', String(!body.hidden));
  function setExpanded(value) { if (!value) { window.questSystem=false; if(document.body.classList.contains('game-active'))window.exitQuest?.(); closeContextPanel(); return; } opened.add(c.id); toggle.setAttribute('aria-expanded','true'); openContextPanel(body,c,toggle,wrapper,()=>{opened.delete(c.id);toggle.setAttribute('aria-expanded','false');}); }
  const closeDetails=$('closeContextPanel');
  toggle.onclick = () => setExpanded(body.hidden); quick.insertBefore(toggle, quick.querySelector('.dismiss')); wrapper.append(quick, body);
  const read = () => ({category: cat.value, state: decision, labels: [...boxes.querySelectorAll('input:checked')].map(x => x.value), note: note.value, revision: draft?.revision ?? c.revision});
  function changed() {
    const v = read(); pickerSummary.textContent = 'Change labels';
    const dirty = v.category !== category(c) || v.state !== c.state || v.note !== (c.note || '') || !same(v.labels, labels(c));
    save.disabled = !dirty; save.hidden = false; save.textContent = 'Save';
    if (dirty) drafts.set(c.id, v); else drafts.delete(c.id);
    result.classList.remove('save-error'); result.textContent = dirty ? 'Unsaved' : c.feedback_status === 'error' ? feedbackLabel.error : '';
  }
  function busy(value) {
    if (value) saving.add(c.id); else saving.delete(c.id);
    wrapper.classList.toggle('saving', value); wrapper.setAttribute('aria-busy', String(value)); fields.disabled = value; save.disabled = value || !drafts.has(c.id);
    const reload=actions.querySelector('.load-latest'); if(reload) reload.disabled=value;
    for (const button of quickButtons) button.disabled = value;
    $('closeContextPanel').disabled = value; closeDetails.disabled = value; interactionLock();
  }
  cat.addEventListener('change',()=>{decision=cat.dismissed ? 'dismissed' : c.state;});
  pickerSummary.textContent = 'Change labels'; form.addEventListener('input', changed); form.addEventListener('change', changed); changed();
  if (saving.has(c.id)) busy(true);
  form.addEventListener('submit', async e => {
    e.preventDefault(); if (saving.size || refreshing) return;
    if (e.submitter === save) decision = cat.dismissed ? 'dismissed' : c.state;
    const v = read(), hadFocus = wrapper.contains(document.activeElement) || body.contains(document.activeElement), previousLevel = progress().level;
    const payload = {operation_id: crypto.randomUUID(), card_id: c.id, revision: v.revision, state: v.state, category: v.category, note: v.note, labels: same(v.labels, c.labels) ? null : v.labels};
    const signature = JSON.stringify({...payload, operation_id: ''}), old = attempts.get(c.id);
    if (old?.signature === signature) payload.operation_id = old.operation_id; else attempts.set(c.id, {signature, operation_id: payload.operation_id});
    busy(true); result.textContent = 'Saving…';
    try {
      const r = await api('feedback', payload);
      // Animate only after the server confirms the write. No optimistic disappearance or XP.
      if (c.state === 'open' && r.result.card.state !== 'open' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { wrapper.classList.add('departing'); await new Promise(resolve => setTimeout(resolve, 180)); }
      data.cards = data.cards.map(x => x.id === c.id ? r.result.card : x); drafts.delete(c.id); attempts.delete(c.id);
      if (r.result.card.state !== 'open') opened.delete(c.id);
      if(c.state!=='open' && r.result.card.state==='open') { setDeskView('board'); opened.add(c.id); }
      busy(false); closeContextPanel(false); render();
      const earned = r.result.xp_earned || 0, levelUp = progress().level > previousLevel;
      notify((levelUp ? 'Level ' + progress().level + '! ' : '') + (r.result.card.state === c.state ? 'Guidance saved' : r.result.card.state === 'handled' ? 'Done' : r.result.card.state === 'dismissed' ? 'Not important' : 'Reopened') + (earned ? ' · +' + earned + ' XP' : ''));
      celebrate(earned, levelUp);
      if (levelUp) { $('level').classList.remove('level-up'); void $('level').offsetWidth; $('level').classList.add('level-up'); }
      if (hadFocus) { const target = r.result.card.state === 'open' || deskView === 'history' ? $('card-' + c.id)?.querySelector('.detail-toggle') : $(category(c) + 'Cards').querySelector('.quick-actions button'); if (target) target.focus({preventScroll: true}); else { const heading = $(category(c) + 'Title'); heading.tabIndex = -1; heading.focus({preventScroll: true}); } }
    } catch (err) {
      busy(false); result.textContent = err.message; result.classList.add('save-error'); if ($('workspace').hidden) { error(err.message); return; } setExpanded(true);
      if (err.message.startsWith('This card changed') && !actions.querySelector('.load-latest')) {
        const reload = node('button', 'load-latest', 'Discard draft & load latest'); reload.type = 'button';
        reload.onclick = async () => { reload.disabled=true; try { const latest = await api('board'); drafts.delete(c.id); attempts.delete(c.id); data = latest.result; const latestCard=data.cards.find(item=>item.id===c.id); if(latestCard) { $('historySearch').value=''; $('historyState').value='all'; $('historySince').value=''; setDeskView(latestCard.state==='open'?'board':'history'); } render(); $('card-'+c.id)?.querySelector('.detail-toggle')?.click(); } catch (e) { result.textContent = e.message; reload.disabled=false; } }; actions.append(node('p','context-boundary','Your draft is still here. Loading the latest version replaces these unsaved edits.'),reload);
      }
    }
  });
  return wrapper;
}
async function refresh(automatic = false) {
 if(automatic===true&&document.body.classList.contains('game-active'))return;
  // Let an active editor finish without moving focus or replacing their controls.
  if (automatic === true && (panelSession || drafts.size || $('board').contains(document.activeElement) || $('history').contains(document.activeElement))) return;
  if (saving.size || refreshing) return; $('error').hidden = true; refreshing = true; interactionLock();
  try { const r = await api('board'); const changed = JSON.stringify(data) !== JSON.stringify(r.result); data = r.result; boardLoaded = true; boardReadFailed = false; if (automatic !== true || changed) { render(); if(deskView==='system') loadSystem(); } else { scanStatus(); renderReviewDay(); } } catch (e) { boardReadFailed = true; error(e.message);
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
  try { await api('logout', {}); data = {cards: [], labels: [], run: null}; systemData=null; deskView='board'; $('historySearch').value=''; $('historyState').value='all'; $('historySince').value=''; $('systemContent').replaceChildren(); boardLoaded = false; boardReadFailed = false; renderReviewDay(); drafts.clear(); attempts.clear(); opened.clear(); $('toast').hidden = true; clearTimeout(toastTimer); clearTimeout(rewardTimer); $('reward').hidden = true; signedIn(false); const s = await api('session'); csrf = s.csrf; } catch (e) { error(e.message); }
};
function today() { const date = new Date(); $('today').dateTime = date.toLocaleDateString('en-CA', {timeZone: reviewZone}); $('today').textContent = date.toLocaleDateString([], {timeZone: reviewZone, month: 'long', day: 'numeric', year: 'numeric'}); }
today(); setInterval(today, 60000);
(async () => { try { const s = await api('session'); csrf = s.csrf; signedIn(s.authenticated); if (s.authenticated) await refresh(); else if(location.hash==='#login') { $('welcome').hidden=true; $('login').hidden=false; $('skipLink').href='#login'; $('password').focus(); } } catch (e) { error(e.message); } })();

// Guest workspace: isolated fictional day, styled like the authenticated board.
(() => {
  const examples = [
    {id: 'garden', sender: 'Maple Street volunteers', subject: 'Confirm your garden volunteer shift', description: 'The garden crew needs your yes or no for the morning planting shift.', category: 'action', label: 'Neighborhood', reason: 'The later supply update leaves the attendance question unanswered.', next: 'Decide whether to take the morning shift, then reply in your email app.'},
    {id: 'shelf', sender: 'Rowan at Corner Workshop', subject: 'The shelf plan needs your pick', description: 'Choose a finish so the workshop can start your bookshelf.', category: 'action', label: 'Home / Projects', reason: 'Work is on hold until you choose a finish.', next: 'Tell the agent how workshop requests should be sorted.'},
    {id: 'library', sender: 'Lantern Library', subject: 'The repair café is coming back', description: 'The library’s monthly repair café returns with volunteers offering household repairs.', category: 'awareness', label: 'Around town', reason: 'A local event that requires no RSVP.', next: 'Keep it on your radar, or dismiss it if it is not for you.'},
    {id: 'tools', sender: 'Small Tools Dispatch', subject: 'Window organizer', description: 'A window organizer with custom keyboard shortcuts.', category: 'awareness', label: 'Technology', reason: 'Software update. No reply needed.', next: 'Read when you have space. Dismiss when you have the gist.'}
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
  let state, timer = null, lastTick = 0, generation = 0, levelRewardUntil = 0;
  const pending = new Set();
  const timeLabel = time => new Intl.DateTimeFormat('en-US', {timeZone:reviewZone, hour:'numeric', minute:'2-digit'}).format(time).replace(':00', '');
  const focusHeading = id => { const heading = $(id); heading.tabIndex = -1; heading.focus({preventScroll:true}); };
  function stop() { clearInterval(timer); timer = null; }
  stopGuest = () => { stop(); clearTimeout(rewardTimer); $('reward').hidden = true; };
  function runClock() {
    stop(); lastTick = performance.now();
    timer = setInterval(() => {
      const tick = performance.now(), elapsed = Math.min(250, tick - lastTick); lastTick = tick;
      if (!guestActive || document.hidden || panelSession || !state.travelling) return;
      const arrived = advanceGuestDay(state, elapsed, batches); renderTime();
      if (arrived) arrive();
    }, 100);
  }
  function renderTime() {
    const runs = guestTimes.slice(0, state.stage + 1).map(time => ({finished_at:new Date(time).toISOString(), status:'success', details:{trigger:'scheduled',phase:'final',scheduled_at:new Date(time).toISOString()}}));
    const timing = reviewStatus(state.now, runs);
    $('demoReviewMeter').value = timing.fraction;
    $('demoReviewMeter').setAttribute('aria-valuetext', timeLabel(state.now) + ' simulated time. Checkpoints show published fictional reviews.');
    $('demoReviewNote').textContent = 'Demo time ' + timeLabel(state.now);
    document.querySelector('#guestDemo .review-day-label').textContent = 'Updated at ' + timeLabel(guestTimes[state.stage]) + (state.stage<2 ? ' · Next review ' + timeLabel(guestTimes[state.stage+1]) : ' · Day complete');
    $('demoSlots').replaceChildren(...timing.slots.map(slot => {
      const item = node('li', 'review-slot ' + slot.state), mark = node('span', 'slot-mark'); mark.setAttribute('aria-hidden','true');
      if (slot.state === 'updated') mark.append(icon('check'));
      item.append(mark, node('span','',timeLabel(slot.time)), node('span','slot-state',slot.state === 'updated' ? 'Updated' : slot.state === 'next' ? 'Next' : 'Later'));
      if (slot.state === 'next') item.setAttribute('aria-current','step');
      return item;
    }));
    $('skipDemo').hidden = state.stage >= 2;
    $('skipDemo').textContent = state.stage < 2 ? 'Skip to ' + timeLabel(guestTimes[state.stage + 1]) : 'Skip ahead';
    if (state.travelling) $('demoEmptyText').textContent = 'Moving to ' + timeLabel(guestTimes[state.stage + 1]) + '…';
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
    closeContextPanel(false);
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
    if (guestActive) $('navHistoryCount').textContent = history.length || '';
    $('demoHistory').hidden = !history.length; $('demoHistoryTitle').textContent = 'Done & not important · ' + history.length;
    $('demoHistoryCards').replaceChildren(...history.map(demoCard));
    $('demoEmpty').hidden = !clear; $('demoBoard').hidden = clear;
    if (clear && state.stage === 2) $('demoEmptyText').textContent = 'Day complete · ' + state.xp + ' XP · Level ' + (Math.floor(state.xp / 100) + 1) + '.';
  }
  function arrive() {
    renderDemo(); $('demoBoard').classList.remove('demo-arrival'); void $('demoBoard').offsetWidth; $('demoBoard').classList.add('demo-arrival');
    $('demoAnnouncement').textContent = '4 new cards.';
  }
  function reward(earned, levelUp) {
    if (!levelUp && performance.now() < levelRewardUntil) return;
    if (levelUp) levelRewardUntil = performance.now() + 4500;
    clearTimeout(rewardTimer);
    $('rewardArt').hidden = !levelUp;
  $('rewardTitle').hidden = !levelUp; $('rewardDetail').hidden = true;
  $('rewardTitle').textContent = levelUp ? 'LEVEL UP' : '';
    $('rewardValue').textContent = levelUp ? 'LEVEL ' + (Math.floor(state.xp / 100) + 1) : '+' + earned + ' XP';
    $('rewardDetail').textContent = levelUp ? '' : '';
    $('reward').hidden = false; $('reward').classList.remove('reward-enter'); void $('reward').offsetWidth; $('reward').classList.add('reward-enter');
    rewardTimer = setTimeout(() => { $('reward').hidden = true; }, levelUp ? 4500 : 1800);
    if (levelUp) { $('demoLevel').classList.remove('level-up'); void $('demoLevel').offsetWidth; $('demoLevel').classList.add('level-up'); }
  }
  function demoCard(c) {
    const article = node('article','card demo-card'), summary = node('div','card-summary'), meta = node('div','meta');
    meta.append(senderElement(c.sender));
    summary.append(meta, node('h3','',c.subject), node('p','description',c.description));
    const tags = node('div','tags'); for (const label of c.labels ?? [c.label]) tags.append(node('span','tag',label));
    if (c.state !== 'open') tags.append(node('span','tag state-tag',c.state === 'handled' ? 'Done' : 'Not important'));
    const context = node('div','card-context'); context.append(tags); summary.append(context); article.append(summary);
    const body = node('div','card-body'); body.id = 'demo-details-' + c.id; body.hidden = true;

    const form = node('form','feedback-form'); form.setAttribute('aria-label','Demo feedback for ' + c.subject);
    const fields = node('div','fields');
    const categoryInput = bucketField(fields,c.draftCategory || c.category,c.state !== 'handled',(c.draftDismiss ?? (c.state === 'dismissed')) === true);
    categoryInput.querySelector('legend').textContent = 'Attention';
    form.append(fields);
    const picker = node('details','label-picker'), pickerTitle = node('summary','','Change labels'), boxes = node('div','label-options');
    const chosenLabels = c.draftLabels ?? c.labels ?? [c.label];
    for (const value of [...new Set(batches.flat().map(item => item.label))]) {
      const label = node('label'), box = node('input'); box.type = 'checkbox'; box.value = value; box.checked = chosenLabels.includes(value);
      box.onchange = () => { c.draftLabels = [...boxes.querySelectorAll('input:checked')].map(input => input.value); };
      label.append(box,node('span','',value)); boxes.append(label);
    }
    picker.append(pickerTitle); labelChoices(picker,boxes); picker.append(boxes); form.append(picker);
    const readLabels = () => [...boxes.querySelectorAll('input:checked')].map(input => input.value);
    const label = node('label','field','Guidance'), note = node('textarea');
    note.rows = 3; note.maxLength = 500; note.value = c.draftNote ?? c.note; note.placeholder = 'What should I remember when sorting emails like this?'; label.append(note); form.insertBefore(label,picker);
    note.oninput = () => { c.draftNote = note.value; }; categoryInput.onchange = () => { c.draftCategory = categoryInput.value; c.draftDismiss = categoryInput.dismissed; };
    const result = node('p','save-result'), saveRow = node('div','save-row'), save = node('button','context-save','Save'); save.type = 'submit'; save.hidden=true; save.disabled=true;
    result.setAttribute('role','status'); saveRow.append(save,result); form.append(saveRow); body.append(form);
    async function decide(outcome) {
      if (pending.has(c.id)) return;
      pending.add(c.id); panelPending = true; const currentGeneration = generation;
      const controls = [...article.querySelectorAll('button,input,textarea'),...body.querySelectorAll('button,input,textarea'),$('closeContextPanel')]; controls.forEach(control => { control.disabled = true; });
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { article.classList.add('departing'); await new Promise(resolve => setTimeout(resolve,180)); }
      if (generation !== currentGeneration) { panelPending=false; $('closeContextPanel').disabled=false; return; }
      if (!guestActive) { panelPending=false; $('closeContextPanel').disabled=false; pending.delete(c.id); return; }
      c.note = note.value; c.category = categoryInput.value; c.labels = readLabels(); delete c.draftNote; delete c.draftCategory; delete c.draftLabels; delete c.draftDismiss; c.expanded = false;
      panelPending=false; closeContextPanel(false); $('closeContextPanel').disabled = false;
      const oldLevel = Math.floor(state.xp / 100), earned = resolveGuestCard(state,c.id,outcome);
      pending.delete(c.id); const levelUp = Math.floor(state.xp / 100) > oldLevel; renderDemo(); reward(earned,levelUp);
      $('demoAnnouncement').textContent = state.travelling ? 'Next review: ' + timeLabel(guestTimes[state.stage + 1]) : state.stage === 2 && !state.cards.some(x => x.state === 'open') ? 'Demo complete.' : (outcome === 'handled' ? 'Done' : 'Not important') + ' · +10 XP';
      if (levelUp) $('demoAnnouncement').textContent = 'Level ' + (Math.floor(state.xp / 100) + 1) + '! ' + $('demoAnnouncement').textContent;
      if (!state.cards.some(x => x.state === 'open')) {
        (state.travelling ? $('skipDemo') : $('resetDemo')).focus({preventScroll:true});
        $('guestDemo').scrollIntoView({block:'start', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
      } else focusHeading(c.category === 'action' ? 'demoActionTitle' : 'demoAwarenessTitle');
    }
    form.onsubmit = e => {
      e.preventDefault();
      if (categoryInput.dismissed && c.state === 'open') { decide('dismissed'); return; }
      c.note = note.value; c.category = categoryInput.value; c.labels = readLabels(); delete c.draftNote; delete c.draftCategory; delete c.draftLabels;
      contextChanged();
      tags.replaceChildren(...c.labels.map(value => node('span','tag',value)));
      if (c.state !== 'open') tags.append(node('span','tag state-tag',c.state === 'handled' ? 'Done' : 'Not important'));
      result.textContent = 'Saved for this demo.';
      // Keep history read-only for outcomes; editing context never awards XP.
      save.hidden=true; save.disabled=true;
      closeContextPanel(false); renderDemo(); focusHeading(c.category === 'action' ? 'demoActionTitle' : 'demoAwarenessTitle');
    };
    form.addEventListener('input',contextChanged); form.addEventListener('change',contextChanged);
    function contextChanged() {
      const dirty=(categoryInput.dismissed && c.state === 'open') || note.value !== c.note || categoryInput.value !== c.category || !same(readLabels(),c.labels ?? [c.label]);
      save.hidden=false; save.disabled=!dirty; save.textContent='Save'; result.textContent=dirty?'Unsaved changes':'';
    }
    article.dataset.category = c.category;
    const actions = node('div','quick-actions');
    if (c.state === 'open') for (const [outcome,caption] of [['handled','Done']]) {
      const button = node('button',outcome === 'handled' ? 'primary' : 'dismiss'); button.type = 'button';
      button.append(node('span','decision-caption',caption)); button.dataset.outcome=outcome;
      button.setAttribute('aria-label',caption + ': ' + c.subject); button.onclick = () => decide(outcome); actions.append(button);
    }
    const toggle = node('button','detail-toggle','Guidance'); toggle.type = 'button';
    toggle.setAttribute('aria-label','Guidance: ' + c.subject); toggle.setAttribute('aria-controls',body.id); toggle.setAttribute('aria-expanded',String(!body.hidden));
    toggle.onclick = () => { toggle.setAttribute('aria-expanded','true'); openContextPanel(body,c,toggle,article,()=>{c.expanded=false;toggle.setAttribute('aria-expanded','false');},true); };
    contextChanged();
    actions.insertBefore(toggle, actions.querySelector('.dismiss')); article.append(actions,body);
    return article;
  }
  function reset() {
    generation++; pending.clear(); state = createGuestDay(batches); levelRewardUntil = 0;
    clearTimeout(rewardTimer); $('reward').hidden = true; $('demoHistory').open = false;
    renderDemo(); $('demoAnnouncement').textContent = 'Give sorting guidance, then mark a card Done. You can skip to the next review.';
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
  $('skipDemo').onclick = () => { if (state.stage < 2) { state.travelling=true; advanceGuestDay(state,6000,batches); arrive(); focusHeading('demoActionTitle'); } };
  $('ownerLink').onclick = e => { e.preventDefault(); if (guestActive) leave(); $('welcome').hidden=true; $('login').hidden=false; $('skipLink').href='#login'; history.replaceState(null,'','#login'); window.scrollTo({top:0,behavior:'instant'}); $('password').focus({preventScroll:true}); };
  reset();
})();

function questTimeline(now,board){const status=reviewStatus(now,board.runs||[],board.report?.activated_at);const captions={inactive:'Before activation',updated:'Updated',failed:'Needs attention',reviewing:'Review ongoing',unknown:'Unconfirmed',due:'Review due',missed:'Not confirmed',next:'Next',later:'Later'};return {fraction:status.fraction,stops:status.slots.map(slot=>({...slot,label:new Intl.DateTimeFormat('en-US',{timeZone:reviewZone,hour:'numeric',minute:'2-digit'}).format(slot.time),caption:captions[slot.state]}))};}
function questHealth(board){const h=reviewHealth(board.run,board.report);return {tone:h.tone,text:h.title+(h.tone==='current'?'':' · Saved cards retained. Open System for review details.')};}
for(const id of ['startDemo','processDemo'])$(id).onclick=e=>{e.preventDefault();window.startQuest?.();};
