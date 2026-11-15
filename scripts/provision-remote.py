"""Executed over the owner's existing SSH connection; credentials arrive only on stdin."""
import sys,os,json,tarfile,tempfile,subprocess,secrets,base64,shlex,shutil
from pathlib import Path
head=json.loads(sys.stdin.buffer.readline());home=Path.home();web=home/'mijatovic.com';dest=web/'email-desk';private=home/'.email-desk'
if not web.is_dir() or web.is_symlink() or dest.is_symlink() or private.is_symlink():raise RuntimeError('Unexpected destination')
if dest.exists() and not private.joinpath('config.php').is_file():raise RuntimeError('Destination already exists without Email Desk configuration')
private.mkdir(mode=0o700,exist_ok=True);private.chmod(0o700)
for folder in ['state','state/sessions']:
 (private/folder).mkdir(mode=0o700,exist_ok=True);(private/folder).chmod(0o700)
config=private/'config.php'
if not config.exists():
 hashed=subprocess.run(['php','-r','$d=json_decode(stream_get_contents(STDIN),true);echo password_hash($d["password"],PASSWORD_DEFAULT);'],input=json.dumps(head).encode(),capture_output=True,check=True).stdout.decode()
 c={'enabled':True,'origin':'https://mijatovic.com','state_directory':str(private/'state'),'password_hash':hashed,'encryption_key':base64.b64encode(secrets.token_bytes(32)).decode()}
 encoded=base64.b64encode(json.dumps(c).encode()).decode()
 fd=os.open(config,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'w')as f:f.write("<?php return json_decode(base64_decode('"+encoded+"'),true);\n")
with tempfile.TemporaryDirectory(prefix='email-desk-release-')as tmp:
 with tarfile.open(fileobj=sys.stdin.buffer,mode='r|gz')as archive:
  for member in archive:
   parts=Path(member.name).parts
   if member.islnk() or member.issym() or not member.isfile() or '..'in parts or member.name.startswith('/') or not parts or parts[0]not in ['public','server']:raise RuntimeError('Unexpected package member')
   target=Path(tmp)/member.name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(archive.extractfile(member).read())
 for source in Path(tmp).rglob('*.php'):subprocess.run(['php','-l',str(source)],check=True,stdout=subprocess.DEVNULL)
 if dest.exists():
  backup=private/'releases'/secrets.token_hex(10);backup.mkdir(parents=True,mode=0o700)
  shutil.copytree(dest,backup/'public');shutil.copytree(private/'server',backup/'server')
 (private/'server').mkdir(mode=0o700,exist_ok=True);dest.mkdir(mode=0o755,exist_ok=True)
 for folder,location,mode in [('server',private/'server',0o600),('public',dest,0o644)]:
  for source in (Path(tmp)/folder).rglob('*'):
   if source.is_file():
    path=location/source.relative_to(Path(tmp)/folder);path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_name(path.name+'.upload');temp.write_bytes(source.read_bytes());temp.chmod(mode);temp.replace(path)
sshdir=home/'.ssh';sshdir.mkdir(mode=0o700,exist_ok=True);auth=sshdir/'authorized_keys';existing=auth.read_text()if auth.exists()else''
public=head['public_key']
if not public.startswith('ssh-ed25519 ')or '\n'in public:raise RuntimeError('Invalid key')
forced='php '+shlex.quote(str(private/'server/bridge.php'))
line='restrict,command="'+forced.replace('"','\\"')+'" '+public
if public.split()[1]not in existing:
 with auth.open('a')as f:f.write(('\n'if existing and not existing.endswith('\n')else'')+line+'\n')
 auth.chmod(0o600)
print(json.dumps({'deployed':True,'config_backup':base64.b64encode(config.read_bytes()).decode()}))
