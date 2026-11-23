#!/usr/bin/env python3
"""Read-only public HTTPS diagnostics. No grants, cookies, keys or response bodies."""
import hashlib,json,os,platform,socket,subprocess,time,urllib.request
from pathlib import Path
from release_bundle import build
HOST='mijatovic.com'
def probe():
 raw,manifest=build(Path(__file__).resolve().parents[1],os.environ.get('GITHUB_SHA','0'*40))
 print(json.dumps({'os':platform.system(),'python':platform.python_version(),'bundle_sha256':hashlib.sha256(raw).hexdigest(),'manifest_sha256':hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()}),flush=True)
 try:addresses=sorted({(socket.AddressFamily(family).name,address[0]) for family,_,_,_,address in socket.getaddrinfo(HOST,443,type=socket.SOCK_STREAM)})
 except OSError as e:addresses=[type(e).__name__]
 print(json.dumps({'host':HOST,'dns':addresses,'proxy_kinds':sorted(urllib.request.getproxies())}),flush=True)
 for family,path in [([], '/'),(['-4'],'/'),(['-6'],'/'),([], '/email-desk/')]:
  args=['curl',*family,'--silent','--show-error','--location','--max-redirs','3','--proto','=https','--proto-redir','=https','--connect-timeout','6','--max-time','10','--output','/dev/null','--write-out','%{json}','https://'+HOST+path]
  r=subprocess.run(args,capture_output=True,text=True,timeout=13)
  try:details=json.loads(r.stdout);details={key:details.get(key) for key in ['http_code','remote_ip','time_namelookup','time_connect','time_appconnect','time_starttransfer','time_total','url_effective','ssl_verify_result']}
  except ValueError:details={}
  print(json.dumps({'transport':'curl','family':family or ['auto'],'path':path,'exit':r.returncode,'details':details,'error':r.stderr.strip()[:300]}),flush=True)
 for agent in [None,'EmailDesk-Release-Verification/1.0']:
  start=time.monotonic()
  try:
   request=urllib.request.Request('https://'+HOST+'/',headers={'User-Agent':agent} if agent else {})
   with urllib.request.urlopen(request,timeout=8) as response:result={'status':response.status,'url':response.geturl()};response.read(1)
  except Exception as e:result={'error':type(e).__name__+': '+str(e)[:250]}
  print(json.dumps({'transport':'urllib','agent':agent or 'default','elapsed':round(time.monotonic()-start,3),**result}),flush=True)
if __name__=='__main__':probe()
