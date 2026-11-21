#!/usr/bin/env python3
"""Prepare a code-only private-host archive. Does not copy credentials or enable jobs."""
import argparse
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tarfile

ROOT = Path(__file__).resolve().parents[1]


def build(root, commit):
    if not re.fullmatch('[0-9a-f]{40}', commit): raise ValueError('source_commit')
    paths = ['reviewer/' + name + '.py' for name in ['__init__', 'content', 'engine', 'google', 'main', 'model', 'state']]
    files = {}
    for name in paths:
        path = root / name
        if path.is_symlink() or not path.is_file(): raise ValueError('source_path')
        files[name] = path.read_bytes()
    files['requirements.txt'] = (root / 'scripts/hosted-reviewer-requirements.txt').read_bytes()
    manifest = {'source_commit': commit, 'files': {name: hashlib.sha256(value).hexdigest() for name, value in files.items()}}
    data = io.BytesIO()
    with gzip.GzipFile(fileobj=data, mode='wb', mtime=0) as compressed, tarfile.open(fileobj=compressed, mode='w') as archive:
        for name, raw in {**files, 'manifest.json': json.dumps(manifest, sort_keys=True).encode()}.items():
            info = tarfile.TarInfo(name)
            info.mode, info.mtime, info.size = 0o600, 0, len(raw)
            archive.addfile(info, io.BytesIO(raw))
    return data.getvalue(), manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-commit', required=True)
    args = parser.parse_args()
    raw, manifest = build(ROOT, args.source_commit)
    destination = ROOT / '.private/hosted-reviewer/reviewer-code.tar.gz'
    if destination.is_symlink(): raise ValueError('destination')
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'wb') as output: output.write(raw)
    print(json.dumps({'code_only': True, 'sha256': hashlib.sha256(raw).hexdigest(), 'files': len(manifest['files']),
                      'credentials_copied': False, 'cron_enabled': False}))


if __name__ == '__main__': main()
