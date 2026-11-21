<?php
declare(strict_types=1);
final class DeskError extends RuntimeException {
 public function __construct(public readonly string $reason,public readonly int $status=400){parent::__construct($reason);}
}
final class DeskStore {
 private PDO $db;
 private array $labels;
 public function __construct(private string $dir,private string $key){
  if(strlen($key)!==32)throw new DeskError('configuration',503);
  if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new DeskError('storage',503);
  chmod($dir,0700);$this->labels=json_decode(file_get_contents(__DIR__.'/labels.json'),true,512,JSON_THROW_ON_ERROR);
  $this->db=new PDO('sqlite:'.$dir.'/desk.sqlite',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
  chmod($dir.'/desk.sqlite',0600);$this->db->exec('PRAGMA busy_timeout=5000');$this->db->exec('PRAGMA foreign_keys=ON');
  $this->db->exec('CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL)');
  $this->db->exec('CREATE TABLE IF NOT EXISTS feedback (seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, card_id TEXT NOT NULL, payload TEXT NOT NULL)');
  $this->db->exec('CREATE TABLE IF NOT EXISTS metadata (name TEXT PRIMARY KEY, payload TEXT NOT NULL)');
  $this->db->exec('CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, digest TEXT NOT NULL, payload TEXT NOT NULL)');
 }
 private function seal(array $p):string{$n=random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES);return base64_encode($n.sodium_crypto_secretbox(json_encode($p,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE),$n,$this->key));}
 private function open(string $v):array{$b=base64_decode($v,true);if($b===false||strlen($b)<40)throw new DeskError('storage',503);$s=sodium_crypto_secretbox_open(substr($b,24),substr($b,0,24),$this->key);if($s===false)throw new DeskError('storage',503);return json_decode($s,true,512,JSON_THROW_ON_ERROR);}
 private function query(string $s,array $args=[]):PDOStatement{$q=$this->db->prepare($s);$q->execute($args);return $q;}
 private function transaction(callable $f):mixed{$this->db->exec('BEGIN IMMEDIATE');try{$r=$f();$this->db->exec('COMMIT');return $r;}catch(Throwable $e){$this->db->exec('ROLLBACK');throw $e;}}
 private function mutate(string $op,array $args,callable $fn):array{
  if(!preg_match('/^[a-zA-Z0-9_-]{16,100}$/D',$op))throw new DeskError('operation_id');
  $digest=hash('sha256',json_encode($args,JSON_THROW_ON_ERROR));
  return $this->transaction(function()use($op,$digest,$fn){$row=$this->query('SELECT * FROM operations WHERE id=?',[$op])->fetch(PDO::FETCH_ASSOC);if($row){if(!hash_equals($row['digest'],$digest))throw new DeskError('operation_reused',409);return $this->open($row['payload']);}$r=$fn();$this->query('INSERT INTO operations VALUES(?,?,?)',[$op,$digest,$this->seal($r)]);return $r;});
 }
 public static function text(mixed $v,int $max,bool $required=false):string{if(!is_string($v)||strlen($v)>$max||($required&&trim($v)==='')||preg_match('//u',$v)!==1)throw new DeskError('invalid_text');return trim($v);}
 private function labelList(mixed $v):array{if(!is_array($v)||!array_is_list($v)||count($v)>37)throw new DeskError('labels');foreach($v as $l)if(!is_string($l)||!in_array($l,$this->labels,true))throw new DeskError('labels');return array_values(array_unique($v));}
 public static function cardId(string $account,string $thread):string{return hash('sha256',$account.':'.$thread);}
 private function normalize(array $c):array{
  $account=$c['account']??'';if(!in_array($account,['mijatovic@gmail.com','milan@mijatovic.com'],true))throw new DeskError('account');
  $thread=self::text($c['thread_id']??'',64,true);if(!preg_match('/^[0-9a-f]{10,64}$/D',$thread))throw new DeskError('thread_id');
  $ids=$c['message_ids']??[];if(!is_array($ids)||!array_is_list($ids)||!count($ids)||count($ids)>100)throw new DeskError('message_ids');foreach($ids as $id)if(!is_string($id)||!preg_match('/^[0-9a-f]{10,64}$/D',$id))throw new DeskError('message_ids');
  if(!in_array($c['category']??'',['action','awareness'],true))throw new DeskError('category');
  $date=self::text($c['date']??'',40,true);if(strtotime($date)===false)throw new DeskError('date');
  return ['id'=>self::cardId($account,$thread),'account'=>$account,'thread_id'=>$thread,'message_ids'=>array_values(array_unique($ids)),'subject'=>self::text($c['subject']??'',1500,true),'sender'=>self::text($c['sender']??'',1000,true),'date'=>$date,'description'=>self::text($c['description']??'',8000,true),'reason'=>self::text($c['reason']??'',3000,true),'deadline'=>self::text($c['deadline']??'',400),'category'=>$c['category'],'labels'=>$this->labelList($c['labels']??[]),'question'=>self::text($c['question']??'',2000),'reopen_reason'=>self::text($c['reopen_reason']??'',2000)];
 }
 private function card(string $id):array{$r=$this->query('SELECT payload FROM cards WHERE id=?',[$id])->fetchColumn();if($r===false)throw new DeskError('not_found',404);return $this->open($r);}
 private function putCard(array $c):void{$this->query('INSERT INTO cards VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',[$c['id'],$c['revision'],$this->seal($c)]);}
 private function meta(string $n):?array{$r=$this->query('SELECT payload FROM metadata WHERE name=?',[$n])->fetchColumn();return $r===false?null:$this->open($r);}
 private function setMeta(string $n,array $v):void{$this->query('INSERT INTO metadata VALUES(?,?) ON CONFLICT(name) DO UPDATE SET payload=excluded.payload',[$n,$this->seal($v)]);}
 private function progress(array $cards):array{
  $decisions=0;$xp=0;foreach($cards as $c)if(isset($c['decision_earned_at'])){$decisions++;$xp+=$c['decision_xp']??10;}
  return ['xp'=>$xp,'decisions'=>$decisions,'level'=>intdiv($xp,100)+1,'level_xp'=>$xp%100,'level_target'=>100];
 }
 public static function decisionXp(array $card,int $now):int{
  $start=strtotime($card['attention_started_at']??$card['reopened_at']??$card['date']);
  return $start!==false&&$now-$start>48*3600?5:10;
 }
 private function reviewRuns():array{
  // Publish acknowledgements already form an encrypted, deduplicated review log.
  // Return only timing/outcome metadata; never infer earlier reviews from the latest one.
  $runs=[];foreach($this->query('SELECT payload FROM operations ORDER BY rowid DESC LIMIT 500')->fetchAll(PDO::FETCH_COLUMN)as $payload){$result=$this->open($payload);if(isset($result['run']['finished_at'],$result['run']['status']))$runs[]=array_intersect_key($result['run'],array_flip(['finished_at','status','details','coverage']));if(count($runs)>=30)break;}
  return $runs;
 }
 private static function stamp(mixed $value,bool $nullable=false):?string{
  if($value===null&&$nullable)return null;
  if(!is_string($value)||strlen($value)>40||!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/D',$value)||strtotime($value)===false)throw new DeskError('report_timestamp');return $value;
 }
 private function runDetails(mixed $value):array{
  if(!is_array($value)||!in_array($value['trigger']??'', ['manual','scheduled'],true)||!in_array($value['phase']??'',['batch','final'],true)||!is_int($value['attempt']??null)||$value['attempt']<1||$value['attempt']>100)throw new DeskError('run_details');
  $slot=self::stamp($value['scheduled_at']??null,true);if(($value['trigger']==='scheduled')!==($slot!==null))throw new DeskError('run_details');
  return ['trigger'=>$value['trigger'],'phase'=>$value['phase'],'attempt'=>$value['attempt'],'scheduled_at'=>$slot,'started_at'=>self::stamp($value['started_at']??null),'completed_at'=>self::stamp($value['completed_at']??null)];
 }
 private function reporting(mixed $value):array{
  if(!is_array($value)||!is_bool($value['schedule_active']??null)||!is_array($value['accounts']??null)||count($value['accounts'])!==2)throw new DeskError('report');
  $accounts=[];$seen=[];foreach($value['accounts'] as $row){$account=$row['account']??'';if(!in_array($account,['mijatovic@gmail.com','milan@mijatovic.com'],true)||isset($seen[$account])||!is_bool($row['historical_complete']??null))throw new DeskError('report');$seen[$account]=true;
   $accounts[]=['account'=>$account,'recent_through'=>self::stamp($row['recent_through']??null,true),'historical_through'=>self::stamp($row['historical_through']??null,true),'historical_complete'=>$row['historical_complete']];}
  $usage=$value['usage']??null;if(!is_array($usage)||!is_array($usage['rows']??null)||!array_is_list($usage['rows'])||count($usage['rows'])>1000||!is_int($usage['unknown_requests']??null)||$usage['unknown_requests']<0)throw new DeskError('report_usage');
  $since=self::text($usage['since']??'',10,true);if(!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$since)||strtotime($since)===false)throw new DeskError('report_usage');
  $rows=[];$keys=[];foreach($usage['rows'] as $row){
   if(!is_array($row)||!preg_match('/^\d{4}-\d{2}-\d{2}$/D',$row['day']??'')||strtotime($row['day'])===false||$row['day']<$since||!in_array($row['purpose']??'', ['routine','catch_up','mixed','manual','dry_run','legacy'],true)||!in_array($row['model']??'',['gpt-6-luna','other'],true)||!in_array($row['rate_date']??'',['2026-11-20','2026-11-21','unknown'],true))throw new DeskError('report_usage');
   $clean=array_intersect_key($row,array_flip(['day','purpose','model','rate_date']));foreach(['requests','retries','incomplete','input_tokens','output_tokens','cached_tokens','cache_write_tokens'] as $key){$n=$row[$key]??null;if(!is_int($n)||$n<0||$n>1000000000000)throw new DeskError('report_usage');$clean[$key]=$n;}
   if($clean['cached_tokens']+$clean['cache_write_tokens']>$clean['input_tokens']||$clean['retries']>$clean['requests']||$clean['incomplete']>$clean['requests'])throw new DeskError('report_usage');
   $key=implode(':',[$clean['day'],$clean['purpose'],$clean['model'],$clean['rate_date']]);if(isset($keys[$key]))throw new DeskError('report_usage');$keys[$key]=true;
   $clean['calculated_usd']=$clean['model']==='gpt-6-luna'&&$clean['rate_date']!=='unknown'?number_format((($clean['input_tokens']-$clean['cached_tokens']-$clean['cache_write_tokens'])*0.10+$clean['cached_tokens']*0.01+$clean['cache_write_tokens']*0.125+$clean['output_tokens']*0.50)/1000000,12,'.',''):null;$rows[]=$clean;
  }
  $playbook=[];if(!empty($value['playbook'])){$playbook=['fetched_at'=>self::stamp($value['playbook']['fetched_at']??null),'revision'=>self::text($value['playbook']['revision']??'',200)];}
  return ['generated_at'=>self::stamp($value['generated_at']??null),'schedule_active'=>$value['schedule_active'],'activated_at'=>self::stamp($value['activated_at']??null),'accounts'=>$accounts,'playbook'=>$playbook,'usage'=>['since'=>$since,'rows'=>$rows,'unknown_requests'=>$usage['unknown_requests']]];
 }
 public function system():array{
  $events=[];foreach($this->pending()['feedback'] as $e)$events[]=['card_id'=>$e['card_id'],'subject'=>$e['subject'],'status'=>$e['status'],'created_at'=>$e['created_at'],'processed_at'=>$e['processed_at']??null,'explanation'=>$e['explanation']??''];
  return ['report'=>$this->meta('report'),'runs'=>$this->reviewRuns(),'feedback'=>$events,'remaining'=>$this->pending()['remaining']];
 }
 public function board():array{$cards=[];foreach($this->query('SELECT payload FROM cards')->fetchAll(PDO::FETCH_COLUMN)as $p)$cards[]=$this->open($p);usort($cards,fn($a,$b)=>strcmp($b['date'],$a['date']));return ['cards'=>$cards,'labels'=>$this->labels,'capabilities'=>['publish_revisions'=>true,'reporting'=>true],'run'=>$this->meta('run'),'runs'=>$this->reviewRuns(),'checkpoints'=>$this->meta('checkpoints')??[],'progress'=>$this->progress($cards),'report'=>$this->meta('report')];}
 public function publish(array $a):array{
  $report=isset($a['report'])?$this->reporting($a['report']):null;
  if(($a['report_only']??false)===true){if($report===null||($a['cards']??null)!==[]||isset($a['run']))throw new DeskError('report_only');return $this->mutate($a['operation_id']??'',$a,function()use($report){$old=$this->meta('report');if(!$old||strtotime($report['generated_at'])>=strtotime($old['generated_at']))$this->setMeta('report',$report);return ['report_saved'=>true];});}
  $cards=$a['cards']??[];if(!is_array($cards)||!array_is_list($cards)||count($cards)>200)throw new DeskError('batch_limit');$normalized=[];$ids=[];foreach($cards as $c){if(!is_array($c))throw new DeskError('card');$n=$this->normalize($c);if(isset($ids[$n['id']]))throw new DeskError('duplicate_card');$ids[$n['id']]=true;$normalized[]=$n;}
  $expected=$a['expected_revisions']??null;if($expected!==null){if(!is_array($expected)||count($expected)!==count($normalized))throw new DeskError('expected_revisions');foreach($normalized as $n)if(!array_key_exists($n['id'],$expected)||!is_int($expected[$n['id']])||$expected[$n['id']]<0)throw new DeskError('expected_revisions');}
  $run=$a['run']??null;if(!is_array($run)||!in_array($run['status']??'',['success','partial','error'],true))throw new DeskError('run');
  $details=isset($run['details'])?$this->runDetails($run['details']):null;
  $coverage=$run['coverage']??[];if(!is_array($coverage)||count($coverage)>2)throw new DeskError('coverage');foreach($coverage as $acct=>$status)if(!in_array($acct,['mijatovic@gmail.com','milan@mijatovic.com'],true)||!in_array($status,['complete','partial','error','unknown'],true))throw new DeskError('coverage');
  $summary=self::text($run['summary']??'',1500,true);$checkpoints=$run['checkpoints']??[];if(!is_array($checkpoints))throw new DeskError('checkpoints');foreach($checkpoints as $acct=>$stamp){if(!in_array($acct,['mijatovic@gmail.com','milan@mijatovic.com'],true)||!is_string($stamp)||strtotime($stamp)===false||strlen($stamp)>40)throw new DeskError('checkpoints');}if($run['status']==='error'&&count($checkpoints))throw new DeskError('checkpoints');
  return $this->mutate($a['operation_id']??'',$a,function()use($normalized,$run,$summary,$checkpoints,$expected,$report,$details,$coverage){$now=gmdate('c');$created=0;$updated=0;foreach($normalized as $n){$old=null;try{$old=$this->card($n['id']);}catch(DeskError $e){if($e->reason!=='not_found')throw $e;}
   if($expected!==null&&($old['revision']??0)!==$expected[$n['id']])throw new DeskError('conflict',409);
   if($old){$c=array_merge($old,$n);$c['attention_started_at']=$old['attention_started_at']??$old['reopened_at']??$old['date'];
    // An unattended review cannot quietly downgrade an unfinished request.
    if($old['state']==='open'&&$old['category']==='action')$c['category']='action';
    $contextKeys=['subject','description','reason','deadline','question'];$prior=array_intersect_key($old,array_flip($contextKeys));$next=array_intersect_key($n,array_flip($contextKeys));
    if($old['state']==='open'&&$prior!==$next){$history=$old['context_history']??[];$prior['saved_at']=$now;$history[]=$prior;$c['context_history']=$history;}
    $c['revision']=$old['revision']+1;$c['updated_at']=$now;if(($n['reopen_reason']??'')!==''&&$old['state']!=='open'){$c['state']='open';$c['reopened_at']=$now;$c['attention_started_at']=$now;}$updated++;}
   else{if((int)$this->query('SELECT COUNT(*) FROM cards')->fetchColumn()>=3000)throw new DeskError('capacity',409);$c=array_merge($n,['attention_started_at'=>$n['date'],'revision'=>1,'state'=>'open','user_category'=>null,'user_labels'=>null,'note'=>'','feedback_status'=>null,'created_at'=>$now,'updated_at'=>$now]);$created++;}$this->putCard($c);}
   $previous=$this->meta('run');$r=['status'=>$run['status'],'summary'=>$summary,'finished_at'=>$now,'last_success_at'=>$run['status']==='success'?$now:($previous['last_success_at']??null)];if($details!==null)$r['details']=$details;if($coverage)$r['coverage']=$coverage;$this->setMeta('run',$r);if($report!==null){$prior=$this->meta('report');if(!$prior||strtotime($report['generated_at'])>=strtotime($prior['generated_at']))$this->setMeta('report',$report);}$cp=array_merge($this->meta('checkpoints')??[],$checkpoints);$this->setMeta('checkpoints',$cp);return ['created'=>$created,'updated'=>$updated,'run'=>$r];});
 }
 public function feedback(array $a):array{
  $id=self::text($a['card_id']??'',64,true);$rev=$a['revision']??null;if(!is_int($rev))throw new DeskError('revision');$labels=isset($a['labels'])?$this->labelList($a['labels']):null;
  $state=$a['state']??'';$category=$a['category']??'';if(!in_array($state,['open','handled','dismissed'],true)||!in_array($category,['action','awareness'],true))throw new DeskError('state');$note=self::text($a['note']??'',8000);
  return $this->mutate($a['operation_id']??'',$a,function()use($id,$rev,$labels,$state,$category,$note){$c=$this->card($id);if($c['revision']!==$rev)throw new DeskError('conflict',409);
   $earned=$c['state']==='open'&&$state!=='open'&&!isset($c['decision_earned_at']);
   if($earned){$c['decision_started_at']=$c['attention_started_at']??$c['reopened_at']??$c['date'];$c['decision_earned_at']=gmdate('c');$c['decision_xp']=self::decisionXp($c,strtotime($c['decision_earned_at']));}
   $c['revision']++;$c['state']=$state;$c['user_category']=$category;$c['user_labels']=$labels;$c['note']=$note;$c['updated_at']=gmdate('c');$c['feedback_status']='pending';unset($c['feedback_explanation'],$c['feedback_processed_at']);$fid=bin2hex(random_bytes(16));$event=['id'=>$fid,'card_id'=>$id,'account'=>$c['account'],'thread_id'=>$c['thread_id'],'message_ids'=>$c['message_ids'],'subject'=>$c['subject'],'observed_labels'=>$c['labels'],'requested_labels'=>$labels,'note'=>$note,'state'=>$state,'category'=>$category,'created_at'=>$c['updated_at'],'status'=>'pending','card_revision'=>$c['revision']];$this->query('INSERT INTO feedback(id,card_id,payload) VALUES(?,?,?)',[$fid,$id,$this->seal($event)]);$c['latest_feedback_id']=$fid;$this->putCard($c);return ['card'=>$c,'feedback_id'=>$fid,'xp_earned'=>$earned?$c['decision_xp']:0,'progress'=>$this->board()['progress']];});
 }
 public function pending():array{$events=[];foreach($this->query('SELECT payload FROM feedback ORDER BY seq')->fetchAll(PDO::FETCH_COLUMN) as $v){$e=$this->open($v);if(in_array($e['status'],['pending','error'],true))$events[]=$e;}return ['feedback'=>array_slice($events,0,100),'remaining'=>max(0,count($events)-100)];}
 public function acknowledge(array $a):array{
  $id=self::text($a['feedback_id']??'',64,true);$status=$a['status']??'';if(!in_array($status,['applied','recorded','error','superseded'],true))throw new DeskError('status');$explanation=self::text($a['explanation']??'',3000,true);$actual=isset($a['actual_labels'])?$this->labelList($a['actual_labels']):null;
  return $this->mutate($a['operation_id']??'',$a,function()use($id,$status,$explanation,$actual){$v=$this->query('SELECT payload FROM feedback WHERE id=?',[$id])->fetchColumn();if($v===false)throw new DeskError('not_found',404);$e=$this->open($v);if(in_array($e['status'],['applied','recorded','superseded'],true))throw new DeskError('already_acknowledged',409);if($status==='applied'&&($e['requested_labels']===null||$actual===null))throw new DeskError('verification_required');if($status==='applied'){ $x=$e['requested_labels'];$y=$actual;sort($x);sort($y);if($x!==$y)throw new DeskError('verification_mismatch',409);}$e['status']=$status;$e['explanation']=$explanation;$e['actual_labels']=$actual;$e['processed_at']=gmdate('c');$this->query('UPDATE feedback SET payload=? WHERE id=?',[$this->seal($e),$id]);$c=$this->card($e['card_id']);if(($c['latest_feedback_id']??'')===$id){$c['feedback_status']=$status;$c['feedback_explanation']=$explanation;$c['feedback_processed_at']=$e['processed_at'];if($status==='applied')$c['labels']=$actual;$c['revision']++;$this->putCard($c);}return ['feedback'=>$e];});
 }
}
