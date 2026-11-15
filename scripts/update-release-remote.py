"""Guarded code-only release update. Run through the authenticated domain connection.

Usage: python3 update-release-remote.py ARCHIVE EXPECTED_HOMEPAGE_SHA256
The archive contains manifest.json and precisely its allowlisted code/assets.
No configuration, credential, playbook or live database is installed by this script.
"""
from pathlib import Path, PurePosixPath
import datetime, hashlib, json, os, shutil, sqlite3, subprocess, sys, tarfile, tempfile

home = Path.home()
web = home / 'mijatovic.com'
dest = web / 'email-desk'
private = home / '.email-desk'
archive = Path(sys.argv[1])
expected_homepage = sys.argv[2]
if home.name != 'dh_6zwyjw' or any(p.is_symlink() for p in [web, dest, private]) or not (private / 'config.php').is_file():
    raise RuntimeError('Unexpected domain installation')
if hashlib.sha256((web / 'index.html').read_bytes()).hexdigest() != expected_homepage:
    raise RuntimeError('Live homepage does not match destination')
if archive.parent != private or archive.is_symlink() or not (private / 'state/desk.sqlite').is_file():
    raise RuntimeError('Expected private archive and existing state')
fixed = {'public/index.html', 'public/app.js', 'public/styles.css', 'public/theme.js', 'public/.htaccess', 'server/Store.php'}

def allowed(name):
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or str(p) != name:
        return False
    return name in fixed or (name.startswith('public/assets/') and p.suffix in {'.svg', '.png', '.ttf', '.txt', '.md'})

def target(name):
    return (dest / name[7:]) if name.startswith('public/') else (private / name)

release = 'arcade-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
backup = private / 'releases' / release
backup.mkdir(parents=True, mode=0o700)
os.chmod(backup, 0o700)
installed = []
with tempfile.TemporaryDirectory(prefix='release-stage-', dir=private) as folder:
    stage = Path(folder)
    with tarfile.open(archive, 'r:gz') as tf:
        members = tf.getmembers()
        if len({m.name for m in members}) != len(members) or any(not m.isfile() for m in members):
            raise RuntimeError('Archive must contain unique regular files')
        manifest = json.load(tf.extractfile('manifest.json'))
        files = manifest['files']
        if not isinstance(files, dict) or not fixed.issubset(files) or not all(allowed(n) for n in files):
            raise RuntimeError('Release contains an unexpected file')
        if {m.name for m in members} != set(files) | {'manifest.json'}:
            raise RuntimeError('Archive and manifest differ')
        for name, digest in files.items():
            content = tf.extractfile(name).read()
            if hashlib.sha256(content).hexdigest() != digest:
                raise RuntimeError('File digest mismatch: ' + name)
            p = stage / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(content)
            # Refuse symlinks anywhere under either installation root.
            t = target(name)
            for ancestor in [t, *t.parents]:
                if ancestor == home:
                    break
                if ancestor.is_symlink():
                    raise RuntimeError('Symlink destination refused')
        subprocess.run(['php', '-l', str(stage / 'server/Store.php')], check=True, capture_output=True)
        # SQLite's backup API takes a consistent snapshot without reverting any live writes.
        with sqlite3.connect(private / 'state/desk.sqlite') as db, sqlite3.connect(backup / 'desk.sqlite') as snapshot:
            db.backup(snapshot)
        os.chmod(backup / 'desk.sqlite', 0o600)
        for name in files:
            t = target(name)
            if t.exists():
                b = backup / name
                b.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(t, b)
                os.chmod(b, 0o600)
        (backup / 'manifest.json').write_text(json.dumps(manifest, indent=2))
        (backup / 'homepage.sha256').write_text(expected_homepage)
        try:
            # Backend is backward-compatible. Install assets before the HTML entrypoint.
            order = sorted(files, key=lambda n: (n == 'public/index.html', n != 'server/Store.php', n))
            for name in order:
                t = target(name)
                t.parent.mkdir(parents=True, exist_ok=True)
                p = stage / name
                p.chmod(0o644 if name.startswith('public/') else 0o600)
                p.replace(t)
                installed.append(name)
            for name, digest in files.items():
                if hashlib.sha256(target(name).read_bytes()).hexdigest() != digest:
                    raise RuntimeError('Installed digest mismatch')
            if hashlib.sha256((web / 'index.html').read_bytes()).hexdigest() != expected_homepage:
                raise RuntimeError('Homepage changed during release')
        except BaseException:
            for name in reversed(installed):
                t = target(name)
                b = backup / name
                if b.is_file():
                    shutil.copy2(b, t)
                    t.chmod(0o644 if name.startswith('public/') else 0o600)
                else:
                    t.unlink()
            raise
        (private / 'current-release.json').write_text(json.dumps({'version': manifest['version'], 'release': release, 'files': files}))
        os.chmod(private / 'current-release.json', 0o600)
print(json.dumps({'updated': True, 'version': manifest['version'], 'release': release, 'files': len(files), 'homepage_matched': True, 'state_preserved': True, 'credentials_unchanged': True}))
