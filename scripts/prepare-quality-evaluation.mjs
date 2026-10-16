import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const paths=['api/claim-boundary.mjs','api/match-desk.mjs','api/editorial-policy.mjs','api/conversation.mjs','scripts/evaluate-agents.mjs'];
const h=createHash('sha256');for(const p of paths)h.update(await readFile(p));const expected=h.digest('hex');
const program=`(async()=>{const fs=require('node:fs'),h=require('node:crypto').createHash('sha256');for(const p of ${JSON.stringify(paths)})h.update(fs.readFileSync('/app/'+p));if(h.digest('hex')!=='${expected}')throw Error('Deployed policy does not match the fixed evaluation');process.argv=[process.execPath,'/app/scripts/evaluate-agents.mjs','--live','--stdout','--quality-smoke'];await import('/app/scripts/evaluate-agents.mjs');})().catch(e=>{console.error(e.message);process.exitCode=1;})`;
await writeFile('tmp/v51-evaluation-command.txt',`node -e "eval(Buffer.from('${Buffer.from(program).toString('base64')}','base64').toString())"`);
console.log(JSON.stringify({prepared:true,maximum_requests:10,policy:'v51-grounded',sha256:expected}));
