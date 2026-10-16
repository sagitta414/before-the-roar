// Prepare a credential-free verification command for the existing Azure worker.
// Exact source hashes fail closed before any model request on a stale revision.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const paths=['api/match-desk.mjs','api/editorial-policy.mjs','api/agent-tools.mjs','scripts/evaluate-agents.mjs'];
const hash=createHash('sha256');
for(const path of paths)hash.update(await readFile(path));
const expected=hash.digest('hex');
const program=`(async()=>{const fs=require('node:fs'),h=require('node:crypto').createHash('sha256');for(const p of ${JSON.stringify(paths)})h.update(fs.readFileSync('/app/'+p));if(h.digest('hex')!=='${expected}')throw Error('Wrong deployed policy or harness');process.argv.push('--live','--stdout','--compact');await import('/app/scripts/evaluate-agents.mjs');})().catch(e=>{console.error(e.message);process.exitCode=1;})`;
await writeFile('tmp/v42-evaluation-command.txt',`node -e "eval(Buffer.from('${Buffer.from(program).toString('base64')}','base64').toString())"`);
console.log(JSON.stringify({prepared:true,sha256:expected,maximum_requests:20}));
