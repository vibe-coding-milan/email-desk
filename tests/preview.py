"""Fictional, localhost-only UI preview. Never deploy this server or its fixture data."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import json,secrets,urllib.parse,datetime,os
root=Path(__file__).resolve().parents[1]
labels=json.loads((root/'server/labels.json').read_text());logged_in=False;operations={}
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
cards=[]
for i,(account,subject,desc,reason,category,topics)in enumerate([
 ('milan@mijatovic.com','Committee attendance — please confirm','The coordinator needs to know whether you can attend the next CB5 committee meeting.','A direct attendance question is awaiting a response in this fictional example.','action',['Manhattan Community Board 5']),
 ('mijatovic@gmail.com','A new booking page for your stylist','Your regular stylist has moved to another appointment platform.','Useful provider information. The changed booking platform does not change the health and wellness topic.','awareness',['Health & Wellness']),
 ('milan@mijatovic.com','Hallway contractor proposal','Building management has shared a quote for common-area work.','The condo board is asked to review the proposed scope; this is separate from private renovation.','action',['Vetro']),
 ('mijatovic@gmail.com','Dinner receipt','A receipt for a paid restaurant meal arrived through a payment service.','Keep the restaurant context and the receipt record; no action is assumed.','awareness',['Dining Out','Records/Receipts & Statements'])]):
 cards.append(dict(id=str(i),account=account,thread_id='abcdef123456789'+str(i),message_ids=['abcdef123456789'+str(i)],subject=subject,sender='Fictional example sender',date=now,description=desc,reason=reason,category=category,labels=topics,question='',deadline='',state='open',user_category=None,user_labels=None,note='',feedback_status=None,revision=1))
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root/'public'),**kw)
 def log_message(self,*a):pass
 def respond(self,p,status=200):
  b=json.dumps(p).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
 def do_GET(self):
  if not self.path.startswith('/api.php'):return super().do_GET()
  action=urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('action',['board'])[0]
  if action=='session':return self.respond(dict(ok=True,authenticated=logged_in,csrf='preview'))
  if not logged_in:return self.respond(dict(ok=False,error='sign_in'),401)
  if action=='board':return self.respond(dict(ok=True,result=dict(cards=cards,labels=labels,run=dict(status='success',demo=True,summary='Fictional localhost preview only — not your inbox.',finished_at=now,last_success_at=now))))
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
   c.update(revision=c['revision']+1,state=a['state'],user_category=a['category'],user_labels=a['labels'],note=a['note'],feedback_status='pending')
   p=dict(ok=True,result=dict(card=c,feedback_id=secrets.token_hex(16)));operations[a['operation_id']]=p;return self.respond(p)
  return self.respond(dict(ok=False,error='not_found'),404)
print('Fictional UI preview: http://127.0.0.1:4180 — password preview-only',flush=True)
ThreadingHTTPServer(('127.0.0.1',4180),Handler).serve_forever()
