"""Apply a scoped UI-only update through the domain owner's authenticated connection."""
from pathlib import Path
import hashlib,json,datetime,shutil,os
payload=UI_UPDATE_PAYLOAD
home=Path.home();web=home/'mijatovic.com';dest=web/'email-desk';private=home/'.email-desk'
if home.name!='dh_6zwyjw' or dest.is_symlink() or not(private/'config.php').is_file():raise RuntimeError('Unexpected installation')
if hashlib.sha256((web/'index.html').read_bytes()).hexdigest()!=payload['homepage_sha256']:raise RuntimeError('Incorrect domain destination')
if set(payload['files'])!={'index.html','app.js','styles.css'}:raise RuntimeError('UI files only')
backup=private/'releases'/('ui-'+datetime.datetime.now().strftime('%Y%m%dT%H%M%S'));backup.mkdir(parents=True,mode=0o700)
for name,content in payload['files'].items():
 target=dest/name
 shutil.copy2(target,backup/name)
 temp=private/(name+'.update');temp.write_text(content);temp.chmod(0o644);temp.replace(target)
print(json.dumps({'ui_updated':True,'files':3,'private_state_preserved':True}))
