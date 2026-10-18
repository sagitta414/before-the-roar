import {readFile,writeFile} from 'node:fs/promises';
const log=await readFile('tmp/commentary-quality-court-console.txt','utf8'),encoded=log.match(/BTR_COMMENTARY_COURT64=([A-Za-z0-9+/=]+)/)?.[1];
if(!encoded)throw Error('Commentary court artifact missing');
const artifact=JSON.parse(Buffer.from(encoded,'base64').toString('utf8'));
if(artifact.schema!=='btr.azure-commentary-court.v1'||artifact.cases.length!==6||artifact.evaluator_passes.length!==2)throw Error('Unexpected commentary court artifact');
for(const path of ['docs/proof/commentary-quality-court.json','dist/assets/commentary-quality-court.json'])await writeFile(path,JSON.stringify(artifact,null,2)+'\n');
console.log(JSON.stringify({score:artifact.score,baseline_responses:artifact.baseline_receipts.length,evaluator_responses:artifact.evaluator_passes.map(p=>p.response_id)},null,2));
