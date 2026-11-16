#!/usr/bin/env python3
"""Prepare a reviewed one-time host bootstrap and local secret files. No upload."""
from pathlib import Path
import base64,json,subprocess
root=Path(__file__).resolve().parents[1];private=root/'.private';key=private/'github_deploy_ed25519'
private.mkdir(exist_ok=True,mode=0o700)
if not key.exists():subprocess.run(['ssh-keygen','-q','-t','ed25519','-N','','-C','email-desk-github-deploy','-f',str(key)],check=True,capture_output=True)
key.chmod(0o600)
pub=key.with_suffix('.pub').read_text().strip()
if pub.split()[-1]!='email-desk-github-deploy':raise RuntimeError('Existing key is not the dedicated deployment key')
reviewer=private/'reviewer_ed25519.pub'
if reviewer.exists() and pub.split()[1]==reviewer.read_text().split()[1]:raise RuntimeError('Never reuse the reviewer key for deployment')
c=json.loads((private/'connection.json').read_text())
if c['user']!='dh_6zwyjw':raise RuntimeError('Expected verified domain account')
guard=(private/'homepage-before.sha256').read_text().strip()
payload={'public_key':pub,'homepage_sha256':guard,'files':{'receive.py':(root/'scripts/receive-release.py').read_text(),'update-release.py':(root/'scripts/update-release-remote.py').read_text()}}
bootstrap=(root/'scripts/install-github-deploy.py').read_text().replace('payload=DEPLOYMENT_PAYLOAD','payload='+repr(payload))
folder=private/'github-actions-secrets';folder.mkdir(mode=0o700,exist_ok=True)
known=subprocess.run(['ssh-keygen','-F',c['host'],'-f',c['known_hosts_file']],capture_output=True,text=True,check=True).stdout
known='\n'.join(l for l in known.splitlines() if l and not l.startswith('#'))+'\n'
for name,value in {'EMAIL_DESK_DEPLOY_HOST':c['host'],'EMAIL_DESK_DEPLOY_USER':c['user'],'EMAIL_DESK_DEPLOY_KEY':key.read_text(),'EMAIL_DESK_KNOWN_HOSTS':known,'EMAIL_DESK_HOMEPAGE_SHA256':guard}.items():
 target=folder/name;target.write_text(value);target.chmod(0o600)
for name,text in {'github-deploy-bootstrap.py':bootstrap,'github-deploy-bootstrap-command.txt':'python3 -c "import base64;exec(compile(base64.b64decode(\''+base64.b64encode(bootstrap.encode()).decode()+'\'),\'github-deploy-bootstrap.py\',\'exec\'))"'}.items():
 target=private/name;target.write_text(text);target.chmod(0o600)
print('Prepared dedicated deployment key, private Actions secret files and guarded one-time host bootstrap. Nothing installed or uploaded.')
