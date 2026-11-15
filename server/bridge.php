<?php
declare(strict_types=1);
// Installed outside the web root. The dedicated SSH key is forced to this command.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/bootstrap.php';
try{
 $raw=stream_get_contents(STDIN,524288+1);if(strlen($raw)>524288)throw new DeskError('payload_limit');$a=json_decode($raw,true,64,JSON_THROW_ON_ERROR);if(!is_array($a))throw new DeskError('request');$config=desk_config();$s=desk_store($config);
 $result=match($a['action']??''){
  'board'=>$s->board(),
  'publish'=>$s->publish($a),
  'feedback'=>$s->pending(),
  'acknowledge'=>$s->acknowledge($a),
  'playbook'=>['content'=>file_get_contents(__DIR__.'/playbook.md'),'master'=>'Google Doc; this is a reference snapshot.'],
  default=>throw new DeskError('action'),
 };
 echo json_encode(['ok'=>true,'result'=>$result],JSON_THROW_ON_ERROR|JSON_UNESCAPED_UNICODE)."\n";
}catch(Throwable $e){fwrite(STDERR,json_encode(['ok'=>false,'error'=>$e instanceof DeskError?$e->reason:'internal'])."\n");exit(1);}
