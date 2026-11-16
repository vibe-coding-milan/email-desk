"""Review clock checks; no network or private data."""
import datetime,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('review_schedule',Path(__file__).resolve().parents[1]/'scripts/review-schedule.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
for stamp,offset,next_at in [
 ('2026-11-16T22:00:00Z',-5,'2026-11-16T17:30:00-05:00'),
 ('2027-03-14T00:00:00Z',-4,'2027-03-14T09:00:00-04:00'),
 ('2027-11-07T00:00:00Z',-5,'2027-11-07T09:00:00-05:00'),
 ('2026-11-21T17:00:00Z',-5,'2026-11-21T17:30:00-05:00')]:
 result=module.schedule(datetime.datetime.fromisoformat(stamp.replace('Z','+00:00')))
 assert result['utc_offset_hours']==offset and result['next_at']==next_at
 assert f'BYHOUR={9-offset};' in result['rrule']
 assert 'BYDAY=MO,TU,WE,TH,FR' in result['rrule']
print('Scheduler UTC equivalents, weekends and both overnight DST boundaries passed.')
