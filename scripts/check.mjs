import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const labels=JSON.parse(readFileSync(new URL('../server/labels.json',import.meta.url)));
assert.equal(labels.length,37);assert.equal(new Set(labels).size,37);
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
// Navigation links are allowed; scripts, styles, fonts and artwork stay local.
const assetHtml=html.replace(/<a\b[^>]*>/gi, '');
const css=readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
const assets=[...assetHtml.matchAll(/(?:src|href)="([^"#][^"]*)"/g),...css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(match=>match[1]);
for(const asset of assets){
 assert(!/^(?:[a-z]+:|\/\/)/i.test(asset),'UI assets must be served locally: '+asset);
 assert(existsSync(new URL('../public/'+asset,import.meta.url)),'Missing UI asset: '+asset);
}
console.log('37-label vocabulary and '+assets.length+' local asset references verified.');
