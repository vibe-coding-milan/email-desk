import {build} from 'vite';
import {readFileSync,writeFileSync} from 'node:fs';
await build({configFile:'frontend/vite.config.mjs'});
const legacy=readFileSync('frontend/legacy.js','utf8');
writeFileSync('public/app.js',legacy+'\n;'+readFileSync('.local/game-release/build/quest.js','utf8'));
let game=readFileSync('frontend/game.css','utf8').replaceAll("url('/assets/","url('assets/");
// In a shadow tree :root/body are absent; :host establishes the same visual tokens.
game=game.replaceAll(':root',':host').replaceAll('body{',':host{');
const legacyCSS=readFileSync('frontend/legacy.css','utf8');
// :root doesn't match inside a shadow tree, keeping the legacy app style isolated.
writeFileSync('public/styles.css',legacyCSS.slice(0,legacyCSS.indexOf(':root'))+'@scope (:root) {\n'+legacyCSS+'\n}\nbody.game-active{display:block;margin:0;padding:0;background:#faf9f5}body.game-active > :not(#questRoot):not(canvas){display:none!important}\n#questRoot{display:block;min-height:100vh}\n@scope (:host) {\n'+game+'\n}\n'+game.match(/:host\{[^}]+\}/)[0]);
