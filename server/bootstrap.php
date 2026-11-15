<?php
declare(strict_types=1);
require_once __DIR__.'/Store.php';
function desk_config():array{
 $file=getenv('EMAIL_DESK_CONFIG')?:dirname(__DIR__,2).'/.email-desk/config.php';
 if(!is_file($file))throw new DeskError('not_configured',503);$c=require $file;
 if(!is_array($c)||empty($c['enabled']))throw new DeskError('not_configured',503);
 $key=base64_decode($c['encryption_key']??'',true);if($key===false||strlen($key)!==32)throw new DeskError('configuration',503);$c['key']=$key;return $c;
}
function desk_store(array $c):DeskStore{return new DeskStore($c['state_directory'],$c['key']);}
