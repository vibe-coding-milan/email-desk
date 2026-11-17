#!/usr/bin/env python3
"""Host-installed forced command. Accepts one bounded release, never a shell/SFTP."""
from pathlib import Path
import fcntl,hashlib,io,json,os,re,subprocess,sys,tarfile,tempfile
MAX_ARCHIVE=8*1024*1024
MAX_EXPANDED=24*1024*1024

def inspect(raw,commit):
 if not raw or len(raw)>MAX_ARCHIVE:raise ValueError('archive_size')
 total=0;seen=set();manifest=None
 with tarfile.open(fileobj=io.BytesIO(raw),mode='r|gz') as archive:
  for member in archive:
   if not member.isfile() or member.name in seen or len(seen)>=128:raise ValueError('archive_members')
   seen.add(member.name);total+=member.size
   if member.size<0 or total>MAX_EXPANDED:raise ValueError('expanded_size')
   if member.name=='manifest.json':
    if member.size>65536:raise ValueError('manifest_size')
    manifest=json.load(archive.extractfile(member))
 if not isinstance(manifest,dict) or manifest.get('commit')!=commit:raise ValueError('commit_mismatch')
 if not re.fullmatch(r'\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?',manifest.get('version','')):raise ValueError('version')
 return manifest

def destination(home):
 private=home/'.email-desk';web=home/'mijatovic.com'
 if home.name!='dh_6zwyjw' or any(p.is_symlink() for p in [web,web/'email-desk',private,private/'deployment']):raise ValueError('domain_owner')
 config=json.loads((private/'deployment/config.json').read_text())
 if hashlib.sha256((web/'index.html').read_bytes()).hexdigest()!=config['homepage_sha256']:raise ValueError('homepage')
 if not(private/'config.php').is_file() or not(private/'state/desk.sqlite').is_file():raise ValueError('installation')
 return private,config

def main():
 command=os.environ.get('SSH_ORIGINAL_COMMAND','')
 match=re.fullmatch(r'email-desk-release ([0-9a-f]{40})',command)
 if not match and command!='email-desk-release-status':raise ValueError('command_denied')
 private,config=destination(Path.home())
 with (private/'deployment/lock').open('a') as lock:
  os.chmod(lock.name,0o600)
  try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
  except BlockingIOError:raise ValueError('release_in_progress')
  if not match:
   receipt=private/'deployment/receipt.json'
   print(receipt.read_text() if receipt.is_file() else json.dumps({'ready':True,'deployed':False}));return
  raw=sys.stdin.buffer.read(MAX_ARCHIVE+1);manifest=inspect(raw,match[1])
  bundle_digest=hashlib.sha256(raw).hexdigest();saved=private/'deployment/receipt.json';current=private/'current-release.json'
  if saved.is_file():
   previous=json.loads(saved.read_text())
   if previous.get('commit')==match[1]:
    if previous.get('bundle_sha256')!=bundle_digest:raise ValueError('commit_payload_changed')
    installed=json.loads(current.read_text()) if current.is_file() else {}
    def target(name):return private/name if name.startswith('server/') else private.parent/'mijatovic.com/email-desk'/name[7:]
    if installed.get('commit')==match[1] and all(target(n).is_file() and hashlib.sha256(target(n).read_bytes()).hexdigest()==d for n,d in manifest['files'].items()):
     print(json.dumps(previous));return
  fd,name=tempfile.mkstemp(prefix='github-release-',suffix='.tar.gz',dir=private)
  archive=Path(name)
  try:
   with os.fdopen(fd,'wb') as stream:stream.write(raw)
   env=dict(os.environ);env['PATH']=str(Path(config['php_binary']).parent)+':/usr/local/bin:/usr/bin:/bin'
   result=subprocess.run([sys.executable,str(private/'deployment/update-release.py'),str(archive),config['homepage_sha256']],capture_output=True,text=True,timeout=120,env=env)
   if result.returncode:raise ValueError('release_install_failed')
   outcome=json.loads(result.stdout)
   if outcome.get('updated') is not True or not re.fullmatch(r'arcade-[0-9]{8}T[0-9]{6,12}Z',outcome.get('release','')):raise ValueError('invalid_receipt')
   outcome['commit']=manifest['commit'];outcome['version']=manifest['version'];outcome['bundle_sha256']=bundle_digest
   archive.replace(private/'releases'/outcome['release']/'github-upload.tar.gz')
   receipt=private/'deployment/receipt.json';temp=receipt.with_suffix('.tmp');temp.write_text(json.dumps(outcome));temp.chmod(0o600);temp.replace(receipt)
   print(json.dumps(outcome))
  finally:
   if archive.exists():archive.unlink()

if __name__=='__main__':
 try:main()
 except Exception:print(json.dumps({'ok':False,'error':'deployment_refused_or_failed'}));sys.exit(1)
