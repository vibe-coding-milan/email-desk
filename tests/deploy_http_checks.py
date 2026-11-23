"""Fictional transport and deployment phase tests. Never connects to production."""
from pathlib import Path
import contextlib,hashlib,importlib.util,io,json,os,socket,ssl,subprocess,sys,tempfile,unittest,urllib.error,urllib.request
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts'))
from deploy_http import request,VerificationError,SameOriginHTTPS
spec=importlib.util.spec_from_file_location('deploy_client',ROOT/'scripts/github-deploy.py');client=importlib.util.module_from_spec(spec);spec.loader.exec_module(client)
class Response(io.BytesIO):
 def __init__(self,body=b'correct',code=200):super().__init__(body);self.code=code;self.headers={}
class Opener:
 def __init__(self,*results):self.results=iter(results);self.calls=[]
 def open(self,req,timeout):
  self.calls.append((req,timeout));result=next(self.results)
  if isinstance(result,Exception):raise result
  return result
class PublicChecks(unittest.TestCase):
 def run_request(self,opener,**kwargs):
  self.delays=[];self.logs=[]
  request('https://mijatovic.com/','homepage',{200},opener=opener,sleep=self.delays.append,log=lambda message,**unused:self.logs.append(json.loads(message)),**kwargs)
 def test_network_and_dns_timeout_recover(self):
  for error in [TimeoutError(),urllib.error.URLError(socket.gaierror('temporary DNS')),ConnectionResetError()]:
   o=Opener(error,Response());self.run_request(o,digest=hashlib.sha256(b'correct').hexdigest());self.assertEqual(len(o.calls),2);self.assertEqual(self.delays,[1]);self.assertEqual(o.calls[0][1],12)
 def test_temporary_http_retries(self):
  for code in [429,500,502,503,504]:
   o=Opener(urllib.error.HTTPError('https://mijatovic.com/',code,'temporary',{},None),Response());self.run_request(o);self.assertEqual(len(o.calls),2);self.assertEqual(self.logs[1]['error'],'http_'+str(code))
 def test_exhaustion_cannot_report_verification_success(self):
  o=Opener(TimeoutError(),TimeoutError(),TimeoutError())
  with self.assertRaisesRegex(VerificationError,'incomplete.*3 attempts'):self.run_request(o)
  self.assertEqual(len(o.calls),3);self.assertEqual(self.delays,[1,3]);self.assertFalse(any(x.get('state')=='verified' for x in self.logs))
 def test_hash_mismatch_is_terminal(self):
  o=Opener(Response(b'wrong'))
  with self.assertRaisesRegex(VerificationError,'hash mismatch'):self.run_request(o,digest=hashlib.sha256(b'correct').hexdigest())
  self.assertEqual(len(o.calls),1);self.assertEqual(self.delays,[])
 def test_unexpected_200_cannot_pass_anonymous_protection(self):
  o=Opener(Response())
  with self.assertRaisesRegex(VerificationError,'HTTP 200'):request('https://mijatovic.com/email-desk/api.php?action=board','anonymous_board',{401},opener=o,log=lambda *a,**k:None)
  self.assertEqual(len(o.calls),1)
 def test_expected_denials_are_success(self):
  for code in [401,403,404]:
   o=Opener(urllib.error.HTTPError('https://mijatovic.com/',code,'protected',{},io.BytesIO(b'not logged')))
   request('https://mijatovic.com/','protected',{code},opener=o,log=lambda *a,**k:None);self.assertEqual(len(o.calls),1)
 def test_certificate_failure_never_retries(self):
  o=Opener(urllib.error.URLError(ssl.SSLCertVerificationError('untrusted certificate')))
  with self.assertRaisesRegex(VerificationError,'TLS'):self.run_request(o)
  self.assertEqual(len(o.calls),1);self.assertEqual(self.delays,[])
 def test_permanent_http_error_never_retries(self):
  for code in [401,403,404]:
   o=Opener(urllib.error.HTTPError('https://mijatovic.com/',code,'permanent',{},None))
   with self.assertRaisesRegex(VerificationError,'HTTP '+str(code)):self.run_request(o)
   self.assertEqual(len(o.calls),1);self.assertEqual(self.delays,[])
 def test_exhausted_budget_does_not_connect(self):
  o=Opener()
  with self.assertRaisesRegex(VerificationError,'budget'):self.run_request(o,deadline=0)
  self.assertEqual(o.calls,[])
 def test_redirects_cannot_downgrade_tls_or_leave_origin(self):
  handler=SameOriginHTTPS();req=urllib.request.Request('https://mijatovic.com/')
  for target in ['http://mijatovic.com/','https://evil.example/','https://mijatovic.com:444/','https://user@mijatovic.com/']:
   with self.assertRaises(VerificationError):handler.redirect_request(req,None,302,'',{},target)
  self.assertEqual(handler.redirect_request(req,None,302,'',{},'https://mijatovic.com/email-desk/').full_url,'https://mijatovic.com/email-desk/')
 def test_initial_url_cannot_leave_origin(self):
  with self.assertRaises(VerificationError):request('https://evil.example/','homepage',{200},opener=Opener())
 def test_oversized_body_cannot_pass(self):
  with self.assertRaisesRegex(VerificationError,'limit'):self.run_request(Opener(Response(b'x'*(24*1024*1024+1))),digest='0'*64)
