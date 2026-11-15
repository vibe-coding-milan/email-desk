#!/usr/bin/env python3
"""Run PHP checks in an isolated temporary directory on the existing PHP host."""
from pathlib import Path
import shlex,subprocess,tarfile,io,sys
root=Path(__file__).resolve().parents[1]
config=Path('/Users/milan/Documents/Financial Projection/.local-backups/deployment-config.env')
v={}
for line in config.read_text().splitlines():
 a=shlex.split(line)
 if a and a[0]=='export':
  k,value=a[1].split('=',1);v[k]=value
ssh=['ssh','-T','-i',str(Path(v['DREAMHOST_KEY_FILE']).expanduser()),'-F','/dev/null','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(Path.home()/'.ssh/known_hosts'),v['DREAMHOST_USER']+'@'+v['DREAMHOST_HOST']]
buf=io.BytesIO()
with tarfile.open(fileobj=buf,mode='w:gz') as tf:
 for folder in ['server','tests','public']:
  for p in (root/folder).rglob('*'):
   if p.is_file():tf.add(p,arcname=str(p.relative_to(root)))
cmd="set -eu; folder=$(mktemp -d /tmp/email-desk-check.XXXXXX); trap 'rm -rf \"$folder\"' EXIT; tar -xzf - -C \"$folder\"; cd \"$folder\"; find server public tests -name '*.php' -exec php -l {} \\; ; php tests/store.php; python3 tests/api_checks.py"
r=subprocess.run(ssh+[cmd],input=buf.getvalue(),capture_output=True)
sys.stdout.buffer.write(r.stdout);sys.stderr.buffer.write(r.stderr);sys.exit(r.returncode)
