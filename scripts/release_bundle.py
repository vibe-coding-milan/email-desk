"""Deterministic code-only release bundles. Never walks private or state folders."""
from pathlib import Path, PurePosixPath
import gzip,hashlib,io,json,re,tarfile
FIXED={'public/index.html','public/app.js','public/styles.css','public/theme.js','public/.htaccess','public/api.php','server/Store.php','server/bootstrap.php','server/bridge.php','server/labels.json'}
ASSET_SUFFIXES={'.svg','.png','.ttf','.txt','.md'}

def allowed(name):
 p=PurePosixPath(name)
 return not p.is_absolute() and '..' not in p.parts and str(p)==name and (name in FIXED or (name.startswith('public/assets/') and p.suffix in ASSET_SUFFIXES))

def build(root, commit):
 root=Path(root).resolve()
 if not re.fullmatch('[0-9a-f]{40}',commit):raise ValueError('A full commit SHA is required')
 files=sorted(FIXED | {p.relative_to(root).as_posix() for p in (root/'public/assets').rglob('*') if p.is_file()})
 content={}
 for name in files:
  p=root/name
  if not allowed(name) or any(a.is_symlink() for a in [p,*p.parents] if a!=root.parent):raise ValueError('Non-regular or unapproved release path: '+name)
  if not p.is_file():raise ValueError('Missing release file: '+name)
  content[name]=p.read_bytes()
 manifest={'version':json.loads((root/'package.json').read_text())['version'],'commit':commit,'files':{n:hashlib.sha256(b).hexdigest() for n,b in content.items()}}
 output=io.BytesIO()
 with gzip.GzipFile(fileobj=output,mode='wb',mtime=0) as compressed, tarfile.open(fileobj=compressed,mode='w') as archive:
  for name,raw in {'manifest.json':json.dumps(manifest,sort_keys=True).encode(),**content}.items():
   member=tarfile.TarInfo(name);member.size=len(raw);member.mode=0o600;member.mtime=0;archive.addfile(member,io.BytesIO(raw))
 return output.getvalue(),manifest
