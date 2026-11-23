export function friendlySender(sender) {
  const raw = String(sender ?? '').trim();
  const mailbox = raw.match(/^(.*?)\s*<[^<>\s@]+@[^<>\s@]+>$/);
  if (!mailbox) return raw;
  let name = mailbox[1].trim();
  if (/^"(?:[^"\\]|\\.)*"$/.test(name)) name = name.slice(1,-1).replace(/\\(["\\])/g,'$1').trim();
  else if (/["<>@]/.test(name)) return raw;
  return name || raw.slice(1,-1);
}
// Production boundary: no fictional fields reach PHP; server owns awards/events.
export function mapCard(c,index=0){
 const labels=c.user_labels??c.labels??[];
 const account=c.account==='mijatovic@gmail.com'?'Personal':'Workspace';
 return {...c,sender:friendlySender(c.sender),fullSender:c.sender,account,rawAccount:c.account,summary:c.description,category:c.user_category??c.category,label:labels.join('\n'),queueOrder:c.queue_order??index,decisionXP:c.decision_earned_at?(c.decision_xp??10):null,decidedAt:c.decision_earned_at??c.updated_at,date:c.date,xpDate:c.attention_started_at??c.reopened_at??c.date,emailUrl:'https://mail.google.com/mail/u/?authuser='+encodeURIComponent(c.account)+'#all/'+encodeURIComponent(c.thread_id)};
}
export function productionConnection({api,board,timeline,health,onExit,onSystem,initialView,focusCard}){
 let saved=board;const attempts=new Map();
 const state=()=>({cards:saved.cards.map(mapCard),quest:saved.quest??{schemaVersion:1,events:[],celebrations:true},xp:saved.progress.xp});
 async function request(action,payload){
  const signature=JSON.stringify([action,payload]);let body=attempts.get(signature);
  if(!body){body={operation_id:crypto.randomUUID(),...payload};attempts.set(signature,body);}
  const response=(await api(action,body)).result;attempts.delete(signature);return response;
 }
 return {state,labels:board.labels,onExit,onSystem,initialView,focusCard,
  schedule:now=>timeline(now,saved),health:()=>health(saved),
  async reload(){saved=(await api('board')).result;return state();},
  async preference(celebrations){const r=await request('quest_preference',{celebrations});saved.quest=r.quest;return state();},
  async undo(target,card){const r=await request('undo_decision',{target_id:target,revision:card.revision});saved.cards=saved.cards.map(c=>c.id===r.card.id?r.card:c);saved.quest=r.quest;saved.progress=r.progress;return state();},
  async save(card,draft,{type=null,category=card.category,mode='round'}={}){
   const labels=draft.label?draft.label.split('\n'):[];
   const raw=saved.cards.find(c=>c.id===card.id);
   const changed=JSON.stringify([...labels].sort())!==JSON.stringify([...(raw.user_labels??raw.labels)].sort());
   const payload={card_id:card.id,revision:card.revision,state:type&&type!=='pass'?type:card.state,category,note:draft.note,labels:changed?labels:raw.user_labels,decision_mode:mode,...(type==='pass'?{pass:true}:{}),...(['handled','dismissed'].includes(type)?{archive:true}:{})};
   const r=await request('feedback',payload);
   // request identity is returned by PHP to associate immediate Undo.
   saved.cards=saved.cards.map(c=>c.id===r.card.id?r.card:c);saved.quest=r.quest;saved.progress=r.progress;
   return {...state(),earned:r.xp_earned,operationId:r.operation_id};
  }
 };
}
