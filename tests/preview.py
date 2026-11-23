"""Fictional, localhost-only UI preview. Never deploy this server or its fixture data."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import json,secrets,urllib.parse,datetime,os
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[1]
labels=json.loads((root/'server/labels.json').read_text());logged_in=False;operations={}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
cards=[]
def progress():
 count=sum(bool(c.get('decision_earned_at')) for c in cards);xp=sum(c.get('decision_xp',10) for c in cards if c.get('decision_earned_at'))
 return dict(xp=xp,decisions=count,level=xp//100+1,level_xp=xp%100,level_target=100)
for i,(account,subject,desc,reason,category,topics)in enumerate([
 ('milan@mijatovic.com','Confirm committee attendance','A quick confirmation is needed for next week’s committee meeting so the team can finalize the agenda.','A direct attendance question is awaiting a response in this fictional example.','action',['Manhattan Community Board 5']),
 ('mijatovic@gmail.com','Your stylist has a new booking page','Your stylist has launched a new booking page with updated availability and services.','Useful provider information. The changed booking platform does not change the health and wellness topic.','awareness',['Health & Wellness']),
 ('milan@mijatovic.com','Review hallway proposal','Take a look at the updated hallway proposal and share any feedback before it moves forward.','The condo board is asked to review the proposed scope; this is separate from private renovation.','action',['Vetro']),
 ('mijatovic@gmail.com','Dinner receipt','A receipt is available for your recent dinner reservation, for your records.','Keep the restaurant context and the receipt record; no action is assumed.','awareness',['Dining Out','Records/Receipts & Statements'])]):
 cards.append(dict(id=str(i),account=account,thread_id='abcdef123456789'+str(i),message_ids=['abcdef123456789'+str(i)],subject=subject,sender=['Riley Parker','Casey Ellis','"Cedar Workshop Inc." <hello@cedar.example>','Jordan Vale'][i],date=now if i<2 else (datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=3 if i==2 else 1)).isoformat(),description=desc,reason=reason,category=category,labels=topics,question='',deadline='',state='open',user_category=None,user_labels=None,note='',feedback_status=None,revision=1))
# Optional fictional boundary fixture for checking the level-up interaction.
if os.environ.get('EMAIL_DESK_LEVEL_DEMO')=='1':
 for i in range(9):
  sample=dict(cards[0]);sample.update(id='demo-'+str(i),subject='Fictional completed example '+str(i+1),state='handled',decision_earned_at=now);cards.append(sample)
# Operational fixtures are invented and kept in process memory.
scenario=os.environ.get('EMAIL_DESK_PREVIEW_SCENARIO','partial')
if scenario=='context':
 cards[:]=cards[:2]
 cards[1].update(subject='Library event reminder',description='A reminder about an upcoming library event, with guest speakers.',reason='An event invitation may need a reply.',labels=['Education'])
def scheduled_time():
 local=datetime.datetime.now(ZoneInfo('America/New_York'));slots=[]
 for offset in [-1,0]:
  day=local.date()+datetime.timedelta(days=offset)
  for hour,minute in [(9,0),*([(13,0)] if day.weekday()<5 else []),(17,30)]:
   stamp=datetime.datetime.combine(day,datetime.time(hour,minute),local.tzinfo)
   if stamp<=local:slots.append(stamp)
 return max(slots).isoformat()
def report():
 return dict(generated_at=now,schedule_active=True,activated_at=(datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(days=2)).isoformat() if scenario in {'catchup','context'} else now,accounts=[dict(account=a,recent_through=now,historical_through=now,historical_complete=False) for a in ['mijatovic@gmail.com','milan@mijatovic.com']],playbook=dict(fetched_at=now,revision='fictional-revision'),usage=dict(since=now[:10],unknown_requests=1,rows=[dict(day=now[:10],purpose='manual',model='gpt-6-luna',rate_date='2026-11-21',requests=2,retries=1,incomplete=1,input_tokens=12000,output_tokens=1200,cached_tokens=3000,cache_write_tokens=2000,calculated_usd='0.00158')]))
def run():
 return dict(status='error' if scenario=='error' else 'partial',summary='Fictional preview: recent mail checked; historical catch-up remains incomplete.',finished_at=now,last_success_at=None,coverage={a:('error' if scenario=='error' else 'complete') for a in ['mijatovic@gmail.com','milan@mijatovic.com']},details=dict(trigger='scheduled' if scenario in {'catchup','context'} else 'manual',scheduled_at=scheduled_time() if scenario in {'catchup','context'} else None,phase='final',started_at=now,completed_at=now,attempt=1))
port=int(os.environ.get('EMAIL_DESK_PREVIEW_PORT','8000'))
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root/'public'),**kw)
 def log_message(self,*a):pass
 def end_headers(self):
  self.send_header('Cache-Control','no-store');super().end_headers()
 def respond(self,p,status=200):
  b=json.dumps(p).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
 def do_GET(self):
  if not self.path.startswith('/api.php'):return super().do_GET()
  action=urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('action',['board'])[0]
  if action=='session':return self.respond(dict(ok=True,authenticated=logged_in,csrf='preview'))
  if not logged_in:return self.respond(dict(ok=False,error='sign_in'),401)
  if action=='board':
   if scenario=='offline':return self.respond(dict(ok=False,error='temporary'),503)
   return self.respond(dict(ok=True,result=dict(cards=cards,labels=labels,progress=progress(),run=run(),runs=[run()],report=None if scenario=='legacy' else report())))
  if action=='system':return self.respond(dict(ok=True,result=dict(report=None if scenario=='legacy' else report(),runs=[run()],feedback=[dict(card_id=c['id'],subject=c['subject'],status=c['feedback_status'],created_at=now) for c in cards if c.get('feedback_status') in ['pending','error']],remaining=0)))
  if action=='playbook':return self.respond(dict(ok=True,result=dict(content='Fictional preview. Real playbook reference is loaded only after private server setup.')))
  return self.respond(dict(ok=False,error='not_found'),404)
 def do_POST(self):
  global logged_in
  action=urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('action',[''])[0];a=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0))))
  if action=='login':
   if a.get('password')!='preview-only':return self.respond(dict(ok=False,error='invalid_login'),401)
   logged_in=True;return self.respond(dict(ok=True,csrf='preview'))
  if action=='logout':logged_in=False;return self.respond(dict(ok=True))
  if not logged_in:return self.respond(dict(ok=False,error='sign_in'),401)
  if action=='feedback':
   if a['operation_id']in operations:return self.respond(operations[a['operation_id']])
   c=next(c for c in cards if c['id']==a['card_id'])
   if c['revision']!=a['revision']:return self.respond(dict(ok=False,error='conflict'),409)
   earned=c['state']=='open' and a['state']!='open' and not c.get('decision_earned_at')
   if earned:
    moment=datetime.datetime.now(datetime.timezone.utc);c['decision_earned_at']=moment.isoformat()
    start=datetime.datetime.fromisoformat(c.get('attention_started_at',c['date']).replace('Z','+00:00'))
    c['decision_started_at']=c.get('attention_started_at',c['date'])
    c['decision_xp']=5 if (moment-start).total_seconds()>48*3600 else 10
   c.update(revision=c['revision']+1,state=a['state'],user_category=a['category'],user_labels=a['labels'],note=a['note'],feedback_status='pending')
   p=dict(ok=True,result=dict(card=c,feedback_id=secrets.token_hex(16),xp_earned=c['decision_xp'] if earned else 0,progress=progress()));operations[a['operation_id']]=p;return self.respond(p)
  return self.respond(dict(ok=False,error='not_found'),404)
print(f'Fictional UI preview: http://127.0.0.1:{port} — password preview-only',flush=True)
ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
