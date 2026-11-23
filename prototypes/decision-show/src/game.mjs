export const fixtures = [
  ['shelf','Rowan at Corner Workshop','The shelf plan needs your pick','Choose a finish so the workshop can start your bookshelf.','Personal','Home/Renovation','We have the oak and walnut samples ready. Which finish would you like for your bookshelf? Reply with your choice and we can get started.'],
  ['poster','Studio Finch','Approve the poster proof','The designer needs your approval before printing the workshop poster.','Workspace','Vibe Coding & App Projects','The revised workshop poster proof is ready. Please review the title and event details, then reply with approval or any changes.'],
  ['garden','Maple Street volunteers','Confirm your garden volunteer shift','The crew needs your yes or no for Saturday’s planting shift.','Personal','Personal Correspondence','Can you join the Saturday morning planting shift? A yes or no will help us plan the crew. Thank you!'],
  ['meeting','Harbor Neighbors','Confirm committee attendance','A quick confirmation will help the team finalize next week’s agenda.','Workspace','Manhattan Community Board 5','Will you be attending next week’s committee meeting? Please reply so we can finalize the agenda.'],
  ['delivery','Corner Workshop','Choose a delivery window','Pick a morning or afternoon delivery window for your bookshelf.','Personal','Home/Renovation','Your bookshelf will be ready next week. Would a morning or afternoon delivery work better? Please reply with your preferred window.'],
  ['library','Lantern Library','The repair café is coming back','Volunteers will be offering household repairs at the library next month.','Personal','Education','Our monthly repair café returns next month. Drop in with a small household item; no booking is needed.'],
  ['receipt','Paper & Thread','Your supplies receipt','Payment is complete. Your notebook and binding supplies receipt is ready.','Personal','Records/Receipts & Statements','Thank you for your purchase. This is your receipt for notebooks and binding supplies. Your payment is complete.']
];
export const DEMO_NOW = Date.parse('2026-11-23T16:20:00Z');
export function initialCards() {
 const open=fixtures.map(([id,sender,subject,summary,account,label,body],i)=>({id,sender,subject,summary,account,label,body,category:i<5?'action':'awareness',state:'open',note:'',queueOrder:i,inInbox:true,date:new Date(DEMO_NOW-(i===1?72:4+i)*3600000).toISOString(),decisionXP:null,decidedAt:null}));
 const history=Array.from({length:8},(_,i)=>({id:'past-'+i,sender:['Lantern Library','Studio Finch','Harbor Neighbors'][i%3],subject:['Confirmed the workshop details','Reviewed the meeting agenda','Kept the library update'][i%3],summary:'A previously completed fictional item.',account:i%2?'Workspace':'Personal',label:'Personal Correspondence',body:'A fictional completed conversation.',category:i%3?'action':'awareness',state:'handled',note:'',queueOrder:-1,inInbox:true,date:new Date(DEMO_NOW-(8-i)*86400000-3600000).toISOString(),decisionXP:10,decidedAt:new Date(DEMO_NOW-(8-i)*86400000).toISOString()}));
 return [...history,...open];
}
export function makeRound(cards,category='action') {
 return {ids:cards.filter(c=>c.category===category&&c.state==='open').sort((a,b)=>a.queueOrder-b.queueOrder).slice(0,5).map(c=>c.id),index:0,outcomes:[],category};
}
export function availableXP(card,now=DEMO_NOW) {
 if(card.decisionXP!==null)return 0;
 return now-Date.parse(card.date)>48*3600000?5:10;
}
export function resolveCard(cards,id,type,now=DEMO_NOW) {
 if(!['handled','dismissed','pass'].includes(type))throw Error('Unknown decision');
 const card=cards.find(c=>c.id===id);
 if(!card||card.state!=='open')return {cards,earned:0};
 const earned=type==='pass'?0:availableXP(card,now);
 return {earned,cards:cards.map(c=>c.id!==id?c:{...c,state:type==='pass'?'open':type,inInbox:type==='dismissed'?false:c.inInbox,queueOrder:type==='pass'?Math.max(...cards.map(x=>x.queueOrder))+1:c.queueOrder,decisionXP:type==='pass'?c.decisionXP:c.decisionXP??earned,decidedAt:type==='pass'?c.decidedAt:new Date(now).toISOString()})};
}
export function totalXP(cards){return cards.reduce((sum,c)=>sum+(c.decisionXP??0),0);}
export function archiveGroups(cards){
 const groups=new Map();
 for(const c of cards.filter(c=>c.state!=='open').sort((a,b)=>Date.parse(b.decidedAt)-Date.parse(a.decidedAt))){
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(c.decidedAt));
  if(!groups.has(day))groups.set(day,[]);groups.get(day).push(c);
 }
 return [...groups];
}
export function reviewSchedule(now=DEMO_NOW){
 const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(now);
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const minutes=Number(parts.find(x=>x.type==='hour').value)*60+Number(parts.find(x=>x.type==='minute').value);
 const times=[{minute:540,label:'9 AM'},...(!['Sat','Sun'].includes(weekday)?[{minute:780,label:'1 PM'}]:[]),{minute:1050,label:'5:30 PM'}];
 const next=times.findIndex(t=>t.minute>minutes);
 const stops=times.map((t,i)=>({...t,state:t.minute<=minutes?'updated':i===next?'next':'later'}));
 const last=next<0?times.length-1:Math.max(0,next-1);
 const fraction=minutes<=540?0:next<0?1:(last+(minutes-times[last].minute)/(times[next].minute-times[last].minute))/(times.length-1);
 return {stops,fraction,weekend:['Sat','Sun'].includes(weekday)};
}
