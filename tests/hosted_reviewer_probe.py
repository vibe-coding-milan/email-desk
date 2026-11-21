"""Fictional host identity/privacy checks; no SSH or credentials."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('probe', Path(__file__).resolve().parents[1] / 'scripts/hosted-reviewer-probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

with tempfile.TemporaryDirectory() as folder:
    home = Path(folder) / 'dh_6zwyjw'
    (home / 'mijatovic.com').mkdir(parents=True)
    homepage = home / 'mijatovic.com/index.html'
    homepage.write_bytes(b'fictional homepage')
    digest = hashlib.sha256(homepage.read_bytes()).hexdigest()
    for path, expected_digest, reason in [(home.parent / 'wrong', digest, 'Unexpected domain account'), (home, 'a' * 64, 'Homepage guard mismatch')]:
        try:
            probe.inspect(path, expected_digest)
            raise AssertionError('Guard did not refuse')
        except ValueError as error:
            assert str(error) == reason
    private = home / '.email-desk'
    private.mkdir()
    config = private / 'config.php'
    config.write_text('SECRET_FIXTURE_MUST_NOT_BE_READ')
    fake_cron = subprocess.CompletedProcess([], 0, 'MAILTO=private@example.test\n# private command\n0 1 * * * SECRET_CRON_FIXTURE\n', '')
    with patch.object(probe.shutil, 'which', return_value='/fake/command'), patch.object(probe, 'version', return_value='fixture version'), patch.object(probe.subprocess, 'run', return_value=fake_cron):
        result = probe.inspect(home, digest)
    raw = json.dumps(result)
    assert 'SECRET' not in raw and 'private@example.test' not in raw
    assert result['cron']['entry_count'] == 1
    assert result['config_present'] and result['activation_enabled'] is False
    assert config.read_text() == 'SECRET_FIXTURE_MUST_NOT_BE_READ'
    homepage.unlink()
    homepage.symlink_to(config)
    try:
        probe.inspect(home, digest)
        raise AssertionError('Symlink guard did not refuse')
    except ValueError as error:
        assert str(error) == 'Symlinked destination refused'

print('Host probe: wrong account, homepage, symlinks, secret redaction and no-activation checks passed.')
