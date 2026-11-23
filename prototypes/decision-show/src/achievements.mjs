// Versioned, content-free events. Production must append these in the same
// authenticated server transaction as the confirmed card decision.
export const ACHIEVEMENT_SCHEMA = 1;
export const achievementDefinitions = Object.freeze([
 {id:'first-move',ruleVersion:1,title:'First move',description:'Handle your first Needs action item.',target:1,icon:'first'},
 {id:'loose-end',ruleVersion:1,title:'Loose end tied',description:'Return to a passed action item and handle it.',target:1,icon:'return'},
 {id:'five-forward',ruleVersion:1,title:'Five forward',description:'Handle five different Needs action items.',target:5,icon:'five'},
 {id:'steady-progress',ruleVersion:1,title:'Steady progress',description:'Handle action items on three separate days. No streak required.',target:3,icon:'days'}
]);
export function emptyAchievementLedger(){return {schemaVersion:ACHIEVEMENT_SCHEMA,events:[]};}
function dayKey(at){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));}
function normalizedEvent(input){
 if(!input||typeof input!=='object'||!['decision','undo'].includes(input.type))throw Error('Invalid achievement event');
 const fields=input.type==='decision'?['id','type','at','cardId','category','outcome','mode']:['id','type','at','targetId'];
 if(Object.keys(input).some(key=>!fields.includes(key)))throw Error('Unexpected achievement event field');
 for(const key of ['id','at'])if(typeof input[key]!=='string'||!input[key].trim()||input[key].length>160)throw Error('Invalid achievement event '+key);
 if(!Number.isFinite(Date.parse(input.at)))throw Error('Invalid achievement event time');
 const common={id:input.id,type:input.type,at:new Date(input.at).toISOString()};
 if(input.type==='undo'){
  if(typeof input.targetId!=='string'||!input.targetId.trim()||input.targetId.length>160)throw Error('Invalid undo target');
  return {...common,targetId:input.targetId};
 }
 if(typeof input.cardId!=='string'||!input.cardId.trim()||input.cardId.length>160)throw Error('Invalid card identity');
 if(!['action','awareness'].includes(input.category)||!['handled','dismissed','pass'].includes(input.outcome)||!['round','classic'].includes(input.mode))throw Error('Invalid achievement decision');
 return {...common,cardId:input.cardId,category:input.category,outcome:input.outcome,mode:input.mode};
}
function activeDecisions(ledger){
 const undone=new Set(ledger.events.filter(event=>event.type==='undo').map(event=>event.targetId));
 return ledger.events.filter(event=>event.type==='decision'&&!undone.has(event.id));
}
export function appendAchievementEvent(ledger,input){
 if(ledger?.schemaVersion!==ACHIEVEMENT_SCHEMA||!Array.isArray(ledger.events))throw Error('Unsupported achievement schema');
 const event=normalizedEvent(input),existing=ledger.events.find(item=>item.id===event.id);
 if(existing){if(JSON.stringify(existing)!==JSON.stringify(event))throw Error('Conflicting achievement event identity');return ledger;}
 if(event.type==='undo'){
  const last=activeDecisions(ledger).at(-1);
  if(!last||last.id!==event.targetId)throw Error('Only the latest active decision can be undone');
 }else{
  // A settled card cannot be counted again under a different request ID.
  const settled=activeDecisions(ledger).some(item=>item.cardId===event.cardId&&item.outcome!=='pass');
  if(settled)throw Error('Card already settled in achievement ledger');
 }
 return {...ledger,events:[...ledger.events,event]};
}
export function projectAchievements(ledger){
 if(ledger?.schemaVersion!==ACHIEVEMENT_SCHEMA||!Array.isArray(ledger.events))throw Error('Unsupported achievement schema');
 const passed=new Set(),handled=new Set(),days=new Set(),progress={},unlocks={};
 function update(id,value,event){progress[id]=value;const definition=achievementDefinitions.find(definition=>definition.id===id);if(value>=definition.target&&!unlocks[id])unlocks[id]={at:event.at,eventId:event.id,ruleVersion:definition.ruleVersion};}
 for(const event of activeDecisions(ledger)){
  if(event.category!=='action')continue;
  if(event.outcome==='pass'){passed.add(event.cardId);continue;}
  if(event.outcome!=='handled'||handled.has(event.cardId))continue;
  handled.add(event.cardId);days.add(dayKey(event.at));
  update('first-move',1,event);update('five-forward',handled.size,event);update('steady-progress',days.size,event);
  if(passed.has(event.cardId))update('loose-end',1,event);
 }
 return achievementDefinitions.map(definition=>({...definition,progress:Math.min(progress[definition.id]||0,definition.target),unlocked:Boolean(unlocks[definition.id]),unlockedAt:unlocks[definition.id]?.at??null,unlockEventId:unlocks[definition.id]?.eventId??null}));
}
export function newlyUnlocked(before,after){const existing=new Set(projectAchievements(before).filter(badge=>badge.unlocked).map(badge=>badge.id));return projectAchievements(after).filter(badge=>badge.unlocked&&!existing.has(badge.id));}
