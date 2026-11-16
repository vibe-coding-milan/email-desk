"""Fictional GitHub deployment contract, forced-command and bootstrap checks."""
from pathlib import Path
from unittest.mock import patch
import contextlib,hashlib,importlib.util,io,json,os,runpy,sqlite3,subprocess,sys,tarfile,tempfile
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from release_bundle import build,FIXED
spec=importlib.util.spec_from_file_location('receiver',ROOT/'scripts/receive-release.py');receiver=importlib.util.module_from_spec(spec);spec.loader.exec_module(receiver)
checks=0

def check(value,message):
 global checks
 assert value,message
 checks+=1

def rejects(fn):
 try:fn()
 except (ValueError,RuntimeError,tarfile.TarError):return True
 return False

commit='a'*40;raw,manifest=build(ROOT,commit)
check(receiver.inspect(raw,commit)==manifest,'valid bounded bundle')
check(build(ROOT,commit)[0]==raw,'bundle deterministic for safe retries')
check(set(manifest['files']).issuperset(FIXED),'all fixed app code included')
check(not any('.private/'in n or n.endswith('.sqlite') for n in manifest['files']),'no private state packaged')
check(rejects(lambda:receiver.inspect(raw,'b'*40)),'different commit refused')
check(rejects(lambda:receiver.inspect(b'x'*(receiver.MAX_ARCHIVE+1),commit)),'compressed archive limit')

def malformed(kind):
 out=io.BytesIO()
 with tarfile.open(fileobj=out,mode='w:gz')as archive:
  member=tarfile.TarInfo('demo')
  if kind=='link':member.type=tarfile.SYMTYPE;member.linkname='../config.php';archive.addfile(member)
  elif kind=='size':member.size=receiver.MAX_EXPANDED+1;archive.addfile(member,io.BytesIO(b'x'*member.size))
  elif kind=='duplicates':archive.addfile(member);archive.addfile(member)
  else:
   for i in range(130):member=tarfile.TarInfo(str(i));archive.addfile(member)
 return out.getvalue()
for kind in ['link','size','duplicates','members']:check(rejects(lambda:receiver.inspect(malformed(kind),commit)),'reject '+kind)

