"""One-time bootstrap through an existing authorized domain-owner connection.

Inject DEPLOYMENT_PAYLOAD using prepare-github-deploy.py; no hosting password or
private key is included. Never run this using the financial-app domain account.
"""
from pathlib import Path
import base64,hashlib,json,os,shutil,subprocess,sys,tempfile
payload=DEPLOYMENT_PAYLOAD
home=Path.home();private=home/'.email-desk';web=home/'mijatovic.com';deployment=private/'deployment';ssh=home/'.ssh';auth=ssh/'authorized_keys'
if home.name!='dh_6zwyjw' or any(p.is_symlink() for p in [private,web,web/'email-desk',deployment,ssh,auth]):raise RuntimeError('Unexpected domain destination')
if not(private/'config.php').is_file() or not(private/'state/desk.sqlite').is_file():raise RuntimeError('Existing Email Desk required')
if hashlib.sha256((web/'index.html').read_bytes()).hexdigest()!=payload['homepage_sha256']:raise RuntimeError('Homepage guard mismatch')
public=payload['public_key'].strip();parts=public.split()
if len(parts)!=3 or parts[0]!='ssh-ed25519' or parts[2]!='email-desk-github-deploy' or '\n'in public:raise RuntimeError('Dedicated deployment public key required')
base64.b64decode(parts[1],validate=True)
python=str(Path(sys.executable).resolve());php=shutil.which('php')
if not php or any(c in python for c in ['"','\n',' ']):raise RuntimeError('CLI runtimes unavailable')
subprocess.run([php,'-r','exit(PHP_VERSION_ID >= 80200 ? 0 : 1);'],check=True,capture_output=True)
if set(payload['files'])!={'receive.py','update-release.py'}:raise RuntimeError('Bootstrap files refused')
for name,text in payload['files'].items():compile(text,name,'exec')
config=json.dumps({'homepage_sha256':payload['homepage_sha256'],'php_binary':php},sort_keys=True)
line='restrict,command="'+python+' '+str(deployment/'receive.py')+'" '+public
old=auth.read_text()if auth.exists()else''
if parts[1]in old and line not in old.splitlines():raise RuntimeError('Key already has different access; refusing to expand or replace it')
if deployment.exists():
 expected={**payload['files'],'config.json':config}
 if any(not(deployment/n).is_file() or (deployment/n).is_symlink() or (deployment/n).read_text()!=v for n,v in expected.items()) or line not in old.splitlines():raise RuntimeError('Deployment bootstrap already differs; review before updating')
 print(json.dumps({'ready':True,'already_installed':True}));sys.exit(0)
# Prepare the complete fixed receiver before authorizing its separate key.
deployment.mkdir(mode=0o700)
try:
 for name,text in {**payload['files'],'config.json':config}.items():
  target=deployment/name;target.write_text(text);target.chmod(0o600)
 ssh.mkdir(mode=0o700,exist_ok=True);ssh.chmod(0o700)
 (deployment/'authorized_keys.before').write_text(old);(deployment/'authorized_keys.before').chmod(0o600)
 with auth.open('a')as stream:stream.write(('\n'if old and not old.endswith('\n')else'')+line+'\n')
 auth.chmod(0o600)
except BaseException:
 # Before appending the key, a staged directory grants no access. Keep it private for inspection.
 raise
print(json.dumps({'ready':True,'dedicated_forced_command':True,'reviewer_key_unchanged':True,'homepage_matched':True}))
