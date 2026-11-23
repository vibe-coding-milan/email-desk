import {useEffect,useId,useRef,useState} from 'react';
import {AnimatePresence,motion,MotionConfig,useReducedMotion} from 'motion/react';
import confetti from 'canvas-confetti';
import {Archive,ArrowCounterClockwise,ArrowSquareOut,ArrowDown,ArrowRight,Check,CaretDown,CaretRight,ListBullets,Sparkle,XCircle,GameController,Tag,Trophy,CalendarBlank} from '@phosphor-icons/react';
import {emptyAchievementLedger,appendAchievementEvent,projectAchievements,newlyUnlocked} from './achievements.mjs';
import {fixtures,DEMO_NOW,initialCards,makeRound,availableXP,resolveCard,totalXP,archiveGroups,reviewSchedule} from './game.mjs';
const clone=value=>structuredClone(value);
const categoryName=value=>value==='action'?'Needs action':'Worth knowing';
const formatDate=value=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric'}).format(new Date(value));
const topicLabels=[...new Set(fixtures.map(row=>row[5]))];

function Progress({xp,now,onAchievements,achievementCount,disabled}){
 const level=Math.floor(xp/100)+1,within=xp%100,schedule=reviewSchedule(now);
 return <section className="desk-status" aria-label="Progress and today’s reviews">
  <div className="review-timeline"><div className="status-caption"><span>Today’s reviews</span><span>{new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit'}).format(now)} · New York</span></div>
   <div className="review-track"><div className="track-line"/><motion.div className="track-filled" animate={{width:`${schedule.fraction*100}%`}}/><motion.img src="assets/robot-host.png" alt="" className="route-robot" animate={{left:`${schedule.fraction*100}%`}}/>{schedule.stops.map((stop,i)=><div className={'review-stop '+stop.state} style={{left:`${i/(schedule.stops.length-1)*100}%`}} key={stop.label}><span className="review-dot">{stop.state==='updated'&&<Check size={11} weight="bold"/>}</span><strong>{stop.label}</strong><small>{stop.state==='updated'?'Updated':stop.state==='next'?'Next':'Later'}</small></div>)}</div>
  </div>
  <div className="level-progress"><div className="status-caption"><strong>Level {String(level).padStart(2,'0')}</strong><span>{within} / 100 XP</span></div><div className="level-track" role="progressbar" aria-label="Progress to next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={within}><motion.div key={level} initial={{width:0}} animate={{width:`${within}%`}} transition={{type:'spring',stiffness:110,damping:22}}/></div><div className="level-footer"><small>{100-within} XP to level {level+1}</small><button className="achievement-link" disabled={disabled} onClick={onAchievements}><Trophy size={14}/><span>Achievements</span><span className="achievement-count">{achievementCount}/4</span></button></div></div>
 </section>;
}

function LabelPicker({value,onChange,disabled}){
 const [open,setOpen]=useState(false),[index,setIndex]=useState(0),[above,setAbove]=useState(false);
 const root=useRef(null),trigger=useRef(null),options=useRef([]),id=useId();
 const labels=[...new Set([...topicLabels,value])];
 const close=()=>{setOpen(false);trigger.current?.focus({preventScroll:true});};
 function show(){if(disabled)return;const box=trigger.current.getBoundingClientRect();setAbove(innerHeight-box.bottom<(innerWidth<=700?330:210));setIndex(Math.max(0,labels.indexOf(value)));setOpen(true);}
 useEffect(()=>{if(!open)return;const option=options.current[index];option?.focus({preventScroll:true});const menu=option?.parentElement;if(menu&&option){if(option.offsetTop<menu.scrollTop)menu.scrollTop=option.offsetTop;else if(option.offsetTop+option.offsetHeight>menu.scrollTop+menu.clientHeight)menu.scrollTop=option.offsetTop+option.offsetHeight-menu.clientHeight;}},[open,index]);
 useEffect(()=>{if(!open)return;const outside=e=>{if(!root.current?.contains(e.target))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 function keyboard(event){
  if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   event.preventDefault();if(!open){show();return;}
   setIndex(i=>event.key==='Home'?0:event.key==='End'?labels.length-1:(i+(event.key==='ArrowDown'?1:-1)+labels.length)%labels.length);
  }
 }
 return <div className="topic-picker" ref={root} onKeyDown={keyboard} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <button className="topic-trigger" ref={trigger} disabled={disabled} type="button" title={value} aria-label={'Topic label: '+value} aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={()=>open?close():show()}><Tag size={15}/><span>{value}</span><CaretDown size={14} className={open?'turned':''}/></button>
  {open&&<div className={'topic-options '+(above?'above':'')} role="listbox" aria-label="Topic labels" id={id}>{labels.map((label,i)=><button type="button" role="option" aria-selected={value===label} tabIndex={index===i?0:-1} ref={element=>{options.current[i]=element;}} key={label} onClick={()=>{onChange(label);close();}}><span>{label}</span>{value===label&&<Check size={16}/>}</button>)}</div>}
 </div>;
}

function InlineControls({card,draft,onDraft,onSave,onCategory,busy}){
 const id=useId(),dirty=draft.note!==card.note||draft.label!==card.label;
 return <div className="inline-controls"><div className="classification-controls"><span className="field-caption">Attention</span><div className="attention-choices" role="group" aria-label="Attention">{['action','awareness'].map(cat=><button type="button" key={cat} disabled={busy} aria-pressed={card.category===cat} onClick={()=>onCategory(cat)}>{categoryName(cat)}</button>)}</div><div className="label-field"><span className="field-caption">Topic</span><LabelPicker value={draft.label} onChange={label=>onDraft({...draft,label})} disabled={busy}/></div></div>
  <form className="guidance-inline" onSubmit={event=>{event.preventDefault();onSave();}}><label className="field-caption" htmlFor={id}>Guidance <span>Help the reviewer understand what matters</span></label><textarea id={id} rows="2" maxLength="4000" disabled={busy} value={draft.note} onChange={event=>onDraft({...draft,note:event.target.value})} placeholder="Add context or a preference for future reviews…"/><div className="edit-footer">{dirty?<button className="text-button" type="submit" disabled={busy}>Save changes</button>:<span className="saved-indicator">{card.note?'Saved':''}</span>}</div></form>
 </div>;
}

function Source({card,busy}){
 const [open,setOpen]=useState(false);
 return <><div className="source-row"><button className="text-button" disabled={busy} aria-expanded={open} onClick={()=>setOpen(!open)}><ArrowSquareOut size={17}/>{open?'Close email':'Open email'}</button><time dateTime={card.date}>{formatDate(card.date)}</time></div><AnimatePresence>{open&&<motion.div className="inline-email" initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}><p>{card.body}</p><small>Fictional source preview. No email is sent.</small></motion.div>}</AnimatePresence></>;
}

function DecisionButtons({category,onDecide,busy,compact=false}){
 return <div className={compact?'item-decisions':'decisions'} aria-label="Choose what happens next">
  <motion.button whileTap={{scale:.97}} className="decision primary" title="Records completion; email stays in your inbox." disabled={busy} onClick={()=>onDecide('handled')}><span><Check size={compact?17:25}/>{category==='awareness'?'Noted':'Handled'}</span>{!compact&&<small>{category==='awareness'?'I have the update':'I took care of it'}</small>}</motion.button>
  <motion.button whileTap={{scale:.97}} className="decision" disabled={busy} onClick={()=>onDecide('pass')}><span><ArrowDown size={compact?17:24}/>Pass</span>{!compact&&<small>Back of the queue</small>}</motion.button>
  <motion.button whileTap={{scale:.97}} className="decision" title="Archive from inbox" disabled={busy} onClick={()=>onDecide('dismissed')}><span><XCircle size={compact?17:25}/>Not important</span>{!compact&&<small>Archive from inbox</small>}</motion.button>
 </div>;
}

function ClassicItem({card,now,draft,onDraft,onSave,onCategory,onDecide,busy}){
 const [editing,setEditing]=useState(false);
 return <motion.article layout exit={{opacity:0,height:0}} className={'classic-item '+(editing?'editor-open':'')} aria-label={card.subject}>
  <div className="item-meta"><span>{card.sender}</span><span className="account">{card.account}</span><span className="xp-value">{availableXP(card,now)?availableXP(card,now)+' XP':'XP earned'}</span></div><h3>{card.subject}</h3><p className="item-summary">{card.summary}</p><Source card={card} busy={busy}/>
  <div className="classic-actions"><DecisionButtons compact category={card.category} onDecide={onDecide} busy={busy}/><button className="edit-item text-button" aria-expanded={editing} onClick={()=>setEditing(!editing)} disabled={busy}>{editing?'Close':'Edit'}<CaretDown size={14} className={editing?'turned':''}/></button></div>
  {editing&&<InlineControls card={card} draft={draft} onDraft={onDraft} onSave={onSave} onCategory={onCategory} busy={busy}/>}
 </motion.article>;
}

const achievementIcons={first:Trophy,return:ArrowCounterClockwise,five:ListBullets,days:CalendarBlank};
function Achievements({badges,celebrations,onCelebrations}){
 const unlocked=badges.filter(badge=>badge.unlocked).length;
 return <section className="achievements-view"><div className="view-heading"><h1 tabIndex={-1}><Trophy size={23}/>Achievements</h1><span className="quiet-caption">{unlocked} of {badges.length} unlocked</span></div><div className="achievement-intro"><p>Small milestones for following through.</p><label className="celebration-setting"><input type="checkbox" checked={celebrations} onChange={event=>onCelebrations(event.target.checked)}/>Celebrate unlocks</label></div><div className="achievement-grid">{badges.map(badge=>{const Icon=achievementIcons[badge.icon];return <article key={badge.id} className={'achievement-card '+(badge.unlocked?'unlocked':'in-progress')} aria-label={badge.title}><div className="achievement-emblem" aria-hidden="true"><Icon size={29} weight={badge.unlocked?'fill':'regular'}/>{badge.unlocked&&<span><Check size={12} weight="bold"/></span>}</div><div className="achievement-copy"><span className="achievement-status">{badge.unlocked?'Unlocked':'In progress'}</span><h2>{badge.title}</h2><p>{badge.description}</p><div className="achievement-progress" role="progressbar" aria-label={badge.title+' progress'} aria-valuemin={0} aria-valuemax={badge.target} aria-valuenow={badge.progress}><span style={{width:(badge.progress/badge.target*100)+'%'}}/></div><small>{badge.progress} / {badge.target}{badge.unlockedAt?' · '+formatDate(badge.unlockedAt):''}</small></div></article>;})}</div><details className="achievement-rules"><summary><CaretRight size={15}/>How milestones work</summary><p>Both game and classic decisions count. These milestones track handled Needs action items; passing, Not important, and Worth knowing decisions don’t count toward them. Achievements add no bonus XP.</p><p>Undo reverses the latest decision’s milestone progress. New tracking starts with this demo session; the fictional completed history isn’t counted. Progress resets on reload.</p></details></section>;
}

export function App(){return <MotionConfig reducedMotion="user"><Desk/></MotionConfig>;}
function Desk(){
 const [cards,setCards]=useState(initialCards),[round,setRound]=useState(()=>makeRound(initialCards())),[view,setView]=useState('round'),[lastMode,setLastMode]=useState('round'),[undo,setUndo]=useState(null),[notice,setNotice]=useState(''),[drafts,setDrafts]=useState({}),[busy,setBusy]=useState(false),[reward,setReward]=useState(null),[weekend,setWeekend]=useState(false),[achievementLedger,setAchievementLedger]=useState(emptyAchievementLedger),[celebrateUnlocks,setCelebrateUnlocks]=useState(true),[achievementToast,setAchievementToast]=useState(null);
 const lock=useRef(false),heading=useRef(null),taskStage=useRef(null),timers=useRef([]),serial=useRef(0),ledgerRef=useRef(achievementLedger),pendingUnlocks=useRef(new Set()),unlockTimer=useRef(null),unlockEpoch=useRef(0),reduced=useReducedMotion();
 const now=weekend?Date.parse('2026-11-28T16:20:00Z'):DEMO_NOW;
 const current=cards.find(card=>card.id===round.ids[round.index]),complete=round.index>=round.ids.length,xp=totalXP(cards),counts=type=>round.outcomes.filter(outcome=>outcome.type===type).length;
 const badges=projectAchievements(achievementLedger),achievementCount=badges.filter(badge=>badge.unlocked).length;
 const waiting=cards.filter(card=>card.state==='open'&&card.category===round.category).length;
 const getDraft=card=>drafts[card.id]??{note:card.note,label:card.label};
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),4200);return()=>clearTimeout(timer);},[notice]);
 useEffect(()=>{if(busy)return;(heading.current??document.querySelector('.achievements-view h1'))?.focus({preventScroll:true});if(view==='round'&&innerWidth<=700&&scrollY>300)taskStage.current?.scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'});},[round.index,view,busy]);
 function snapshot(achievementEventId=null){setUndo({cards:clone(cards),round:clone(round),drafts:clone(drafts),view,achievementEventId});}
 function clearDraft(id){setDrafts(previous=>{const next={...previous};delete next[id];return next;});}
 function withDraft(id){const card=cards.find(card=>card.id===id);return card?cards.map(item=>item.id===id?{...item,...getDraft(card)}:item):cards;}
 function beginTransition(){if(lock.current)return false;lock.current=true;setBusy(true);timers.current.push(setTimeout(()=>{lock.current=false;setBusy(false);},reduced?80:480));return true;}
 function celebrate(earned,previousXP){
  if(!earned)return;const levelUp=Math.floor((previousXP+earned)/100)>Math.floor(previousXP/100),id=++serial.current;
  setReward({id,earned,levelUp,level:Math.floor((previousXP+earned)/100)+1});
  if(!reduced)confetti({particleCount:levelUp?65:22,spread:levelUp?90:58,startVelocity:levelUp?29:19,gravity:1.2,origin:{x:.8,y:.18},colors:['#3046f3','#ffbd45','#a99af3'],disableForReducedMotion:true});
  timers.current.push(setTimeout(()=>setReward(value=>value?.id===id?null:value),levelUp?2600:1600));
 }
 function clearUnlockNotice(){unlockEpoch.current++;clearTimeout(unlockTimer.current);pendingUnlocks.current.clear();setAchievementToast(null);}
 function trackAchievement(event,previousXP,earned){
  const next=appendAchievementEvent(ledgerRef.current,event),unlocks=newlyUnlocked(ledgerRef.current,next);ledgerRef.current=next;setAchievementLedger(next);
  if(!celebrateUnlocks)return;
  for(const badge of unlocks)pendingUnlocks.current.add(badge.id);
  if(!pendingUnlocks.current.size)return;
  clearTimeout(unlockTimer.current);const epoch=unlockEpoch.current,delay=Math.floor((previousXP+earned)/100)>Math.floor(previousXP/100)?2800:1800;
  unlockTimer.current=setTimeout(()=>{if(epoch!==unlockEpoch.current)return;const earnedBadges=projectAchievements(ledgerRef.current).filter(badge=>badge.unlocked&&pendingUnlocks.current.has(badge.id));pendingUnlocks.current.clear();if(!earnedBadges.length)return;const notice={id:event.id,badges:earnedBadges};setAchievementToast(notice);timers.current.push(setTimeout(()=>setAchievementToast(current=>current?.id===notice.id?null:current),6500));},delay);timers.current.push(unlockTimer.current);
 }
 function toggleUnlocks(value){setCelebrateUnlocks(value);if(!value)clearUnlockNotice();}
 function decide(id,type){
  const card=cards.find(card=>card.id===id);if(!card||card.state!=='open'||!beginTransition())return;
  const eventId=crypto.randomUUID();snapshot(eventId);const result=resolveCard(withDraft(id),id,type,now);setCards(result.cards);clearDraft(id);trackAchievement({id:eventId,type:'decision',at:new Date(now).toISOString(),cardId:id,category:card.category,outcome:type,mode:view},xp,result.earned);
  if(view==='round')setRound({...round,index:round.index+1,outcomes:[...round.outcomes,{id,type,earned:result.earned}]});
  setNotice(type==='pass'?'Passed to the back of the queue.':type==='dismissed'?'Not important · inbox archived in this demo.':card.category==='awareness'?'Noted.':'Handled.');celebrate(result.earned,xp);
 }
 function assignCategory(id,category){
  const card=cards.find(card=>card.id===id);if(!card||card.category===category||!beginTransition())return;
  snapshot();setCards(withDraft(id).map(card=>card.id===id?{...card,category}:card));clearDraft(id);
  if(view==='round')setRound({...round,index:round.index+1,outcomes:[...round.outcomes,{id,type:'moved',earned:0}]});
  setNotice('Moved to '+categoryName(category)+'.');
 }
 function saveGuidance(id){if(lock.current)return;setCards(withDraft(id));clearDraft(id);setNotice('Changes saved.');}
 function restore(){if(!undo||!beginTransition())return;setCards(undo.cards);setRound(undo.round);setDrafts(undo.drafts);setView(undo.view);setUndo(null);setReward(null);clearUnlockNotice();if(undo.achievementEventId){const next=appendAchievementEvent(ledgerRef.current,{id:crypto.randomUUID(),type:'undo',at:new Date(now).toISOString(),targetId:undo.achievementEventId});ledgerRef.current=next;setAchievementLedger(next);}confetti.reset();setNotice('Last decision undone.');}
 function navigate(target){if(lock.current)return;setView(target);setUndo(null);if(['round','classic'].includes(target))setLastMode(target);}
 function start(category='action'){if(lock.current)return;setRound(makeRound(cards,category));navigate('round');}
 function reset(){const fresh=initialCards();setCards(fresh);setRound(makeRound(fresh));setDrafts({});setView('round');setLastMode('round');setUndo(null);setReward(null);setWeekend(false);clearUnlockNotice();const ledger=emptyAchievementLedger();ledgerRef.current=ledger;setAchievementLedger(ledger);setCelebrateUnlocks(true);confetti.reset();setNotice('Demo restarted.');}
 const groups=archiveGroups(cards),months=[...new Set(groups.map(([day])=>day.slice(0,7)))];
 function controls(card){return <InlineControls card={card} draft={getDraft(card)} onDraft={value=>setDrafts(previous=>({...previous,[card.id]:value}))} onSave={()=>saveGuidance(card.id)} onCategory={category=>assignCategory(card.id,category)} busy={busy}/>;}
 const undoButton=(caption='Undo')=><button className="text-button undo-button" disabled={!undo||busy} onClick={restore}><ArrowCounterClockwise size={16}/>{caption}</button>;
 return <><a className="skip-link" href="#main">Skip to task</a><header className="topbar"><a className="brand" href="#" onClick={event=>{event.preventDefault();navigate(lastMode);}}><img src="assets/robot-host.png" alt=""/>Email Desk</a><span className="demo-badge">Fictional demo</span><nav aria-label="Workspace"><button className="nav-button" disabled={busy} onClick={()=>['history','achievements'].includes(view)?navigate(lastMode):navigate('history')}><Archive size={20}/>{['history','achievements'].includes(view)?'Back to desk':'History'}</button>{view==='round'?<button className="end-button" disabled={busy} onClick={()=>navigate('classic')}><ListBullets size={18}/>End round</button>:<button className="end-button" disabled={busy} onClick={()=>start()}><GameController size={20}/>Game mode</button>}</nav></header>
 <main id="main" className={'desk-main '+view+'-view'}><Progress xp={xp} now={now} onAchievements={()=>navigate('achievements')} achievementCount={achievementCount} disabled={busy||view==='achievements'}/>
 {view==='achievements'?<Achievements badges={badges} celebrations={celebrateUnlocks} onCelebrations={toggleUnlocks}/>:view==='history'?<section className="history-view"><div className="view-heading"><h1 ref={heading} tabIndex={-1}><Archive size={23}/>History</h1><span className="quiet-caption">Settled decisions</span></div><details className="archive-year" open><summary><CaretRight size={17}/><span>2026</span><small>{cards.filter(card=>card.state!=='open').length} decisions</small></summary>{months.map(month=><details className="archive-month" open key={month}><summary><CaretRight size={15}/>{new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'}).format(new Date(month+'-15T12:00:00Z'))}</summary>{groups.filter(([day])=>day.startsWith(month)).map(([day,entries])=><section className="archive-day" key={day}><h2>{formatDate(day+'T17:00:00Z')}</h2>{entries.map(card=><article className="history-row" key={card.id}><span className="history-mark" aria-hidden="true">{card.state==='dismissed'?<Archive size={18}/>:<Check size={18}/>}</span><div><p className="item-meta">{card.sender} · {card.account}</p><h3>{card.subject}</h3><p className="history-state">{card.state==='dismissed'?'Not important · Inbox archived':card.category==='awareness'?'Noted':'Handled'}</p>{card.note&&<p className="saved-note">Guidance: {card.note}</p>}</div><span className="xp-value">{card.decisionXP} XP</span></article>)}</section>)}</details>)}</details></section>:
 view==='classic'?<section className="classic-view"><div className="view-heading"><h1 ref={heading} tabIndex={-1}><ListBullets size={23}/>Classic view</h1>{undo?undoButton('Undo last decision'):<span className="quiet-caption">Decide here, at your pace</span>}</div><div className="classic-board">{['action','awareness'].map(category=><section className="classic-column" key={category}><h2>{categoryName(category)}<span>{cards.filter(card=>card.category===category&&card.state==='open').length}</span></h2><AnimatePresence initial={false}>{cards.filter(card=>card.category===category&&card.state==='open').sort((a,b)=>a.queueOrder-b.queueOrder).map(card=><ClassicItem key={card.id} card={card} now={now} draft={getDraft(card)} onDraft={value=>setDrafts(previous=>({...previous,[card.id]:value}))} onSave={()=>saveGuidance(card.id)} onCategory={category=>assignCategory(card.id,category)} onDecide={type=>decide(card.id,type)} busy={busy}/>)}</AnimatePresence>{!cards.some(card=>card.category===category&&card.state==='open')&&<div className="column-empty"><Check size={26}/><p>All clear here.</p></div>}</section>)}</div></section>:
 <><section className="modebar"><div className="mode-title"><span className="eyebrow">Focus round · {waiting} waiting</span><h1 ref={heading} tabIndex={-1}>{categoryName(round.category)}</h1></div><div className="queue-cluster">{!complete&&<div className="round-progress"><span className="item-caption">ITEM {round.index+1} OF {round.ids.length}</span><ol aria-label="Round progress">{round.ids.map((id,i)=><li key={id} className={i<round.index?'considered':i===round.index?'current':''} aria-current={i===round.index?'step':undefined}><span className="sr-only">Item {i+1}: {i<round.index?'considered':i===round.index?'current':'upcoming'}</span></li>)}</ol></div>}<div className="round-summary" aria-label="This round’s decisions"><span>{counts('handled')} {round.category==='awareness'?'noted':'handled'} · {counts('dismissed')} not important · {counts('pass')} passed</span>{undoButton()}</div></div></section>
 {complete?<section className="finish"><span className="agent-celebration" aria-hidden="true"/><h2>Round complete.</h2><p className="finish-counts">{counts('handled')} {round.category==='awareness'?'noted':'handled'} · {counts('dismissed')} not important · {counts('pass')} passed</p>{counts('moved')>0&&<p>{counts('moved')} moved to another attention category.</p>}<p className="muted">{round.ids.length?'You’ve considered every item in this round.':'No items waiting here.'} {counts('pass')>0?'Your passes are at the back of the queue.':''}</p><div className="finish-actions">{round.category==='action'&&cards.some(card=>card.category==='awareness'&&card.state==='open')&&<button className="primary" disabled={busy} onClick={()=>start('awareness')}>Next: Worth knowing<ArrowRight size={18}/></button>}{cards.some(card=>card.category===round.category&&card.state==='open')&&<button disabled={busy} onClick={()=>start(round.category)}>Another round</button>}<button disabled={busy} onClick={()=>navigate('classic')}>Classic view</button></div><p className="quiet-caption">+{round.outcomes.reduce((sum,outcome)=>sum+(outcome.earned||0),0)} XP this round</p></section>:
 <><section className="task-stage" ref={taskStage} aria-label="Current email"><img className="host" src="assets/robot-host.png" alt=""/><AnimatePresence mode="wait" initial={false}><motion.article className="task-surface" key={current.id} initial={{opacity:0,x:55,scale:.98}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:-85,scale:.97}} transition={{duration:reduced?0:.20}}><div className="task-meta"><strong>{current.sender}</strong><span className="account">{current.account}</span><span className="xp-value">{availableXP(current,now)?availableXP(current,now)+' XP available':'XP already earned'}</span></div><h2>{current.subject}</h2><p className="task-summary">{current.summary}</p><Source card={current} busy={busy}/>{controls(current)}</motion.article></AnimatePresence></section><DecisionButtons category={round.category} onDecide={type=>decide(current.id,type)} busy={busy}/></>}
 </>}
 </main><footer className="demo-footer"><span>Fictional messages · Resets on reload · No email is changed</span><details><summary>Demo controls</summary><button onClick={()=>setWeekend(!weekend)}>Preview {weekend?'weekday':'weekend'} schedule</button><button disabled={busy} onClick={reset}>Restart demo</button></details></footer><div className="notice" role="status" aria-live="polite">{notice}</div><AnimatePresence>{achievementToast&&<motion.aside className="achievement-notice" key={achievementToast.id} initial={{opacity:0,y:reduced?0:18}} animate={{opacity:1,y:0}} exit={{opacity:0}} aria-label="Achievement unlocked"><Trophy size={25} weight="fill"/><div><span className="field-caption">{achievementToast.badges.length===1?'Achievement unlocked':'Achievements unlocked'}</span><strong role="status">{achievementToast.badges.map(badge=>badge.title).join(' · ')}</strong></div><button className="text-button" onClick={()=>{setAchievementToast(null);navigate('achievements');}}>View</button><button className="dismiss-achievement" aria-label="Dismiss achievement notification" onClick={()=>setAchievementToast(null)}>Close</button></motion.aside>}</AnimatePresence><AnimatePresence>{reward&&<motion.div className={'xp-reward '+(reward.levelUp?'level-up':'')} key={reward.id} initial={{opacity:0,y:25,scale:.65}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-25}} transition={{type:'spring',stiffness:300,damping:16}} role="status"><Sparkle size={reward.levelUp?38:26} weight="fill"/><div><strong>{reward.levelUp?'LEVEL '+reward.level:'+'+reward.earned+' XP'}</strong><span>{reward.levelUp?'Level up! +'+reward.earned+' XP':'Nicely handled.'}</span></div>{reward.levelUp&&<span className="agent-celebration" aria-hidden="true"/>}</motion.div>}</AnimatePresence></>;
}
