<?php
declare(strict_types=1);
require __DIR__.'/../server/Store.php';
$dir=sys_get_temp_dir().'/email-desk-test-'.bin2hex(random_bytes(8));$key=random_bytes(32);$s=new DeskStore($dir,$key);$count=0;
function check(bool $v,string $m):void{global $count;if(!$v)throw new RuntimeException($m);$count++;}
function rejects(callable $f,string $reason):void{try{$f();throw new RuntimeException('Expected '.$reason);}catch(DeskError $e){check($e->reason===$reason,'Expected '.$reason.', got '.$e->reason);}}
function op():string{return bin2hex(random_bytes(16));}
$c=['account'=>'mijatovic@gmail.com','thread_id'=>'abcdef1234567890','message_ids'=>['abcdef1234567890'],'subject'=>'Fictional dinner receipt','sender'=>'Fictional restaurant','date'=>'2026-11-15T10:00:00Z','description'=>'A fictional restaurant payment.','reason'=>'Keep the purchase record.','category'=>'awareness','labels'=>['Dining Out'],'question'=>'','deadline'=>''];
function pub(DeskStore $s,array $cards,array $over=[]):array{return $s->publish(array_merge(['operation_id'=>op(),'cards'=>$cards,'run'=>['status'=>'success','summary'=>'Fictional review','checkpoints'=>['mijatovic@gmail.com'=>'2026-11-15T10:00:00Z']]],$over));}
try{
 check(count($s->board()['cards'])===0,'starts empty');
 $p=['operation_id'=>op(),'cards'=>[$c],'run'=>['status'=>'success','summary'=>'Fictional review']];$r=$s->publish($p);check($r['created']===1,'created');check($s->publish($p)===$r,'publish duplicate acknowledged');$p['run']['summary']='different';rejects(fn()=>$s->publish($p),'operation_reused');
 $b=$s->board()['cards'][0];$a=['operation_id'=>op(),'card_id'=>$b['id'],'revision'=>$b['revision'],'labels'=>['Dining Out','Records/Receipts & Statements'],'note'=>'Fictional personal context: restaurant receipt.','state'=>'handled','category'=>'awareness'];$f=$s->feedback($a);check($f['card']['state']==='handled','handled');check($s->feedback($a)===$f,'feedback idempotent');
 $bad=$a;$bad['operation_id']=op();rejects(fn()=>$s->feedback($bad),'conflict');check(count($s->pending()['feedback'])===1,'no duplicate feedback');
 $c['description']='A newer factual summary.';pub($s,[$c]);$b=$s->board()['cards'][0];check($b['state']==='handled','scan preserves handled');check($b['note']===$a['note'],'scan preserves note');check(count($b['user_labels'])===2,'scan preserves correction');check($b['description']===$c['description'],'scan refreshes summary');
 $ack=['operation_id'=>op(),'feedback_id'=>$f['feedback_id'],'status'=>'applied','explanation'=>'Verified fake labels for test only.'];rejects(fn()=>$s->acknowledge($ack),'verification_required');$ack['actual_labels']=['Dining Out'];rejects(fn()=>$s->acknowledge($ack),'verification_mismatch');$ack['actual_labels']=['Dining Out','Records/Receipts & Statements'];$s->acknowledge($ack);check(count($s->pending()['feedback'])===0,'ack removes pending');check($s->board()['cards'][0]['feedback_status']==='applied','result visible');
 $cp=$s->board()['checkpoints'];pub($s,[],['run'=>['status'=>'error','summary'=>'Fictional failure']]);check($s->board()['checkpoints']===$cp,'failed run preserves cursors');check($s->board()['run']['last_success_at']!==null,'failure retains last success');check(count($s->board()['cards'])===1,'absent cards not deleted');
 $c2=$c;$c2['account']='milan@mijatovic.com';pub($s,[$c2]);check(count($s->board()['cards'])===2,'same thread different account isolated');
 $bad=$c;$bad['labels']=['INBOX'];rejects(fn()=>pub($s,[$bad]),'labels');$bad=$c;$bad['account']='other@example.com';rejects(fn()=>pub($s,[$bad]),'account');$bad=$c;$bad['thread_id']='https://attacker.invalid';rejects(fn()=>pub($s,[$bad]),'thread_id');
 $c['reopen_reason']='A new fictional message asks a new question.';pub($s,[$c]);$b=array_values(array_filter($s->board()['cards'],fn($r)=>$r['account']===$c['account']))[0];check($b['state']==='open','explicit reason can reopen');check($b['note']===$a['note'],'reopen preserves note');
 $a2=['operation_id'=>op(),'card_id'=>$b['id'],'revision'=>$b['revision'],'labels'=>null,'note'=>'New fictional context.','state'=>'open','category'=>'action'];$f2=$s->feedback($a2);check($f2['card']['user_category']==='action','category correction');$s->acknowledge(['operation_id'=>op(),'feedback_id'=>$f2['feedback_id'],'status'=>'recorded','explanation'=>'Context recorded; no Gmail mutation.']);check($s->board()['cards'][0]['feedback_status']!==null,'context acknowledgement');
 $raw=file_get_contents($dir.'/desk.sqlite');check(!str_contains($raw,$a['note'])&&!str_contains($raw,$c['subject'])&&!str_contains($raw,$c['account']),'database content encrypted');
 $wrong=new DeskStore($dir,random_bytes(32));rejects(fn()=>$wrong->board(),'storage');
 $reopened=new DeskStore($dir,$key);check(count($reopened->board()['cards'])===2,'durable restart');
 echo "$count storage, isolation, retry, conflict and encryption checks passed.\n";
}finally{foreach(glob($dir.'/*')as $f)unlink($f);rmdir($dir);}
