import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('Microsoft security page separates implemented controls from future products',async()=>{const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');for(const text of ['Microsoft Entra ID','Azure RBAC','HTTPS ingress','Storage Blob Data Contributor','NOT CLAIMED'])assert.match(html,new RegExp(text,'i'));assert.match(html,/id="security"/);assert.match(html,/id="security-nav"/);});
