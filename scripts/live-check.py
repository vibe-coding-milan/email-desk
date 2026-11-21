#!/usr/bin/env python3
"""Read-only live acceptance checks, including a temporary owner session."""
from pathlib import Path
import urllib.request,urllib.error,http.cookiejar,json,hashlib,subprocess
root=Path(__file__).resolve().parents[1];base='https://mijatovic.com/email-desk/';checks=[]
def check(v,name):
 if not v:raise RuntimeError(name)
 checks.append(name)
cookies=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookies))
def req(action,body=None,csrf=None,origin='https://mijatovic.com'):
 h={}
 if body is not None:h={'Content-Type':'application/json','Origin':origin,'X-CSRF-Token':csrf or ''}
 request=urllib.request.Request(base+'api.php?action='+action,data=json.dumps(body).encode()if body is not None else None,headers=h)
 try:r=opener.open(request,timeout=25)
 except urllib.error.HTTPError as e:r=e
 return r.status,json.loads(r.read()),r.headers
with urllib.request.urlopen('https://mijatovic.com/',timeout=20)as r:home=hashlib.sha256(r.read()).hexdigest()
check(home==(root/'.private/homepage-before.sha256').read_text().strip(),'Existing homepage unchanged')
with urllib.request.urlopen(base,timeout=20)as r:
 check(r.status==200,'Board page served');h=r.headers;check("frame-ancestors 'none'"in h.get('Content-Security-Policy',''),'Apache CSP active');check(h.get('X-Robots-Tag')=='noindex, nofollow, noarchive','Search indexing disabled');check('no-store'in h.get('Cache-Control',''),'Page no-store')
status,p,h=req('session');check(status==200 and not p['authenticated'],'Anonymous session');csrf=p['csrf'];cookie=h.get('Set-Cookie','').lower();check(all(x in cookie for x in ['secure','httponly','samesite=strict','path=/email-desk/']),'Secure private session cookie')
check(req('system')[0]==401,'Unauthenticated system report denied');check(req('board')[0]==401,'Unauthenticated board denied');check(req('playbook')[0]==401,'Unauthenticated playbook denied')
password=(root/'.private/owner-login.txt').read_text().split('Password: ',1)[1].splitlines()[0]
status,p,h=req('login',{'password':password},csrf);check(status==200,'Live owner sign-in');csrf=p['csrf'];status,p,h=req('board');check(status==200 and isinstance(p['result']['cards'],list),'Authenticated board read');check('no-store'in h.get('Cache-Control',''),'API no-store');check(p['result'].get('capabilities',{}).get('reporting') is True,'Reporting-capable Store active');check(req('system')[0]==200,'Authenticated system report readable')
check(req('feedback',{},csrf,origin='https://example.invalid')[0]==403,'Cross-origin mutations denied');check(req('feedback',{},'bad-csrf')[0]==403,'Missing or wrong CSRF denied')
status,p,h=req('playbook');check(status==200 and 'Version 1.1' in p['result']['content'],'Private playbook reference readable');check(req('logout',{},csrf)[0]==200,'Live sign-out');check(req('board')[0]==401,'Signed-out access denied');check(req('system')[0]==401,'Signed-out system report denied')
for path in ['.htaccess','server/Store.php','.private/owner-login.txt','../.email-desk/config.php']:
 try:r=urllib.request.urlopen(base+path,timeout=20);status=r.status;r.close()
 except urllib.error.HTTPError as e:status=e.code
 check(status in [403,404],'Public access denied: '+path)
r=subprocess.run(['python3',str(root/'scripts/bridge.py')],input='{"action":"board"}',capture_output=True,text=True,timeout=70);check(r.returncode==0 and json.loads(r.stdout)['ok'],'Restricted reviewer bridge board read')
# Ask the SSH connection to run an unrelated harmless command: the forced command must replace it.
c=json.loads((root/'.private/connection.json').read_text());ssh=['ssh','-T','-i',c['key_file'],'-F','/dev/null','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+c['known_hosts_file'],c['user']+'@'+c['host'],'echo RESTRICTED_KEY_ESCAPE_TEST']
r=subprocess.run(ssh,input='{"action":"feedback"}',capture_output=True,text=True,timeout=30);check(r.returncode==0 and json.loads(r.stdout)['ok'] and 'RESTRICTED_KEY_ESCAPE_TEST'not in r.stdout,'Reviewer key cannot run arbitrary shell commands')
print(json.dumps({'passed':len(checks),'checks':checks},indent=2))
(root/'.private/live-check-results.json').write_text(json.dumps({'passed':len(checks),'checks':checks},indent=2))
