"""Regression checks: refuse the wrong hosting user or a mismatched live homepage."""
from pathlib import Path
from unittest.mock import patch
import tempfile,hashlib
source=Path(__file__).resolve().parents[1].joinpath('scripts/provision-domain.py').read_text()
checks=0
with tempfile.TemporaryDirectory()as d:
 root=Path(d);home=root/'dh_6zwyjw';web=home/'mijatovic.com';web.mkdir(parents=True);(web/'index.html').write_text('fictional homepage')
 cases=[(root/'wrong-user',{'homepage_sha256':'x'},'Unexpected domain account'),(home,{'homepage_sha256':'x'},'Live homepage does not match destination')]
 for target,payload,message in cases:
  with patch.object(Path,'home',return_value=target):
   try:exec(compile(source,'provision-domain.py','exec'),{'BOOTSTRAP_PAYLOAD':payload});raise AssertionError('Expected refusal')
   except RuntimeError as e:assert str(e)==message;checks+=1
  assert not(home/'.email-desk').exists();checks+=1
 payload={'homepage_sha256':hashlib.sha256((web/'index.html').read_bytes()).hexdigest()};(home/'.email-desk').mkdir()
 with patch.object(Path,'home',return_value=home):
  try:exec(compile(source,'provision-domain.py','exec'),{'BOOTSTRAP_PAYLOAD':payload});raise AssertionError('Expected refusal')
  except RuntimeError as e:assert 'already exists'in str(e);checks+=1
print(str(checks)+' deployment destination guards passed.')
