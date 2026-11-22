import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').split('// End schedule helpers.')[0];
const context = vm.createContext({Intl, Date});
vm.runInContext(source, context);
const day = (now, runs=[]) => JSON.parse(JSON.stringify(context.reviewDay(Date.parse(now), runs)));
const run = (finished_at,status='success') => ({finished_at,status,details:{trigger:'scheduled',phase:'final',scheduled_at: !Number.isFinite(Date.parse(finished_at)) ? null : new Date(Math.max(...context.reviewSlots(new Date(finished_at)).filter(t=>t<=Date.parse(finished_at)))).toISOString()}});
const states = slots => slots.map(s=>s.state);
let slots = day('2026-11-16T20:00:00Z', [run('2026-11-16T14:10:00Z'), run('2026-11-16T18:15:00Z','partial')]);
assert.deepEqual(states(slots), ['updated','unknown','next']);
assert.deepEqual(slots.map(s=>new Date(s.time).toISOString()), ['2026-11-16T14:00:00.000Z','2026-11-16T18:00:00.000Z','2026-11-16T22:30:00.000Z']);
// Never invent a completed morning review from an afternoon result.
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z')])),['missed','updated','next']);
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z','error')])),['missed','failed','next']);
// Newest outcome wins within its own slot; input order is irrelevant.
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z','error'),run('2026-11-16T18:20:00Z')])),['missed','updated','next']);
assert.deepEqual(states(day('2026-11-16T13:00:00Z')),['next','later','later']);
assert.deepEqual(states(day('2026-11-16T23:00:00Z',[run('2026-11-16T22:40:00Z')])),['missed','missed','updated']);
// Weekend omits midday. Previous days/future/invalid results cannot fill today's slots.
assert.deepEqual(states(day('2026-11-21T17:00:00Z',[run('2026-11-21T14:05:00Z')])),['updated','next']);
assert.deepEqual(states(day('2026-11-23T05:30:00Z',[run('2026-11-22T22:35:00Z'),run('invalid'),run('2026-11-23T14:05:00Z')])),['next','later','later']);
// New York wall time across both DST boundaries, independent of browser timezone.
assert.equal(new Date(day('2027-03-14T06:30:00Z')[0].time).toISOString(),'2027-03-14T13:00:00.000Z');
assert.equal(new Date(day('2026-11-01T05:30:00Z')[0].time).toISOString(),'2026-11-01T14:00:00.000Z');
assert.deepEqual(states(day('2026-11-16T18:00:00Z')),['missed','due','next']);
console.log('Daily review checkpoints: actual outcomes, missing/failed/partial reviews, remaining slots, weekends, rollover and DST passed.');

const status = (stamp, runs=[]) => JSON.parse(JSON.stringify(context.reviewStatus(Date.parse(stamp),runs)));
let a = status('2026-11-16T19:00:00Z');
let b = status('2026-11-16T20:00:00Z');
assert(a.fraction < b.fraction && a.fraction > 0 && b.fraction < 1, 'time advances toward next review');
assert.equal(status('2026-11-16T18:10:00Z').slots[1].state,'due');
assert.equal(status('2026-11-16T18:16:00Z').slots[1].state,'missed');
assert.equal(status('2026-11-16T13:00:00Z').phase,'scheduled');
assert.equal(status('2026-11-16T22:35:00Z').phase,'due');
assert.equal(status('2026-11-16T23:00:00Z').phase,'missed');
const all = [run('2026-11-16T14:10:00Z'),run('2026-11-16T18:10:00Z'),run('2026-11-16T22:40:00Z')];
assert.equal(status('2026-11-16T23:00:00Z',all).phase,'complete');
assert.equal(status('2026-11-16T23:00:00Z',all).fraction,1);
assert.equal(new Date(status('2026-11-16T23:00:00Z',all).next).toISOString(),'2026-11-17T14:00:00.000Z');
all[1].status='partial';assert.equal(status('2026-11-16T23:00:00Z',all).phase,'incomplete');
assert.equal(status('2026-11-16T23:00:00Z',[run('2026-11-16T22:40:00Z','error')]).phase,'incomplete');
console.log('Route progress, due/missed grace, first-day timing, completion and incomplete-day boundaries passed.');

