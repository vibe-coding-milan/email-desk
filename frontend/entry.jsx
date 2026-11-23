import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './App.jsx';
import {productionConnection} from './connection.mjs';
let root;
window.startQuest=options=>{
 if(root)return;
 const host=document.createElement('div');host.id='questRoot';document.body.append(host);
 // A separate tree isolates the established welcome/System CSS from the game.
 const shadow=host.attachShadow({mode:'open'}),style=document.createElement('link');style.rel='stylesheet';style.href='styles.css';
 const mount=document.createElement('div');mount.id='gameApp';shadow.append(style,mount);root=createRoot(mount);
 document.body.classList.add('game-active');
 window.exitQuest=()=>{root?.unmount();root=null;host.remove();document.body.classList.remove('game-active');options?.onClose?.();};
 const connection=options?productionConnection({...options,onExit:async()=>{await options.api('logout',{});window.exitQuest();location.reload();},onSystem:()=>{window.exitQuest();options.onSystem();}}):null;
 root.render(<App connection={connection}/>);window.scrollTo(0,0);
};