class PhaseChecks(unittest.TestCase):
 def setUp(self):
  self.commit='a'*40;self.raw=b'fictional exact bundle';self.digest=hashlib.sha256(self.raw).hexdigest();self.manifest={'version':'0.7.0','files':{}}
  self.env={'GITHUB_REPOSITORY':'vibe-coding-milan/email-desk','GITHUB_REF':'refs/heads/main','GITHUB_SHA':self.commit,'EMAIL_DESK_EXPECTED_BUNDLE_SHA256':self.digest,'EMAIL_DESK_EXPECTED_MANIFEST_SHA256':client.manifest_digest(self.manifest),'EMAIL_DESK_HOMEPAGE_SHA256':'b'*64}
 def test_verify_phase_has_no_deployment_key_ssh_or_github_token(self):
  with patch.dict(os.environ,self.env,clear=True),patch.object(sys,'argv',['deploy','--phase','verify']),patch.object(client,'build',return_value=(self.raw,self.manifest)),patch.object(client,'verify')as verify,patch.object(client.subprocess,'run',side_effect=AssertionError('SSH forbidden')),patch.object(client.urllib.request,'urlopen',side_effect=AssertionError('GitHub token forbidden')),contextlib.redirect_stdout(io.StringIO())as out:client.main()
  verify.assert_called_once_with(self.manifest);self.assertIn('Public verification passed',out.getvalue())
 def test_verify_wrong_source_fails_before_network(self):
  with patch.dict(os.environ,{**self.env,'EMAIL_DESK_EXPECTED_MANIFEST_SHA256':'0'*64},clear=True),patch.object(sys,'argv',['deploy','--phase','verify']),patch.object(client,'build',return_value=(self.raw,self.manifest)),patch.object(client,'verify')as verify:
   with self.assertRaisesRegex(RuntimeError,'does not match'):client.main()
   verify.assert_not_called()
 def test_platform_compression_difference_retains_exact_manifest_binding(self):
  with patch.dict(os.environ,self.env,clear=True),patch.object(sys,'argv',['deploy','--phase','verify']),patch.object(client,'build',return_value=(b'different gzip encoding',self.manifest)),patch.object(client,'verify')as verify,contextlib.redirect_stdout(io.StringIO())as out:client.main()
  verify.assert_called_once_with(self.manifest);self.assertIn('Source manifest matched',out.getvalue())
 def test_changed_private_source_manifest_fails_before_network(self):
  changed={**self.manifest,'files':{'server/Store.php':'0'*64}}
  with patch.dict(os.environ,self.env,clear=True),patch.object(sys,'argv',['deploy','--phase','verify']),patch.object(client,'build',return_value=(self.raw,changed)),patch.object(client,'verify')as verify:
   with self.assertRaisesRegex(RuntimeError,'does not match'):client.main()
   verify.assert_not_called()
 def test_verification_failure_reports_confirmed_install_and_raises(self):
  with patch.dict(os.environ,self.env,clear=True),patch.object(sys,'argv',['deploy','--phase','verify']),patch.object(client,'build',return_value=(self.raw,self.manifest)),patch.object(client,'verify',side_effect=VerificationError('network')),contextlib.redirect_stdout(io.StringIO())as out:
   with self.assertRaises(VerificationError):client.main()
  self.assertIn('Installation was confirmed',out.getvalue());self.assertNotIn('verification passed',out.getvalue())
 def test_install_recovers_lost_acknowledgement_without_second_upload(self):
  self.check_lost_ack(False)
 def test_install_timeout_reads_receipt_without_second_upload(self):
  self.check_lost_ack(True)
 def check_lost_ack(self,timeout):
  receipt={'updated':True,'commit':self.commit,'bundle_sha256':self.digest,'release':'arcade-20261123T213049073186Z'};calls=[]
  def run(args,**unused):
   calls.append(args)
   if timeout and len(calls)==1:raise subprocess.TimeoutExpired(args,180)
   return subprocess.CompletedProcess(args,255 if len(calls)==1 else 0,stdout=json.dumps(receipt))
  env={**self.env,'GITHUB_TOKEN':'fictional-token','EMAIL_DESK_DEPLOY_HOST':'host.example','EMAIL_DESK_DEPLOY_USER':'dh_6zwyjw','EMAIL_DESK_DEPLOY_KEY':'fictional-key','EMAIL_DESK_KNOWN_HOSTS':'fictional-pinned-host'}
  with tempfile.TemporaryDirectory()as directory:
   output=Path(directory)/'output';env['GITHUB_OUTPUT']=str(output)
   with patch.dict(os.environ,env,clear=True),patch.object(sys,'argv',['deploy','--phase','install']),patch.object(client,'build',return_value=(self.raw,self.manifest)),patch.object(client,'verify',side_effect=AssertionError('public verify belongs in next job')),patch.object(client.urllib.request,'urlopen',return_value=io.BytesIO(json.dumps({'object':{'sha':self.commit}}).encode())),patch.object(client.subprocess,'run',side_effect=run),contextlib.redirect_stdout(io.StringIO())as out:client.main()
   self.assertIn('installed=true',output.read_text());self.assertIn('bundle_sha256='+self.digest,output.read_text());self.assertNotIn('fictional-key',out.getvalue())
  self.assertEqual(sum(c[-1]=='email-desk-release '+self.commit for c in calls),1);self.assertEqual([c[-1] for c in calls[1:]],['email-desk-release-status']*2)
 def test_workflow_separates_install_and_verification_without_key_expansion(self):
  source=(ROOT/'.github/workflows/deploy.yml').read_text();verify=source.split('  verify:\n')[1]
  self.assertIn('runs-on: macos-15',verify);self.assertIn('EMAIL_DESK_EXPECTED_MANIFEST_SHA256',verify);self.assertIn('--phase install',source);self.assertIn('--phase verify',verify);self.assertIn('needs: install',verify)
  for name in ['EMAIL_DESK_DEPLOY_KEY','EMAIL_DESK_DEPLOY_USER','EMAIL_DESK_KNOWN_HOSTS','GITHUB_TOKEN']:self.assertNotIn(name,verify)
if __name__=='__main__':unittest.main()
