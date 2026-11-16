import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8').split('// End schedule helpers.')[0];
const context = vm.createContext({Intl, Date});
vm.runInContext(source, context);
const day = (now, runs=[]) => JSON.parse(JSON.stringify(context.reviewDay(Date.parse(now), runs)));
const run = (finished_at,status='success') => ({finished_at,status});
const states = slots => slots.map(s=>s.state);
let slots = day('2026-11-16T20:00:00Z', [run('2026-11-16T14:10:00Z'), run('2026-11-16T18:15:00Z','partial')]);
assert.deepEqual(states(slots), ['updated','partial','next']);
assert.deepEqual(slots.map(s=>new Date(s.time).toISOString()), ['2026-11-16T14:00:00.000Z','2026-11-16T18:00:00.000Z','2026-11-16T22:30:00.000Z']);
// Never invent a completed morning review from an afternoon result.
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z')])),['late','updated','next']);
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z','error')])),['late','failed','next']);
// Newest outcome wins within its own slot; input order is irrelevant.
assert.deepEqual(states(day('2026-11-16T20:00:00Z',[run('2026-11-16T18:15:00Z','error'),run('2026-11-16T18:20:00Z')])),['late','updated','next']);
assert.deepEqual(states(day('2026-11-16T13:00:00Z')),['next','later','later']);
assert.deepEqual(states(day('2026-11-16T23:00:00Z',[run('2026-11-16T22:40:00Z')])),['late','late','updated']);
// Weekend omits midday. Previous days/future/invalid results cannot fill today's slots.
assert.deepEqual(states(day('2026-11-21T17:00:00Z',[run('2026-11-21T14:05:00Z')])),['updated','next']);
assert.deepEqual(states(day('2026-11-23T05:30:00Z',[run('2026-11-22T22:35:00Z'),run('invalid'),run('2026-11-23T14:05:00Z')])),['next','later','later']);
// New York wall time across both DST boundaries, independent of browser timezone.
assert.equal(new Date(day('2027-03-14T06:30:00Z')[0].time).toISOString(),'2027-03-14T13:00:00.000Z');
assert.equal(new Date(day('2026-11-01T05:30:00Z')[0].time).toISOString(),'2026-11-01T14:00:00.000Z');
assert.deepEqual(states(day('2026-11-16T18:00:00Z')),['late','due','next']);
console.log('Daily review checkpoints: actual outcomes, missing/failed/partial reviews, remaining slots, weekends, rollover and DST passed.');

const status = (stamp, runs=[]) => JSON.parse(JSON.stringify(context.reviewStatus(Date.parse(stamp),runs)));
let a = status('2026-11-16T19:00:00Z');
let b = status('2026-11-16T20:00:00Z');
assert(a.fraction < b.fraction && a.fraction > 0 && b.fraction < 1, 'time advances toward next review');
assert.equal(status('2026-11-16T18:10:00Z').slots[1].state,'due');
assert.equal(status('2026-11-16T18:16:00Z').slots[1].state,'late');
assert.equal(status('2026-11-16T13:00:00Z').phase,'scheduled');
assert.equal(status('2026-11-16T22:35:00Z').phase,'due');
assert.equal(status('2026-11-16T23:00:00Z').phase,'late');
const all = [run('2026-11-16T14:10:00Z'),run('2026-11-16T18:10:00Z'),run('2026-11-16T22:40:00Z')];
assert.equal(status('2026-11-16T23:00:00Z',all).phase,'complete');
assert.equal(status('2026-11-16T23:00:00Z',all).fraction,1);
assert.equal(new Date(status('2026-11-16T23:00:00Z',all).next).toISOString(),'2026-11-17T14:00:00.000Z');
all[1].status='partial';assert.equal(status('2026-11-16T23:00:00Z',all).phase,'incomplete');
assert.equal(status('2026-11-16T23:00:00Z',[run('2026-11-16T22:40:00Z','error')]).phase,'incomplete');
console.log('Analog progress, due/late grace, first-day timing, completion and incomplete-day boundaries passed.');
