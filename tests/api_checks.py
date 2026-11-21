from pathlib import Path
import os,json,base64,tempfile,subprocess,socket,urllib.request,urllib.error,time,secrets,datetime
root=Path(__file__).resolve().parents[1];checks=0
with tempfile.TemporaryDirectory(prefix='email-desk-http-')as d:
 state=Path(d)/'state';state.mkdir(mode=0o700);(state/'sessions').mkdir(mode=0o700)
 hashed=subprocess.run(['php','-r',"echo password_hash('fictional-test-password',PASSWORD_DEFAULT);"],capture_output=True,text=True,check=True).stdout
 cfg={'enabled':True,'origin':'https://mijatovic.com','state_directory':str(state),'password_hash':hashed,'encryption_key':base64.b64encode(os.urandom(32)).decode()}
 file=Path(d)/'config.php';file.write_text("<?php return json_decode(base64_decode('"+base64.b64encode(json.dumps(cfg).encode()).decode()+"'),true);");file.chmod(0o600)
 env={**os.environ,'EMAIL_DESK_CONFIG':str(file),'EMAIL_DESK_SERVER':str(root/'server')}
 sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
 server=subprocess.Popen(['php','-S','127.0.0.1:'+str(port),'-t',str(root/'public')],env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 cookie='';csrf=''
 def request(action,body=None,origin='https://mijatovic.com',token=None):
  global cookie
  headers={'Cookie':cookie}
  if body is not None:headers.update({'Content-Type':'application/json','Origin':origin,'X-CSRF-Token':csrf if token is None else token})
  req=urllib.request.Request('http://127.0.0.1:'+str(port)+'/api.php?action='+action,data=None if body is None else json.dumps(body).encode(),headers=headers)
  try:r=urllib.request.urlopen(req,timeout=10)
  except urllib.error.HTTPError as e:r=e
  h=r.headers.get('Set-Cookie')
  if h:cookie=h.split(';',1)[0]
  return r.status,json.loads(r.read()),r.headers
 def check(v,msg):
  global checks
  assert v,msg;checks+=1
 try:
  for i in range(50):
   try:status,p,h=request('session');break
   except OSError:time.sleep(.05)
  else:raise Exception('test server did not start')
  check(status==200 and not p['authenticated'],'anonymous session');csrf=p['csrf'];check('secure' in h['Set-Cookie'].lower() and 'httponly'in h['Set-Cookie'].lower() and 'samesite=strict'in h['Set-Cookie'].lower(),'cookie protections');check(h.get('Cache-Control')=='private, no-store','no shared cache');check(request('system')[0]==401,'private system reporting denied');check(request('board')[0]==401,'anonymous cannot read');check(request('playbook')[0]==401,'playbook private');check(request('login',{'password':'fictional-test-password'},origin='https://attacker.invalid')[0]==403,'cross origin login blocked');check(request('login',{'password':'fictional-test-password'},token='bad')[0]==403,'csrf blocked');check(request('login',{'password':'wrong'})[0]==401,'wrong password blocked')
  status,p,h=request('login',{'password':'fictional-test-password'});check(status==200,'owner login');csrf=p['csrf'];check(request('system')[0]==200,'authenticated system reporting');check(request('board')[1]['result']['cards']==[],'authenticated read')
  c={'account':'milan@mijatovic.com','thread_id':'abcdef1234567890','message_ids':['abcdef1234567890'],'subject':'Fictional committee meeting','sender':'Example office','date':(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=49)).isoformat(),'description':'A fictional request.','reason':'An example decision is needed.','category':'action','labels':['Manhattan Community Board 5']}
  req={'action':'publish','operation_id':secrets.token_hex(16),'cards':[c],'run':{'status':'success','summary':'Fictional test only'}}
  r=subprocess.run(['php',str(root/'server/bridge.php')],env=env,input=json.dumps(req),capture_output=True,text=True,check=True);check(json.loads(r.stdout)['ok'],'bridge publish')
  card=request('board')[1]['result']['cards'][0];a={'operation_id':secrets.token_hex(16),'card_id':card['id'],'revision':card['revision'],'labels':None,'note':'Fictional feedback','state':'handled','category':'action'}
  check(request('feedback',a,origin='https://attacker.invalid')[0]==403,'cross origin write blocked');check(request('feedback',a,token='bad')[0]==403,'write csrf blocked');status,p,h=request('feedback',a);check(status==200 and p['result']['card']['state']=='handled','browser feedback persisted');check(p['result']['xp_earned']==5 and p['result']['progress']['xp']==5,'server confirms late 5-XP award');check(request('feedback',a)[1]==p,'duplicate browser write deduplicated');a['operation_id']=secrets.token_hex(16);check(request('feedback',a)[0]==409,'stale browser write rejected');check(request('logout',{})[0]==200,'logout');check(request('board')[0]==401,'logged out cannot read')
  print(str(checks)+' HTTP authentication, CSRF, cookie and browser/API feedback checks passed.')
 finally:server.terminate();server.wait(timeout=10)
