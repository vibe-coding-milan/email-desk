#!/usr/bin/env python3
"""Restricted reviewer SSH bridge: request JSON on stdin, result JSON on stdout."""
from pathlib import Path
import subprocess,sys,json
root=Path(__file__).resolve().parents[1];c=json.loads((root/'.private/connection.json').read_text());raw=sys.stdin.buffer.read(524289)
if len(raw)>524288:raise SystemExit('Request exceeds 512 KB')
a=json.loads(raw)
if a.get('action')not in ['board','publish','feedback','acknowledge','playbook']:raise SystemExit('Unsupported action')
args=['ssh','-T','-i',c['key_file'],'-F','/dev/null','-o','IdentitiesOnly=yes','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+c['known_hosts_file'],'-o','ConnectTimeout=20',c['user']+'@'+c['host'],'email-desk-bridge']
r=subprocess.run(args,input=raw,capture_output=True,timeout=60)
if r.returncode:
 try:result=json.loads(r.stderr.decode().splitlines()[-1]);print(json.dumps(result))
 except Exception:print(json.dumps({'ok':False,'error':'bridge_connection_failed'}))
 sys.exit(1)
sys.stdout.buffer.write(r.stdout)
