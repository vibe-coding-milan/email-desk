<?php
declare(strict_types=1);
require __DIR__.'/../server/Store.php';
$dir=sys_get_temp_dir().'/email-desk-test-'.bin2hex(random_bytes(8));$key=random_bytes(32);$s=new DeskStore($dir,$key);$count=0;
function check(bool $v,string $m):void{global $count;if(!$v)throw new RuntimeException($m);$count++;}
function rejects(callable $f,string $reason):void{try{$f();throw new RuntimeException('Expected '.$reason);}catch(DeskError $e){check($e->reason===$reason,'Expected '.$reason.', got '.$e->reason);}}
function op():string{return bin2hex(random_bytes(16));}
$c=['account'=>'mijatovic@gmail.com','thread_id'=>'abcdef1234567890','message_ids'=>['abcdef1234567890'],'subject'=>'Fictional dinner receipt','sender'=>'Fictional restaurant','date'=>gmdate('c'),'description'=>'A fictional restaurant payment.','reason'=>'Keep the purchase record.','category'=>'awareness','labels'=>['Dining Out'],'question'=>'','deadline'=>''];
function pub(DeskStore $s,array $cards,array $over=[]):array{return $s->publish(array_merge(['operation_id'=>op(),'cards'=>$cards,'run'=>['status'=>'success','summary'=>'Fictional review','checkpoints'=>['mijatovic@gmail.com'=>'2026-11-15T10:00:00Z']]],$over));}
try{
 $stamp=strtotime('2026-11-19T12:00:00Z');$timed=['date'=>gmdate('c',$stamp)];
 check(DeskStore::decisionXp($timed,$stamp+48*3600)===10,'exactly 48 hours retains full credit');
 check(DeskStore::decisionXp($timed,$stamp+48*3600+1)===5,'one second beyond window earns 5');
 check(DeskStore::decisionXp($timed,$stamp-3600)===10,'future timestamp cannot create a penalty');
 $timed['attention_started_at']=gmdate('c',$stamp+72*3600);
 check(DeskStore::decisionXp($timed,$stamp+73*3600)===10,'new request uses fresh window');
 check(count($s->board()['cards'])===0,'starts empty');check($s->board()['runs']===[],'no invented review history');
 $p=['operation_id'=>op(),'cards'=>[$c],'run'=>['status'=>'success','summary'=>'Fictional review']];$r=$s->publish($p);check($r['created']===1,'created');check($s->publish($p)===$r,'publish duplicate acknowledged');check(count($s->board()['runs'])===1,'retry does not duplicate review history');check($s->board()['runs'][0]===['finished_at'=>$r['run']['finished_at'],'status'=>'success'],'review history returns only timing and outcome');$p['run']['summary']='different';rejects(fn()=>$s->publish($p),'operation_reused');
 $b=$s->board()['cards'][0];$a=['operation_id'=>op(),'card_id'=>$b['id'],'revision'=>$b['revision'],'labels'=>['Dining Out','Records/Receipts & Statements'],'note'=>'Fictional personal context: restaurant receipt.','state'=>'handled','category'=>'awareness'];$f=$s->feedback($a);check($f['card']['state']==='handled','handled');check($s->feedback($a)===$f,'feedback idempotent');
 $bad=$a;$bad['operation_id']=op();rejects(fn()=>$s->feedback($bad),'conflict');check(count($s->pending()['feedback'])===1,'no duplicate feedback');
 $c['description']='A newer factual summary.';pub($s,[$c]);$b=$s->board()['cards'][0];check($b['state']==='handled','scan preserves handled');check($b['note']===$a['note'],'scan preserves note');check(count($b['user_labels'])===2,'scan preserves correction');check($b['description']===$c['description'],'scan refreshes summary');
 $ack=['operation_id'=>op(),'feedback_id'=>$f['feedback_id'],'status'=>'applied','explanation'=>'Verified fake labels for test only.'];rejects(fn()=>$s->acknowledge($ack),'verification_required');$ack['actual_labels']=['Dining Out'];rejects(fn()=>$s->acknowledge($ack),'verification_mismatch');$ack['actual_labels']=['Dining Out','Records/Receipts & Statements'];$s->acknowledge($ack);check(count($s->pending()['feedback'])===0,'ack removes pending');check($s->board()['cards'][0]['feedback_status']==='applied','result visible');
 $cp=$s->board()['checkpoints'];pub($s,[],['run'=>['status'=>'error','summary'=>'Fictional failure']]);check($s->board()['checkpoints']===$cp,'failed run preserves cursors');check($s->board()['run']['last_success_at']!==null,'failure retains last success');check(count($s->board()['cards'])===1,'absent cards not deleted');check($s->board()['runs'][0]['status']==='error','failed review remains visible in history');check(count($s->board()['runs'])===3,'feedback and acknowledgement are not review runs');
 $c2=$c;$c2['account']='milan@mijatovic.com';pub($s,[$c2]);check(count($s->board()['cards'])===2,'same thread different account isolated');
 $bad=$c;$bad['labels']=['INBOX'];rejects(fn()=>pub($s,[$bad]),'labels');$bad=$c;$bad['account']='other@example.com';rejects(fn()=>pub($s,[$bad]),'account');$bad=$c;$bad['thread_id']='https://attacker.invalid';rejects(fn()=>pub($s,[$bad]),'thread_id');
 $c['reopen_reason']='A new fictional message asks a new question.';pub($s,[$c]);$b=array_values(array_filter($s->board()['cards'],fn($r)=>$r['account']===$c['account']))[0];check($b['state']==='open','explicit reason can reopen');check($b['note']===$a['note'],'reopen preserves note');
 $a2=['operation_id'=>op(),'card_id'=>$b['id'],'revision'=>$b['revision'],'labels'=>null,'note'=>'New fictional context.','state'=>'open','category'=>'action'];$f2=$s->feedback($a2);check($f2['card']['user_category']==='action','category correction');$s->acknowledge(['operation_id'=>op(),'feedback_id'=>$f2['feedback_id'],'status'=>'recorded','explanation'=>'Context recorded; no Gmail mutation.']);check($s->board()['cards'][0]['feedback_status']!==null,'context acknowledgement');
 // Progress is awarded by a confirmed decision once per durable card, across accounts and restarts.
 check($f['xp_earned']===10,'first handled earns 10 XP');
 check($s->feedback($a)===$f,'retry preserves original award response');
 check($s->board()['progress']['xp']===10,'scan and open edits do not earn XP');
 $current=array_values(array_filter($s->board()['cards'],fn($row)=>$row['account']===$c['account']))[0];
 $decision=['operation_id'=>op(),'card_id'=>$current['id'],'revision'=>$current['revision'],'labels'=>null,'note'=>$current['note'],'state'=>'dismissed','category'=>'action'];
 $closed=$s->feedback($decision);check($closed['xp_earned']===0,'reopened card cannot earn again');
 $decision['operation_id']=op();$decision['revision']=$closed['card']['revision'];$decision['state']='handled';
 check($s->feedback($decision)['xp_earned']===0,'changing closed outcome cannot earn again');
 $second=array_values(array_filter($s->board()['cards'],fn($row)=>$row['account']===$c2['account']))[0];
 $decision2=['operation_id'=>op(),'card_id'=>$second['id'],'revision'=>$second['revision'],'labels'=>null,'note'=>'','state'=>'dismissed','category'=>'awareness'];
 $dismissed=$s->feedback($decision2);check($dismissed['xp_earned']===10,'dismissal earns equal XP in second account');
 check($s->board()['progress']['xp']===20,'shared board combines both accounts');
 $stale=$decision2;$stale['operation_id']=op();rejects(fn()=>$s->feedback($stale),'conflict');
 check($s->board()['progress']['xp']===20,'conflict does not award XP');
 pub($s,[$c2]);check($s->board()['progress']['decisions']===2,'publishing preserves awards');
 $more=[];for($i=0;$i<8;$i++){$next=$c2;$next['thread_id']='bbbbbbbbbbbbbbb'.$i;$next['message_ids']=[$next['thread_id']];$more[]=$next;}
 pub($s,$more);
 foreach($s->board()['cards'] as $next)if(!isset($next['decision_earned_at']))$s->feedback(['operation_id'=>op(),'card_id'=>$next['id'],'revision'=>$next['revision'],'labels'=>null,'note'=>'','state'=>'handled','category'=>'awareness']);
 $score=$s->board()['progress'];check($score['xp']===100&&$score['level']===2&&$score['level_xp']===0,'100 XP advances level without losing lifetime XP');
 $watch=$more[0];$watch['category']='action';$watch['reopen_reason']='A new fictional outstanding request.';pub($s,[$watch]);
 $changed=$watch;$changed['category']='awareness';$changed['description']='New fictional summary, original request still unresolved.';pub($s,[$changed]);
 $watched=array_values(array_filter($s->board()['cards'],fn($row)=>$row['thread_id']===$watch['thread_id']))[0];
 check($watched['state']==='open'&&$watched['category']==='action','scan cannot downgrade unfinished action');
 check($watched['context_history'][0]['description']===$watch['description'],'earlier unhandled context is retained');
 pub($s,[],['run'=>['status'=>'partial','summary'=>'Fictional partial review']]);
 $retained=array_values(array_filter($s->board()['cards'],fn($row)=>$row['id']===$watched['id']))[0];
 check($retained===$watched,'omitted unfinished card remains unchanged');
 $edit=['operation_id'=>op(),'card_id'=>$retained['id'],'revision'=>$retained['revision'],'labels'=>null,'note'=>'Explicit fictional category correction.','state'=>'open','category'=>'awareness'];$s->feedback($edit);pub($s,[$changed]);
 $retained=array_values(array_filter($s->board()['cards'],fn($row)=>$row['id']===$watched['id']))[0];
 check($retained['user_category']==='awareness','owner category correction remains authoritative');
 check(count($retained['context_history'])===1,'identical re-review does not duplicate context');
 $raw=file_get_contents($dir.'/desk.sqlite');check(!str_contains($raw,$a['note'])&&!str_contains($raw,$c['subject'])&&!str_contains($raw,$c['account']),'database content encrypted');
 $wrong=new DeskStore($dir,random_bytes(32));rejects(fn()=>$wrong->board(),'storage');
 $reopened=new DeskStore($dir,$key);check(count($reopened->board()['cards'])===10,'durable restart');
 check($reopened->board()['progress']['xp']===100,'XP survives restart');check($reopened->board()['runs']===$s->board()['runs'],'review history survives restart');
 // The awarded amount is frozen, encrypted, deduplicated and retained on re-review.
 $late=$c2;$late['thread_id']='cccccccccccccccc';$late['message_ids']=[$late['thread_id']];$late['date']=gmdate('c',time()-49*3600);unset($late['reopen_reason']);pub($s,[$late]);
 $lateCard=array_values(array_filter($s->board()['cards'],fn($row)=>$row['thread_id']===$late['thread_id']))[0];
 $late['date']=gmdate('c');pub($s,[$late]);
 $lateCard=array_values(array_filter($s->board()['cards'],fn($row)=>$row['id']===$lateCard['id']))[0];
 check(strtotime($lateCard['attention_started_at'])<time()-48*3600,'new summary date cannot reset target');
 $lateDecision=['operation_id'=>op(),'card_id'=>$lateCard['id'],'revision'=>$lateCard['revision'],'labels'=>null,'note'=>'','state'=>'handled','category'=>'awareness'];
 $lateResult=$s->feedback($lateDecision);check($lateResult['xp_earned']===5&&$lateResult['card']['decision_xp']===5,'late decision freezes 5 XP');
 check($s->feedback($lateDecision)===$lateResult,'late retry returns same award');
 pub($s,[$late]);check($s->board()['progress']['xp']===105,'scan preserves mixed awards');
 $restarted=new DeskStore($dir,$key);check($restarted->board()['progress']['xp']===105,'mixed awards survive restart');
 // Simulate a pre-policy encrypted record without an explicit amount.
 $db=new PDO('sqlite:'.$dir.'/desk.sqlite');$legacy=$lateResult['card'];unset($legacy['decision_xp']);
 $nonce=random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);$payload=base64_encode($nonce.sodium_crypto_secretbox(json_encode($legacy),$nonce,$key));
 $q=$db->prepare('UPDATE cards SET payload=? WHERE id=?');$q->execute([$payload,$legacy['id']]);
 check($s->board()['progress']['xp']===110,'legacy decision retains its original 10 XP');
 // Hosted publication is revision-checked atomically and uncertain acknowledgements replay safely.
 check($s->board()['capabilities']['publish_revisions']===true,'revision capability advertised');
 $revisionCard=array_values(array_filter($s->board()['cards'],fn($row)=>$row['account']===$c['account']&&$row['thread_id']===$c['thread_id']))[0];
 $revisionPayload=['operation_id'=>op(),'cards'=>[$c],'expected_revisions'=>[$revisionCard['id']=>$revisionCard['revision']],'run'=>['status'=>'partial','summary'=>'Fictional guarded review']];
 $guarded=$s->publish($revisionPayload);check($s->publish($revisionPayload)===$guarded,'guarded retry returns original acknowledgement');
 $revisionPayload['operation_id']=op();$before=$s->board();rejects(fn()=>$s->publish($revisionPayload),'conflict');check($s->board()===$before,'stale publication changes neither cards nor outcome');
 $revisionPayload['expected_revisions']=[];rejects(fn()=>$s->publish($revisionPayload),'expected_revisions');
 $revisionPayload['expected_revisions']=[$revisionCard['id']=>0];rejects(fn()=>$s->publish($revisionPayload),'conflict');
 echo "$count storage, isolation, retry, conflict and encryption checks passed.\n";
}finally{foreach(glob($dir.'/*')as $f)unlink($f);rmdir($dir);}
