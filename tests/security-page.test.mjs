import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('Microsoft security page separates deployed controls from possible production products',async()=>{const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');for(const text of ['Microsoft Entra ID','Azure RBAC','HTTPS ingress','Storage Blob Data Contributor','COULD BE USED','Microsoft Defender for Cloud','Microsoft Sentinel','Azure Key Vault','Microsoft Purview'])assert.match(html,new RegExp(text,'i'));assert.match(html,/id="security"/);assert.match(html,/id="security-nav"/);assert.match(html,/These products are not connected to this prototype/i);});
