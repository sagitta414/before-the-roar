// Import the complete, unedited terminal report. Never reconstruct missing model outputs.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {evaluationSummary,blindReviewPack} from '../api/agent-evaluation.mjs';
const source=process.argv[2];
if(!source)throw Error('Provide the saved evaluation console log');
const log=await readFile(source,'utf8');
const encoded=log.match(/BTR_EVAL_REPORT64=([A-Za-z0-9+/=]+)/)?.[1];
if(!encoded)throw Error('No complete encoded report found; do not reconstruct it from progress counts');
const report=JSON.parse(Buffer.from(encoded.replace(/\s/g,''),'base64').toString('utf8'));
const plan=JSON.parse(await readFile('docs/proof/v44-evaluation-plan.json','utf8'));
if(JSON.stringify(report.plan)!==JSON.stringify(plan))throw Error('Report does not match the preregistered plan');
if(report.cases.length!==12||!report.follow_up||report.requests_reserved>plan.maximum_requests)throw Error('Incomplete or out-of-plan run');
if(JSON.stringify(report.summary)!==JSON.stringify(evaluationSummary(report.cases)))throw Error('Summary does not reproduce from raw results');
const prior=JSON.parse(await readFile('dist/assets/btr-agent-evaluation.json','utf8'));
if(prior.policy!==report.policy)await copyFile('dist/assets/btr-agent-evaluation.json','dist/assets/btr-agent-evaluation-v42-final.json');
const json=JSON.stringify(report,null,2)+'\n';
for(const path of ['docs/proof/agent-evaluation-v44.json','docs/proof/agent-evaluation.json','dist/assets/btr-agent-evaluation.json'])await writeFile(path,json);
await writeFile('docs/proof/blind-review-v44.json',JSON.stringify(blindReviewPack(report),null,2)+'\n');
const tokens={input:0,output:0};
for(const c of report.cases)for(const arm of ['team','baseline']){tokens.input+=c[arm].usage?.prompt_tokens||0;tokens.output+=c[arm].usage?.completion_tokens||0;}
console.log(JSON.stringify({run:report.run_id,complete:report.complete,summary:report.summary,requests:report.requests_reserved,allowance:report.allowance_after,tokens,estimated_model_usd:tokens.input*.15/1e6+tokens.output*.60/1e6},null,2));
