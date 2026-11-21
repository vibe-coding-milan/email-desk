<?php
declare(strict_types=1);
ini_set('display_errors','0');
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: private, no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
require_once (getenv('EMAIL_DESK_SERVER') ?: dirname(__DIR__,2).'/.email-desk/server').'/bootstrap.php';
function respond(array $data,int $status=200):never{http_response_code($status);echo json_encode($data,JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE);exit;}
try{
 $config=desk_config();$action=$_GET['action']??'board';$method=$_SERVER['REQUEST_METHOD'];
 ini_set('session.use_strict_mode','1');session_name('__Secure-emaildesk');session_save_path($config['state_directory'].'/sessions');session_set_cookie_params(['lifetime'=>0,'path'=>'/email-desk/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);session_cache_limiter('');session_start();
 if(!isset($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(32));
 if($method==='POST'){
  if(($_SERVER['HTTP_ORIGIN']??'')!==$config['origin'])throw new DeskError('origin',403);
  if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new DeskError('csrf',403);
  if(!str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json'))throw new DeskError('content_type',415);
  $raw=file_get_contents('php://input',false,null,0,32769);if(strlen($raw)>32768)throw new DeskError('payload_limit',413);$a=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if(!is_array($a))throw new DeskError('request');
 }elseif($method!=='GET')throw new DeskError('method',405);
 if($action==='session'&&$method==='GET')respond(['ok'=>true,'authenticated'=>isset($_SESSION['owner'])&&($_SESSION['last_seen']??0)>time()-43200,'csrf'=>$_SESSION['csrf']]);
 if($action==='login'&&$method==='POST'){
  // One site owner; a shared lock prevents distributed requests racing the limiter.
  $f=fopen($config['state_directory'].'/login-limit.json','c+');if(!$f||!flock($f,LOCK_EX))throw new DeskError('temporary',503);chmod($config['state_directory'].'/login-limit.json',0600);
  $data=json_decode(stream_get_contents($f),true)??['start'=>time(),'count'=>0];if($data['start']<time()-900)$data=['start'=>time(),'count'=>0];
  if($data['count']>=10){flock($f,LOCK_UN);fclose($f);throw new DeskError('try_later',429);}
  $valid=is_string($a['password']??null)&&strlen($a['password'])<=500&&password_verify($a['password'],$config['password_hash']);$data['count']++;
  if($valid)$data=['start'=>time(),'count'=>0];rewind($f);ftruncate($f,0);fwrite($f,json_encode($data));fflush($f);flock($f,LOCK_UN);fclose($f);
  if(!$valid){usleep(250000);throw new DeskError('invalid_login',401);}session_regenerate_id(true);$_SESSION['owner']=true;$_SESSION['last_seen']=time();$_SESSION['csrf']=bin2hex(random_bytes(32));respond(['ok'=>true,'csrf'=>$_SESSION['csrf']]);
 }
 if(!isset($_SESSION['owner'])||($_SESSION['last_seen']??0)<time()-43200)throw new DeskError('sign_in',401);$_SESSION['last_seen']=time();
 if($action==='logout'&&$method==='POST'){$_SESSION=[];session_destroy();setcookie('__Secure-emaildesk','',['expires'=>time()-3600,'path'=>'/email-desk/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);respond(['ok'=>true]);}
 if($action==='board'&&$method==='GET')respond(['ok'=>true,'result'=>desk_store($config)->board()]);
 if($action==='system'&&$method==='GET')respond(['ok'=>true,'result'=>desk_store($config)->system()]);
 if($action==='feedback'&&$method==='POST')respond(['ok'=>true,'result'=>desk_store($config)->feedback($a)]);
 if($action==='playbook'&&$method==='GET')respond(['ok'=>true,'result'=>['content'=>file_get_contents((getenv('EMAIL_DESK_SERVER') ?: dirname(__DIR__,2).'/.email-desk/server').'/playbook.md'),'master'=>'Google Doc; reference snapshot.']]);
 throw new DeskError('not_found',404);
}catch(Throwable $e){respond(['ok'=>false,'error'=>$e instanceof DeskError?$e->reason:($e instanceof JsonException?'invalid_json':'temporary')],$e instanceof DeskError?$e->status:($e instanceof JsonException?400:503));}