assert.equal(status('2026-11-16T13:00:00Z').fraction,0);
assert.equal(status('2026-11-16T14:00:00Z').fraction,0);
assert.equal(status('2026-11-16T22:30:00Z').fraction,1);
assert.equal(status('2026-11-16T18:00:00Z').fraction,0.5);
assert.deepEqual(states(day('2026-11-17T02:30:00Z',[run('2026-11-16T17:32:46Z'),run('2026-11-17T02:20:44Z')])),['updated','missed','updated']);
console.log('Daily route endpoints, midpoint and recovered evening publication passed.');

const manual={finished_at:'2026-11-16T18:15:00Z',status:'success',details:{trigger:'manual',phase:'final',scheduled_at:null}};
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[manual])),['missed','missed','next']);
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[{finished_at:'2026-11-16T18:15:00Z',status:'success'}])),['missed','unknown','next']);
const recovered={...run('2026-11-16T18:15:00Z'),details:{trigger:'scheduled',phase:'final',scheduled_at:'2026-11-16T14:00:00Z'}};
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[recovered])),['updated','missed','next']);
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[{...recovered,details:{...recovered.details,phase:'batch'}}])),['missed','missed','next']);
const health=(r,p)=>JSON.parse(JSON.stringify(context.reviewHealth(r,p,Date.parse('2026-11-21T17:00:00Z'))));
const report={accounts:[{recent_through:'2026-11-21T16:00:00Z',historical_complete:false},{recent_through:'2026-11-21T16:00:00Z',historical_complete:false}]};
assert.equal(health({status:'partial'},report).tone,'current');
assert.equal(health({status:'error'},report).tone,'error');
assert.equal(health(null,null).tone,'unknown');
assert.equal(health({coverage:{personal:'partial'}},report).tone,'unknown');
assert.equal(health(null,{accounts:[{recent_through:'2026-11-18T00:00:00Z'},{}]}).tone,'unknown');
console.log('Explicit slot identity, manual/legacy exclusion, delayed recovery and typed health states passed.');

assert.equal(context.reviewDay(Date.parse('2026-11-21T17:00:00Z'), [], '2026-11-21T16:24:53Z')[0].state,'inactive');

// Historical catch-up never downgrades a verified recent scheduled review.
const completeCoverage={'mijatovic@gmail.com':'complete','milan@mijatovic.com':'complete'};
const catchingUp={...run('2026-11-21T14:15:39Z','partial'),coverage:completeCoverage};
assert.deepEqual(states(day('2026-11-21T17:00:00Z',[catchingUp])),['updated','next']);
assert.equal(context.reviewOutcome(catchingUp).label,'Updated');
assert.equal(context.reviewOutcome(catchingUp).olderOngoing,true);
assert.match(context.reviewSummary(catchingUp),/Review of older mail is ongoing/);
assert.doesNotMatch(context.reviewSummary(catchingUp),/incomplete|failed|partial/i);
const stillReviewing={...catchingUp,coverage:{...completeCoverage,'mijatovic@gmail.com':'partial'}};
assert.equal(context.reviewOutcome(stillReviewing).state,'reviewing');
assert.equal(context.reviewOutcome(stillReviewing).label,'Review ongoing');
assert.equal(context.reviewOutcome({...catchingUp,coverage:{...completeCoverage,'mijatovic@gmail.com':'error'}}).state,'failed');
assert.equal(context.reviewOutcome({...catchingUp,coverage:{'mijatovic@gmail.com':'complete'}}).state,'unknown');
assert.equal(context.reviewOutcome({...catchingUp,details:{...catchingUp.details,phase:'batch'}}).state,'reviewing');
assert.equal(context.coverageLabel('partial'),'Review ongoing');
console.log('Recent completion, ongoing historical/recent work, errors and unconfirmed coverage have distinct presentation.');
