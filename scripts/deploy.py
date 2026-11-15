#!/usr/bin/env python3
"""Publish only Email Desk; preserve root website, private keys and stored feedback."""
from pathlib import Path
import os,sys,shlex,subprocess,json,tarfile,io,secrets,base64
root=Path(__file__).resolve().parents[1];private=root/'.private';private.mkdir(mode=0o700,exist_ok=True);private.chmod(0o700)
legacy=Path('/Users/milan/Documents/Financial Projection/.local-backups/deployment-config.env');config={}
for line in legacy.read_text().splitlines():
 a=shlex.split(line)
 if a and a[0]=='export':
  k,v=a[1].split('=',1);config[k]=v
ssh=['ssh','-T','-i',str(Path(config['DREAMHOST_KEY_FILE']).expanduser()),'-F','/dev/null','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(Path.home()/'.ssh/known_hosts'),config['DREAMHOST_USER']+'@'+config['DREAMHOST_HOST']]
keyfile=private/'reviewer_ed25519'
if not keyfile.exists():subprocess.run(['ssh-keygen','-t','ed25519','-N','','-C','email-desk-reviewer','-f',str(keyfile)],check=True,stdout=subprocess.DEVNULL)
pwfile=private/'owner-login.txt'
if not pwfile.exists():
 fd=os.open(pwfile,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w')as f:f.write('Email Desk\nhttps://mijatovic.com/email-desk/\n\nPassword: '+secrets.token_urlsafe(24)+'\n\nSave this in your password manager. Keep this file private.\n')
password=pwfile.read_text().split('Password: ',1)[1].splitlines()[0]
buf=io.BytesIO()
with tarfile.open(fileobj=buf,mode='w:gz')as tf:
 for folder in ['public','server']:
  for p in (root/folder).rglob('*'):
   if p.is_file()and '__pycache__'not in p.parts:tf.add(p,arcname=str(p.relative_to(root)))
 tf.add(root/'docs/Email-Organization-Playbook.md',arcname='server/playbook.md')
payload=json.dumps({'password':password,'public_key':keyfile.with_suffix('.pub').read_text().strip()}).encode()+b'\n'+buf.getvalue()
remote=(root/'scripts/provision-remote.py').read_text()
r=subprocess.run(ssh+['python3 -c '+shlex.quote(remote)],input=payload,capture_output=True)
if r.returncode:
 sys.stderr.buffer.write(r.stderr);sys.exit(r.returncode)
result=json.loads(r.stdout);backup=private/'server-config-backup.php';backup.write_bytes(base64.b64decode(result.pop('config_backup')));backup.chmod(0o600)
connection={'host':config['DREAMHOST_HOST'],'user':config['DREAMHOST_USER'],'key_file':str(keyfile),'known_hosts_file':str(Path.home()/'.ssh/known_hosts')}
p=private/'connection.json';p.write_text(json.dumps(connection));p.chmod(0o600)
print('Published to https://mijatovic.com/email-desk/. Restricted reviewer key installed. Private recovery files saved locally.')
