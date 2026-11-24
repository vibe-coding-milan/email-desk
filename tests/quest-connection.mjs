import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapCard,productionConnection} from '../frontend/connection.mjs';
import {availableXP,makeRound} from '../frontend/game.mjs';
const raw={id:'a',account:'milan@mijatovic.com',thread_id:'abcdef1234567890',message_ids:['abcdef1234567891'],state:'open',category:'action',labels:['Home','Work'],user_labels:null,description:'Summary',revision:1,note:'Saved guidance',date:'2026-11-23T12:00:00Z',attention_started_at:'2026-11-19T12:00:00Z'};
test('mapping preserves multiple labels, source account and original XP chronology',()=>{const c=mapCard(raw);assert.equal(c.label,'Home\nWork');assert.equal(c.rawAccount,raw.account);assert.equal(c.summary,'Summary');assert.match(c.emailUrl,/authuser=milan%40mijatovic.com/);assert.equal(availableXP(c,Date.parse(raw.date)),5);assert.equal(availableXP({...c,decisionXP:10}),0);});
test('finite round has at most five blocks and passes sort to end',()=>{const cards=Array.from({length:101},(_,i)=>mapCard({...raw,id:String(i),queue_order:i},i));cards[0].queueOrder=999;assert.deepEqual(makeRound(cards).ids,['1','2','3','4','5']);});
test('ambiguous save retry reuses operation; pass never requests archive; server owns XP',async()=>{
 const board={cards:[structuredClone(raw)],labels:['Home','Work'],quest:{schemaVersion:1,events:[]},progress:{xp:80}};let fail=true;const calls=[];
 const c=productionConnection({board,api:async(action,body)=>{calls.push(structuredClone(body));if(fail){fail=false;throw Error('network');}return {result:{operation_id:body.operation_id,card:{...raw,revision:2},xp_earned:0,quest:{schemaVersion:1,events:[]},progress:{xp:80},quest:{schemaVersion:1,events:[]}}};}});
 const card=c.state().cards[0],draft={label:card.label,note:card.note};await assert.rejects(()=>c.save(card,draft,{type:'pass'}));const r=await c.save(card,draft,{type:'pass'});assert.equal(calls[0].operation_id,calls[1].operation_id);assert.equal(calls[1].pass,true);assert.equal(calls[1].archive,undefined);assert.equal(calls[1].labels,null);assert.equal(r.xp,80);assert.equal(r.earned,0);
});
test('only explicit completion requests reviewed-message archive and exact label correction',async()=>{let payload;const c=productionConnection({board:{cards:[raw],labels:['Home','Work'],quest:{schemaVersion:1,events:[]},progress:{xp:0}},api:async(_,body)=>{payload=body;return{result:{card:{...raw,state:'handled',revision:2},progress:{xp:5},xp_earned:5,quest:{schemaVersion:1,events:[]}}};}});await c.save(c.state().cards[0],{note:'Keep this preference',label:'Home'},{type:'handled',mode:'classic'});assert.equal(payload.archive,true);assert.equal(payload.decision_mode,'classic');assert.deepEqual(payload.labels,['Home']);assert.equal(payload.note,'Keep this preference');assert.equal(payload.message_ids,undefined);});

test('mixed-version release cannot silently save through an older backend',async()=>{let calls=0;const c=productionConnection({board:{cards:[raw],labels:['Home'],progress:{xp:0}},api:async()=>{calls++;}});await assert.rejects(()=>c.save(c.state().cards[0],{note:'Draft',label:'Home'},{type:'handled'}),/update in progress/);assert.equal(calls,0);});

test('category-only move remains open, preserves Guidance and labels, and earns no XP or archive',async()=>{
 let durable={...raw},payload;let xp=80;
 const api=async(action,body)=>{if(action==='board')return {result:{cards:[durable],labels:['Home','Work'],progress:{xp},quest:{schemaVersion:1,events:[]}}};payload=structuredClone(body);durable={...durable,state:body.state,user_category:body.category,note:body.note,user_labels:body.labels,revision:durable.revision+1};return {result:{card:durable,progress:{xp},xp_earned:0,quest:{schemaVersion:1,events:[]}}};};
 const c=productionConnection({board:{cards:[durable],labels:['Home','Work'],progress:{xp},quest:{schemaVersion:1,events:[]}},api});
 const result=await c.save(c.state().cards[0],{note:'Preserve this context',label:'Home\nWork'},{category:'awareness'});
 assert.equal(payload.state,'open');assert.equal(payload.category,'awareness');assert.equal(payload.archive,undefined);assert.equal(payload.pass,undefined);assert.equal(result.earned,0);assert.equal(result.xp,80);
 const restored=await c.reload();assert.equal(restored.cards[0].state,'open');assert.equal(restored.cards[0].category,'awareness');assert.equal(restored.cards[0].note,'Preserve this context');assert.equal(restored.cards[0].label,'Home\nWork');
 await c.save(restored.cards[0],{note:restored.cards[0].note,label:restored.cards[0].label},{category:'action',mode:'classic'});assert.equal(payload.category,'action');assert.equal(payload.state,'open');assert.equal(payload.archive,undefined);
});
test('explicit completion and pass can carry a staged category without a separate move',async()=>{
 for(const type of ['handled','dismissed','pass']){let payload;const c=productionConnection({board:{cards:[raw],labels:['Home','Work'],progress:{xp:0},quest:{schemaVersion:1,events:[]}},api:async(_,body)=>{payload=body;return {result:{card:{...raw,revision:2,state:body.state,user_category:body.category,note:body.note},progress:{xp:0},xp_earned:0,quest:{schemaVersion:1,events:[]}}};}});
 await c.save(c.state().cards[0],{note:'Staged guidance',label:'Home\nWork'},{type,category:'awareness'});assert.equal(payload.category,'awareness');assert.equal(payload.note,'Staged guidance');assert.equal(payload.state,type==='pass'?'open':type);assert.equal(payload.archive,type==='pass'?undefined:true);
 }
});
