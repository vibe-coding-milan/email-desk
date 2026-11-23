#!/usr/bin/env python3
"""GitHub runner client. Credentials come only from Actions secrets, never Git."""
from pathlib import Path
import hashlib,json,os,re,subprocess,tempfile,urllib.request,urllib.error
from release_bundle import build
ROOT=Path(__file__).resolve().parents[1]
BASE='https://mijatovic.com/email-desk/'

def manifest_digest(manifest):return hashlib.sha256(json.dumps(manifest,sort_keys=True).encode()).hexdigest()

def summary(message):
 print(message,flush=True)
 if os.environ.get('GITHUB_STEP_SUMMARY'):
  with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as stream:stream.write(message+'\n')

def verify(manifest):
 from deploy_http import request
 import time
 deadline=time.monotonic()+180
 request('https://mijatovic.com/','homepage',{200},digest=os.environ['EMAIL_DESK_HOMEPAGE_SHA256'],deadline=deadline)
 for name,digest in manifest['files'].items():
  if not name.startswith('public/') or name.endswith('.php') or name=='public/.htaccess':continue
  request(BASE+name[7:],'asset:'+name[7:],{200},digest=digest,deadline=deadline)
 request(BASE+'api.php?action=board','anonymous_board',{401},deadline=deadline)
 for name in ['.private/owner-login.txt','server/Store.php']:
  request(BASE+name,'private_path:'+name,{403,404},deadline=deadline)

def output(name,value):
 if not re.fullmatch('[a-z][a-z0-9_]*',name) or '\n' in value or '\r' in value:raise RuntimeError('Invalid workflow output')
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as stream:stream.write(name+'='+value+'\n')


def main():
 import argparse
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--phase',choices=['all','install','verify'],default='all');phase=parser.parse_args().phase
 if os.environ.get('GITHUB_REPOSITORY')!='vibe-coding-milan/email-desk' or os.environ.get('GITHUB_REF')!='refs/heads/main':raise RuntimeError('Deployment is restricted to this repository main branch')
 commit=os.environ['GITHUB_SHA']
 if not re.fullmatch('[0-9a-f]{40}',commit):raise RuntimeError('Invalid commit')
 raw,manifest=build(ROOT,commit)
 if phase=='verify':
  expected=os.environ.get('EMAIL_DESK_EXPECTED_MANIFEST_SHA256','')
  if not re.fullmatch('[0-9a-f]{64}',expected) or expected!=manifest_digest(manifest):raise RuntimeError('Verification source does not match confirmed installation manifest')
  if os.environ.get('EMAIL_DESK_EXPECTED_BUNDLE_SHA256')!=hashlib.sha256(raw).hexdigest():summary('Source manifest matched; compressed representation differs across runner platforms. Installation already verified the exact transmitted archive and receipt.')
  try:verify(manifest)
  except Exception:
   summary('Installation was confirmed. Public verification failed or remains incomplete; see the named check and attempts above. No re-upload or rollback was attempted.')
   raise
  summary('Public verification passed for `'+commit+'`: homepage, all static hashes, anonymous board denial and private-path protection.')
  return
 request=urllib.request.Request('https://api.github.com/repos/vibe-coding-milan/email-desk/git/ref/heads/main',headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/vnd.github+json'})
 with urllib.request.urlopen(request,timeout=30) as response:head=json.load(response)['object']['sha']
 if head!=commit:
  output('installed','false');summary('Skipped superseded commit; only the current main head can deploy.');return
 names=['EMAIL_DESK_DEPLOY_HOST','EMAIL_DESK_DEPLOY_USER','EMAIL_DESK_DEPLOY_KEY','EMAIL_DESK_KNOWN_HOSTS','EMAIL_DESK_HOMEPAGE_SHA256']
 if any(not os.environ.get(n,'').strip() for n in names):raise RuntimeError('One-time deployment bootstrap/Actions secrets are not configured. See docs/GITHUB_DEPLOYMENT.md.')
 host=os.environ[names[0]];user=os.environ[names[1]]
 if user!='dh_6zwyjw' or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]+',host):raise RuntimeError('Wrong domain deployment account')
 if not re.fullmatch('[0-9a-f]{64}',os.environ[names[4]]):raise RuntimeError('Invalid homepage guard')
 with tempfile.TemporaryDirectory(prefix='email-desk-deploy-') as folder:
  folder=Path(folder);key=folder/'deploy-key';known=folder/'known-hosts'
  key.write_text(os.environ[names[2]].rstrip()+'\n');key.chmod(0o600);known.write_text(os.environ[names[3]].rstrip()+'\n');known.chmod(0o600)
  args=['ssh','-T','-F','/dev/null','-i',str(key),'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(known),'-o','ConnectTimeout=20',user+'@'+host]
  try:result=subprocess.run(args+['email-desk-release '+commit],input=raw,capture_output=True,timeout=180)
  except subprocess.TimeoutExpired:result=None
  if result is None or result.returncode:
   # A lost SSH acknowledgement must be reconciled before another upload.
   try:result=subprocess.run(args+['email-desk-release-status'],capture_output=True,timeout=30)
   except subprocess.TimeoutExpired:raise RuntimeError('Deployment outcome unconfirmed; receipt read timed out. No automatic re-upload attempted.') from None
   if result.returncode:raise RuntimeError('Deployment outcome unconfirmed; could not read the private receipt. No automatic re-upload attempted.')
  receipt=json.loads(result.stdout)
  if receipt.get('bundle_sha256')!=hashlib.sha256(raw).hexdigest():raise RuntimeError('Matching release payload has not been acknowledged')
  if receipt.get('updated') is not True or receipt.get('commit')!=commit:raise RuntimeError('Missing matching deployment acknowledgement')
  if not re.fullmatch(r'arcade-[0-9]{8}T[0-9]{6,12}Z',receipt.get('release','')):raise RuntimeError('Invalid release receipt identity')
  status=subprocess.run(args+['email-desk-release-status'],capture_output=True,timeout=30,check=True)
  if json.loads(status.stdout)!=receipt:raise RuntimeError('Deployment receipt could not be verified')
 output('installed','true');output('bundle_sha256',receipt['bundle_sha256']);output('manifest_sha256',manifest_digest(manifest));output('release',receipt['release'])
 summary('Installation confirmed: Email Desk '+manifest['version']+' from `'+commit+'`, release `'+receipt['release']+'`. Exact bundle and durable receipt matched. Public verification is a separate required phase.')
 if phase=='all':
  try:verify(manifest)
  except Exception:
   summary('Installation confirmed; public verification failed or remains incomplete. No re-upload or rollback was attempted.')
   raise
  summary('Public verification passed: homepage, public hashes and anonymous/private-path protection.')

if __name__=='__main__':main()
