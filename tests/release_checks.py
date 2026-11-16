"""Fictional release installation, destination refusal and rollback regression checks."""
from pathlib import Path
from unittest.mock import patch
import hashlib, io, json, runpy, sqlite3, subprocess, sys, tarfile, tempfile
ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'scripts/update-release-remote.py'
checks = 0

def check(value, message):
    global checks
    assert value, message
    checks += 1

for scenario in ['success', 'owner', 'homepage', 'path', 'digest', 'rollback']:
    with tempfile.TemporaryDirectory() as folder:
        home = Path(folder) / 'dh_6zwyjw'
        web = home / 'mijatovic.com'
        private = home / '.email-desk'
        dest = web / 'email-desk'
        dest.mkdir(parents=True)
        (private / 'server').mkdir(parents=True)
        (private / 'state').mkdir()
        (web / 'index.html').write_bytes(b'fictional homepage')
        (private / 'config.php').write_bytes(b'fictional private config')
        with sqlite3.connect(private / 'state/desk.sqlite') as db:
            db.execute('create table saved (value text)')
            db.execute("insert into saved values ('fictional durable state')")
        before = (private / 'state/desk.sqlite').read_bytes()
        files = {name: ('new ' + name).encode() for name in ['public/index.html', 'public/app.js', 'public/styles.css', 'public/theme.js', 'public/.htaccess', 'public/api.php', 'server/Store.php', 'server/bootstrap.php', 'server/bridge.php', 'server/labels.json', 'public/assets/demo.png']}
        for name in files:
            target = dest / name[7:] if name.startswith('public/') else private / name
            if name not in ['public/theme.js', 'public/assets/demo.png']:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(('old ' + name).encode())
        if scenario == 'path':
            files['public/../config.php'] = b'forbidden'
        manifest = {'version': '0.2.0', 'files': {n: hashlib.sha256(b).hexdigest() for n, b in files.items()}}
        if scenario == 'digest':
            manifest['files']['public/app.js'] = '0' * 64
        archive = private / 'release.tar.gz'
        with tarfile.open(archive, 'w:gz') as tf:
            for name, data in {'manifest.json': json.dumps(manifest).encode(), **files}.items():
                member = tarfile.TarInfo(name); member.size = len(data); tf.addfile(member, io.BytesIO(data))
        digest = hashlib.sha256((web / 'index.html').read_bytes()).hexdigest()
        old_replace = Path.replace
        def replace(path, target):
            if scenario == 'rollback' and Path(target) == dest / 'app.js':
                raise OSError('Fictional interrupted install')
            return old_replace(path, target)
        expected_error = scenario != 'success'
        try:
            with patch.object(Path, 'home', return_value=home if scenario != 'owner' else Path(folder) / 'wrong'), patch.object(sys, 'argv', [str(SCRIPT), str(archive), 'wrong' if scenario == 'homepage' else digest]), patch('subprocess.run', return_value=subprocess.CompletedProcess([], 0)), patch.object(Path, 'replace', replace):
                runpy.run_path(str(SCRIPT), run_name='__main__')
            check(not expected_error, 'Expected release refusal')
        except (RuntimeError, OSError):
            check(expected_error, 'Unexpected installation failure')
        check((private / 'state/desk.sqlite').read_bytes() == before, 'Database must remain byte-identical')
        check((private / 'config.php').read_bytes() == b'fictional private config', 'Credentials untouched')
        check((web / 'index.html').read_bytes() == b'fictional homepage', 'Homepage untouched')
        check((dest / 'app.js').read_bytes() == (b'new public/app.js' if scenario == 'success' else b'old public/app.js'), 'Code installed or restored')
        if scenario == 'success':
            backup = next((private / 'releases').iterdir())
            check((backup / 'server/Store.php').read_bytes() == b'old server/Store.php', 'Private prior code retained')
            with sqlite3.connect(backup / 'desk.sqlite') as db:
                check(db.execute('select value from saved').fetchone()[0] == 'fictional durable state', 'Consistent SQLite snapshot retained')
        if scenario == 'rollback':
            check((private / 'server/Store.php').read_bytes() == b'old server/Store.php', 'Earlier installed server code rolled back')
            check(not (dest / 'theme.js').exists(), 'No new incomplete release file retained')
print(str(checks) + ' release installation, refusal, preservation and rollback checks passed.')
