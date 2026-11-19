import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const helper = 'function cardTiming' + source.split('function cardTiming')[1].split('// End card timing helpers.')[0];
const context = vm.createContext({Date}); vm.runInContext(helper, context);
const start = Date.parse('2026-10-31T16:00:00Z');
const card = {date:new Date(start).toISOString(), state:'open'};
const timing = (hours, c=card) => context.cardTiming(c, start + hours * 3600000);
assert.match(timing(0).text,/48h left/);
assert.equal(timing(24).tone,'soon');
assert.match(timing(24).text,/1 day ago/);
assert.equal(timing(48).late,false);
assert.equal(timing(48 + 1/3600).late,true);
assert.match(timing(72).text,/Received 3 days ago.*5 XP/);
assert.equal(timing(72, {...card, user_category:'awareness'}).late,true,'Moving columns cannot reset the clock');
assert.equal(timing(72, {...card, date:new Date(start+72*3600000).toISOString(), attention_started_at:card.date}).late,true,'Summary updates retain original window');
assert.equal(timing(72, {...card, reopened_at:new Date(start+71*3600000).toISOString()}).late,false);
assert.match(timing(72, {...card, reopened_at:new Date(start+71*3600000).toISOString()}).text,/New request open for 1 hour/);
assert.equal(timing(-1).late,false);
assert.equal(timing(1, {...card,date:'invalid'}).tone,'unknown');
assert.match(timing(72, {...card,state:'handled',decision_earned_at:new Date(start+49*3600000).toISOString(),decision_xp:5}).text,/First decision after 2 days · 5 XP/);
assert.match(timing(200, {...card,state:'dismissed',decision_earned_at:new Date(start+1*3600000).toISOString()}).text,/1 hour · 10 XP/);
console.log('Card age, elapsed 48-hour boundary across DST, category/summary preservation, reopening and frozen history awards passed.');

assert.match(timing(72, {...card,decision_earned_at:card.date}).text,/XP already earned/);

const senderHelper = 'function senderName' + source.split('function senderName')[1].split('function senderElement')[0];
vm.runInContext(senderHelper, context);
for (const [raw, expected] of [
  ['"Cedar Workshop Inc." <hello@cedar.example>', 'Cedar Workshop Inc.'],
  ['Kiran, Committee', 'Kiran, Committee'],
  ['Alex Rivera <alex@example.test>', 'Alex Rivera'],
  ['hello@example.test', 'hello@example.test'],
  ['<hello@example.test>', 'hello@example.test'],
  ['"Alex \\"AJ\\" Rivera" <alex@example.test>', 'Alex "AJ" Rivera'],
  ['"A" <a@example.test>, "B" <b@example.test>', '"A" <a@example.test>, "B" <b@example.test>'],
]) assert.equal(context.senderName(raw), expected);
console.log('Sender display names, escaped quotes, bare addresses and ambiguous lists passed.');