with tempfile.TemporaryDirectory()as folder:
 home=Path(folder)/'dh_6zwyjw';web=home/'mijatovic.com';private=home/'.email-desk';deployment=private/'deployment'
 (web/'email-desk').mkdir(parents=True);(private/'state').mkdir(parents=True);(private/'server').mkdir();deployment.mkdir()
 (web/'index.html').write_bytes(b'fictional homepage');(private/'config.php').write_bytes(b'fictional secret config')
 with sqlite3.connect(private/'state/desk.sqlite')as db:db.execute('CREATE TABLE saved (value TEXT)');db.execute("INSERT INTO saved VALUES ('fictional durable feedback')")
 before=(private/'state/desk.sqlite').read_bytes();guard=hashlib.sha256(b'fictional homepage').hexdigest()
 (deployment/'config.json').write_text(json.dumps({'homepage_sha256':guard,'php_binary':'/usr/bin/php'}));(deployment/'update-release.py').write_bytes((ROOT/'scripts/update-release-remote.py').read_bytes())
 stdin=type('Input',(),{'buffer':io.BytesIO(raw)})()
 def run(args,**kwargs):
  if args[0]=='php':return subprocess.CompletedProcess(args,0,stdout='',stderr='')
  capture=io.StringIO()
  with patch.object(sys,'argv',args[1:]),contextlib.redirect_stdout(capture):runpy.run_path(args[1],run_name='__main__')
  return subprocess.CompletedProcess(args,0,stdout=capture.getvalue(),stderr='')
 with patch.object(Path,'home',return_value=home),patch.object(sys,'stdin',stdin),patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':'email-desk-release '+commit}),patch('subprocess.run',side_effect=run),contextlib.redirect_stdout(io.StringIO())as out:
  receiver.main()
 receipt=json.loads(out.getvalue());check(receipt['updated'] and receipt['commit']==commit,'matching durable receipt')
 count=len(list((private/'releases').iterdir()))
 with patch.object(Path,'home',return_value=home),patch.object(sys,'stdin',type('Input',(),{'buffer':io.BytesIO(raw)})()),patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':'email-desk-release '+commit}),contextlib.redirect_stdout(io.StringIO())as again:receiver.main()
 check(json.loads(again.getvalue())==receipt and len(list((private/'releases').iterdir()))==count,'identical retry deduplicated without another install or backup')
 check((private/'state/desk.sqlite').read_bytes()==before,'live database preserved')
 check((private/'config.php').read_bytes()==b'fictional secret config','credentials preserved')
 check((web/'index.html').read_bytes()==b'fictional homepage','root homepage preserved')
 check((web/'email-desk/app.js').read_bytes()==(ROOT/'public/app.js').read_bytes(),'app deployed')
 check(not list(private.glob('github-release-*.tar.gz')),'staging archive moved into private recovery release')
 with patch.object(Path,'home',return_value=home),patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':'email-desk-release-status'}),contextlib.redirect_stdout(io.StringIO())as out:receiver.main()
 check(json.loads(out.getvalue())==receipt,'restricted receipt read-back')
 with patch.object(Path,'home',return_value=home),patch.dict(os.environ,{'SSH_ORIGINAL_COMMAND':'bash'}):check(rejects(receiver.main),'arbitrary shell command denied')
 (web/'index.html').write_bytes(b'wrong site');check(rejects(lambda:receiver.destination(home)),'wrong homepage denied');(web/'index.html').write_bytes(b'fictional homepage')
 check(rejects(lambda:receiver.destination(Path(folder)/'wrong')),'wrong owner denied')

# Bootstrap refuses a financial/wrong owner and preserves every pre-existing key/state.
for wrong in [False,True]:
 with tempfile.TemporaryDirectory()as folder:
  home=Path(folder)/('wrong'if wrong else'dh_6zwyjw');web=home/'mijatovic.com';private=home/'.email-desk';ssh=home/'.ssh'
  (web/'email-desk').mkdir(parents=True);(private/'state').mkdir(parents=True);ssh.mkdir();(web/'index.html').write_bytes(b'fictional homepage');(private/'config.php').write_bytes(b'fictional config');(private/'state/desk.sqlite').write_bytes(b'fictional DB');(ssh/'authorized_keys').write_text('fictional existing reviewer key\n')
  payload={'public_key':'ssh-ed25519 '+__import__('base64').b64encode(b'fictional deployment key').decode()+' email-desk-github-deploy','homepage_sha256':hashlib.sha256(b'fictional homepage').hexdigest(),'files':{'receive.py':(ROOT/'scripts/receive-release.py').read_text(),'update-release.py':(ROOT/'scripts/update-release-remote.py').read_text()}}
  code=(ROOT/'scripts/install-github-deploy.py').read_text().replace('payload=DEPLOYMENT_PAYLOAD','payload='+repr(payload))
  with patch.object(Path,'home',return_value=home),patch('shutil.which',return_value='/usr/bin/php'),patch('subprocess.run',return_value=subprocess.CompletedProcess([],0)),contextlib.redirect_stdout(io.StringIO()):
   refused=rejects(lambda:exec(compile(code,'bootstrap','exec'),{}))
  check(refused==wrong,'bootstrap owner guard')
  old=(ssh/'authorized_keys').read_text();check(old.startswith('fictional existing reviewer key\n'),'reviewer access preserved')
  if not wrong:check('restrict,command='in old and 'receive.py'in old,'new key forced command and forwarding restriction')
  check((private/'state/desk.sqlite').read_bytes()==b'fictional DB','bootstrap database untouched')
print(str(checks)+' GitHub packaging, receiver, identity, preservation and bootstrap checks passed.')
