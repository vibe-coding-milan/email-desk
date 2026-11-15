import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const labels=JSON.parse(readFileSync(new URL('../server/labels.json',import.meta.url)));
assert.equal(labels.length,37);assert.equal(new Set(labels).size,37);
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
assert(!/https?:\/\//.test(html.replace(/https:\/\/docs\.google\.com[^" ]+/g,'')),'External UI assets must not receive private-page traffic');
console.log('37-label vocabulary and local-only asset references verified.');
