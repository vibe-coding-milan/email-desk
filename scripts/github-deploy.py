#!/usr/bin/env python3
"""GitHub runner client. Credentials come only from Actions secrets, never Git."""
from pathlib import Path
import hashlib,json,os,re,subprocess,tempfile,urllib.request,urllib.error
from release_bundle import build
ROOT=Path(__file__).resolve().parents[1]
BASE='https://mijatovic.com/email-desk/'

def verify(manifest):
 with urllib.request.urlopen('https://mijatovic.com/',timeout=30) as response:
  if hashlib.sha256(response.read()).hexdigest()!=os.environ['EMAIL_DESK_HOMEPAGE_SHA256']:raise RuntimeError('Homepage guard changed')
 for name,digest in manifest['files'].items():
  if not name.startswith('public/') or name.endswith('.php') or name=='public/.htaccess':continue
  with urllib.request.urlopen(BASE+name[7:],timeout=30) as response:
   if hashlib.sha256(response.read()).hexdigest()!=digest:raise RuntimeError('Published file hash mismatch: '+name)
 try:urllib.request.urlopen(BASE+'api.php?action=board',timeout=30)
 except urllib.error.HTTPError as response:
  if response.code!=401:raise RuntimeError('Anonymous board protection failed')
 else:raise RuntimeError('Anonymous board access was unexpectedly allowed')
 for name in ['.private/owner-login.txt','server/Store.php']:
  try:urllib.request.urlopen(BASE+name,timeout=30)
  except urllib.error.HTTPError as response:
   if response.code not in [403,404]:raise RuntimeError('Private path protection failed')
  else:raise RuntimeError('A private path became public')


def main():
 if os.environ.get('GITHUB_REPOSITORY')!='vibe-coding-milan/email-desk' or os.environ.get('GITHUB_REF')!='refs/heads/main':raise RuntimeError('Deployment is restricted to this repository main branch')
 commit=os.environ['GITHUB_SHA']
 if not re.fullmatch('[0-9a-f]{40}',commit):raise RuntimeError('Invalid commit')
 request=urllib.request.Request('https://api.github.com/repos/vibe-coding-milan/email-desk/git/ref/heads/main',headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/vnd.github+json'})
 with urllib.request.urlopen(request,timeout=30) as response:head=json.load(response)['object']['sha']
 if head!=commit:
  print('Skipped superseded commit; only the current main head can deploy.');return
 raw,manifest=build(ROOT,commit)
 names=['EMAIL_DESK_DEPLOY_HOST','EMAIL_DESK_DEPLOY_USER','EMAIL_DESK_DEPLOY_KEY','EMAIL_DESK_KNOWN_HOSTS','EMAIL_DESK_HOMEPAGE_SHA256']
 if any(not os.environ.get(n,'').strip() for n in names):raise RuntimeError('One-time deployment bootstrap/Actions secrets are not configured. See docs/GITHUB_DEPLOYMENT.md.')
 host=os.environ[names[0]];user=os.environ[names[1]]
 if user!='dh_6zwyjw' or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9.-]+',host):raise RuntimeError('Wrong domain deployment account')
 if not re.fullmatch('[0-9a-f]{64}',os.environ[names[4]]):raise RuntimeError('Invalid homepage guard')
 with tempfile.TemporaryDirectory(prefix='email-desk-deploy-') as folder:
  folder=Path(folder);key=folder/'deploy-key';known=folder/'known-hosts'
  key.write_text(os.environ[names[2]].rstrip()+'\n');key.chmod(0o600);known.write_text(os.environ[names[3]].rstrip()+'\n');known.chmod(0o600)
  args=['ssh','-T','-F','/dev/null','-i',str(key),'-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(known),'-o','ConnectTimeout=20',user+'@'+host]
  result=subprocess.run(args+['email-desk-release '+commit],input=raw,capture_output=True,timeout=180)
  if result.returncode:
   # A lost SSH acknowledgement must be reconciled before another upload.
   result=subprocess.run(args+['email-desk-release-status'],capture_output=True,timeout=30)
   if result.returncode:raise RuntimeError('Deployment outcome unconfirmed; could not read the private receipt. No automatic re-upload attempted.')
  receipt=json.loads(result.stdout)
  if receipt.get('bundle_sha256')!=hashlib.sha256(raw).hexdigest():raise RuntimeError('Matching release payload has not been acknowledged')
  if receipt.get('updated') is not True or receipt.get('commit')!=commit:raise RuntimeError('Missing matching deployment acknowledgement')
  status=subprocess.run(args+['email-desk-release-status'],capture_output=True,timeout=30,check=True)
  if json.loads(status.stdout)!=receipt:raise RuntimeError('Deployment receipt could not be verified')
 verify(manifest)
 print(json.dumps({'deployed':True,'commit':commit,'version':manifest['version'],'release':receipt['release'],'public_files_verified':sum(n.startswith('public/') and not n.endswith('.php') and n!='public/.htaccess' for n in manifest['files'])}))
 if os.environ.get('GITHUB_STEP_SUMMARY'):
  with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as stream:stream.write('Published Email Desk '+manifest['version']+' from `'+commit+'` to https://mijatovic.com/email-desk/. Public hashes, homepage and anonymous access protection verified.\n')

if __name__=='__main__':main()
