"""Bootstrap through the authenticated domain connection. No secret values in this source."""
from pathlib import Path
import sys,os,json,base64,secrets,subprocess,shutil,hashlib,tempfile
payload=BOOTSTRAP_PAYLOAD
home=Path.home();web=home/'mijatovic.com';dest=web/'email-desk';private=home/'.email-desk'
if home.name!='dh_6zwyjw' or web.is_symlink() or dest.is_symlink() or private.is_symlink():raise RuntimeError('Unexpected domain account')
if hashlib.sha256((web/'index.html').read_bytes()).hexdigest()!=payload['homepage_sha256']:raise RuntimeError('Live homepage does not match destination')
if dest.exists() or private.exists():raise RuntimeError('Email Desk already exists; use an explicit update path')
r=subprocess.run(['php','-r','echo json_encode(["sqlite"=>extension_loaded("pdo_sqlite"),"sodium"=>extension_loaded("sodium")]);'],capture_output=True,text=True,check=True)
if json.loads(r.stdout)!={'sqlite':True,'sodium':True}:raise RuntimeError('Missing PHP extensions')
private.mkdir(mode=0o700);(private/'server').mkdir(mode=0o700);(private/'state').mkdir(mode=0o700);(private/'state/sessions').mkdir(mode=0o700)
for name,content in payload['files'].items():
 parts=Path(name).parts
 if '..'in parts or Path(name).is_absolute()or parts[0]not in ['public','server']:raise RuntimeError('Package path')
 target=private/'release'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content);target.chmod(0o600)
for f in (private/'release').rglob('*.php'):subprocess.run(['php','-l',str(f)],capture_output=True,check=True)
password=secrets.token_urlsafe(24)
hashed=subprocess.run(['php','-r','echo password_hash(stream_get_contents(STDIN),PASSWORD_DEFAULT);'],input=password.encode(),capture_output=True,check=True).stdout.decode()
cfg={'enabled':True,'origin':'https://mijatovic.com','state_directory':str(private/'state'),'password_hash':hashed,'encryption_key':base64.b64encode(secrets.token_bytes(32)).decode()}
encoded=base64.b64encode(json.dumps(cfg).encode()).decode();config=private/'config.php';config.write_text("<?php return json_decode(base64_decode('"+encoded+"'),true);\n");config.chmod(0o600)
login=private/'owner-login.txt';login.write_text('Email Desk\nhttps://mijatovic.com/email-desk/\n\nPassword: '+password+'\n\nKeep this private and save it in your password manager.\n');login.chmod(0o600)
for folder,location,mode in [('server',private/'server',0o600),('public',dest,0o644)]:
 location.mkdir(mode=0o700 if folder=='server'else 0o755,exist_ok=True)
 for f in (private/'release'/folder).rglob('*'):
  if f.is_file():
   target=location/f.relative_to(private/'release'/folder);target.parent.mkdir(parents=True,exist_ok=True);f.chmod(mode);f.replace(target)
shutil.rmtree(private/'release')
ssh=home/'.ssh';ssh.mkdir(mode=0o700,exist_ok=True);ssh.chmod(0o700);auth=ssh/'authorized_keys';old=auth.read_text()if auth.exists()else'';pub=payload['public_key']
if not pub.startswith('ssh-ed25519 ')or'\n'in pub:raise RuntimeError('Public key')
if pub.split()[1]in old:raise RuntimeError('Review existing access line before installation')
line='restrict,command="php '+str(private/'server/bridge.php')+'" '+pub
with auth.open('a')as f:f.write(('\n'if old and not old.endswith('\n')else'')+line+'\n')
auth.chmod(0o600)
print(json.dumps({'installed':True,'homepage_matched':True,'restricted_key':True}))
