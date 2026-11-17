#!/usr/bin/env python3
"""UTC heartbeat recurrence for the next New York review; no inbox or state access.

Re-evaluate after each review, especially before an overnight DST change. The
Codex heartbeat observed on November 16 interpreted BYHOUR in UTC despite TZID.
"""
import datetime,json,sys
from zoneinfo import ZoneInfo
zone=ZoneInfo('America/New_York')

def schedule(now):
 now=now.astimezone(datetime.timezone.utc)
 for day in range(3):
  date=now.astimezone(zone).date()+datetime.timedelta(days=day)
  times=[(9,0), *(([(13,0)]) if date.weekday()<5 else []), (17,30)]
  future=[datetime.datetime.combine(date,datetime.time(h,m),zone) for h,m in times]
  future=[t for t in future if t>now]
  if future:
   next_at=future[0];break
 offset=int(next_at.utcoffset().total_seconds()//3600)
 return {'timezone':'America/New_York','utc_offset_hours':offset,'next_at':next_at.isoformat(),'rrule':'\n'.join([
  'DTSTART:'+next_at.astimezone(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ'),
  f'RRULE:FREQ=DAILY;BYHOUR={9-offset};BYMINUTE=0;BYSECOND=0',
  f'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;BYHOUR={13-offset};BYMINUTE=0;BYSECOND=0',
  f'RRULE:FREQ=DAILY;BYHOUR={17-offset};BYMINUTE=30;BYSECOND=0'])}

if __name__=='__main__':
 now=datetime.datetime.fromisoformat(sys.argv[1].replace('Z','+00:00')) if len(sys.argv)>1 else datetime.datetime.now(datetime.timezone.utc)
 print(json.dumps(schedule(now)))
