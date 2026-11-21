"""Fictional usage projections: no network, mailbox, or real journal."""
import copy
import datetime as dt
from decimal import Decimal
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from reviewer.state import reporting_snapshot, UTC

class Reporting(unittest.TestCase):
 def snapshot(self,records,slots=None):
  return reporting_snapshot({'usage':records,'slots':slots or {},'accounts':{'mijatovic@gmail.com':{'cursor':'2026-11-21T16:00:00Z','done':{'PRIVATE':'NEVER EXPOSE'}}}}, {'activated_at':'2026-11-21T16:00:00Z','schedule_active':True},dt.datetime(2026,11,21,17,tzinfo=UTC))
 def record(self,**kw):
  return dict(at='2026-11-21T16:00:00Z',model='gpt-6-luna',request_id='PRIVATE-ID',purpose='manual',status='completed',usage=dict(input_tokens=1000,output_tokens=100,input_tokens_details=dict(cached_tokens=200,cache_write_tokens=300)),**kw)
 def test_disjoint_cost_and_private_allowlist(self):
  r=self.snapshot([self.record()]);row=r['usage']['rows'][0]
  self.assertEqual(Decimal(row['calculated_usd']),Decimal('0.0001395'))
  self.assertNotIn('PRIVATE',str(r));self.assertNotIn('done',str(r));self.assertIsNone(r['accounts'][1]['recent_through'])
 def test_duplicate_id_is_counted_once_and_paid_failure_is_retained(self):
  a=self.record();b=copy.deepcopy(a);b.update(request_id='second',status='incomplete',attempt=2)
  row=self.snapshot([a,a,b])['usage']['rows'][0]
  self.assertEqual(row['requests'],2);self.assertEqual(row['incomplete'],1);self.assertEqual(row['retries'],1)
 def test_missing_or_inconsistent_usage_and_uncertain_requests_are_unknown(self):
  a=self.record();a['usage']=None
  b=self.record();b['request_id']='second';b['usage']['input_tokens_details']['cached_tokens']=99999
  report=self.snapshot([a,b],{'slot':{'model_uncertain':True}})
  self.assertEqual(report['usage']['unknown_requests'],3);self.assertEqual(report['usage']['rows'],[])
 def test_legacy_and_unknown_model_are_not_routine_or_free(self):
  a=self.record();a.pop('purpose');a['model']='different-model'
  row=self.snapshot([a])['usage']['rows'][0]
  self.assertEqual(row['purpose'],'legacy');self.assertIsNone(row['calculated_usd'])
 def test_semantic_failure_keeps_paid_tokens(self):
  a=self.record();a['verification_failed']=True
  row=self.snapshot([a])['usage']['rows'][0]
  self.assertEqual(row['incomplete'],1);self.assertIsNotNone(row['calculated_usd'])
 def test_new_york_day_and_old_records(self):
  a=self.record();a['at']='2026-11-21T02:00:00Z'
  b=self.record();b['at']='2026-01-01T00:00:00Z'
  self.assertEqual(self.snapshot([a,b])['usage']['rows'][0]['day'],'2026-11-20')

if __name__=='__main__':unittest.main()
