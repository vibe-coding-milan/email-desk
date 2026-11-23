"""Bounded read-only release verification; security/content failures never retry."""
import hashlib,json,socket,ssl,time,urllib.error,urllib.parse,urllib.request
ORIGIN='https://mijatovic.com'
RETRY_STATUS={429,500,502,503,504}
class VerificationError(RuntimeError):pass
def validate_url(url):
 parsed=urllib.parse.urlsplit(url)
 if parsed.scheme!='https' or parsed.hostname!='mijatovic.com' or parsed.port not in (None,443) or parsed.username or parsed.password:
  raise VerificationError('Unexpected public verification URL or redirect')

class SameOriginHTTPS(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):
  validate_url(newurl)
  return super().redirect_request(req,fp,code,msg,headers,newurl)

def request(url,check,expected,*,digest=None,deadline=None,opener=None,sleep=time.sleep,clock=time.monotonic,log=print):
 validate_url(url)
 deadline=clock()+180 if deadline is None else deadline
 opener=opener or urllib.request.build_opener(SameOriginHTTPS())
 for attempt in range(1,4):
  remaining=deadline-clock()
  if remaining<=0:raise VerificationError('Public verification time budget exhausted at '+check)
  start=clock();log(json.dumps({'phase':'public_verification','check':check,'attempt':attempt,'state':'requesting'}),flush=True)
  try:
   req=urllib.request.Request(url,headers={'User-Agent':'EmailDesk-Release-Verification/1.0','Cache-Control':'no-cache'})
   try:response=opener.open(req,timeout=min(12,remaining))
   except urllib.error.HTTPError as e:response=e
   with response:
    status=response.code
    if status in RETRY_STATUS:raise urllib.error.HTTPError(url,status,'Temporary HTTP response',response.headers,None)
    if status not in expected:raise VerificationError('Unexpected HTTP '+str(status)+' at '+check)
    if digest is not None:
     actual=hashlib.sha256();size=0
     while True:
      chunk=response.read(65536)
      if not chunk:break
      size+=len(chunk)
      if size>24*1024*1024 or clock()>deadline:raise VerificationError('Response limit exceeded at '+check)
      actual.update(chunk)
     if actual.hexdigest()!=digest:raise VerificationError('Content hash mismatch at '+check)
   log(json.dumps({'phase':'public_verification','check':check,'attempt':attempt,'status':status,'elapsed_ms':round((clock()-start)*1000),'state':'verified'}),flush=True)
   return
  except (urllib.error.URLError,OSError) as e:
   reason=e.reason if isinstance(e,urllib.error.URLError) else e
   if isinstance(reason,ssl.SSLError):raise VerificationError('TLS verification failed at '+check) from e
   if isinstance(e,urllib.error.HTTPError) and e.code not in RETRY_STATUS:raise
   if not isinstance(e,urllib.error.HTTPError) and not isinstance(reason,(TimeoutError,ConnectionError,socket.gaierror,OSError)):
    raise VerificationError('Non-transient request failure at '+check) from e
   log(json.dumps({'phase':'public_verification','check':check,'attempt':attempt,'state':'connection_failed','error':'http_'+str(e.code) if isinstance(e,urllib.error.HTTPError) else type(reason).__name__}),flush=True)
   if attempt==3:
    raise VerificationError('Public verification incomplete at '+check+' after 3 attempts; installation is already confirmed. No re-upload attempted.') from e
   delay=min((1,3)[attempt-1],max(0,deadline-clock()))
   sleep(delay)
