// Capture actual public SSE output. No retries, authored substitutions or model judging.
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.argv[2];
if(!origin?.startsWith('https://'))throw Error('Provide the deployed HTTPS origin');
const path='docs/proof/two-round-v45-2.json';
const report={schema:'btr.live-conversation.v1',recorded_at:new Date().toISOString(),origin,rounds:[],complete:false,limits:'A single demonstration, not a comparative evaluation or accuracy measurement. All emitted outputs and fallback labels are retained.'};
await mkdir('docs/proof',{recursive:true});
const save=()=>writeFile(path,JSON.stringify(report,null,2)+'\n');
let health;
for(let attempt=0;attempt<12;attempt++){
 health=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(30000)}).then(r=>r.json());
 if(health.version==='3.11.2')break;
 await new Promise(resolve=>setTimeout(resolve,10000));
}
if(health.version!=='3.11.2')throw Error('Expected evidence-response release 3.11.2');
if(health.usage.limit-health.usage.used<8)throw Error('Eight requests required; allowance will not be changed');
report.before=health;
const base={scenario:'wide',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'};
for(const question of ['What is happening away from the ball, and why is it worth watching?','Does this prove the wide run opened the central pass? What would you need to check?']){
 const parent=report.rounds.at(-1)?.events.find(e=>e.type==='conversation')?.data.id;
 const input={...base,question,...(parent?{parentKey:parent}:{})};
 const round={input,events:[],started_at:new Date().toISOString()};report.rounds.push(round);await save();
 const response=await fetch(origin+'/api/match-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Discussion HTTP '+response.status);
 let buffer='';const decoder=new TextDecoder();
 for await(const chunk of response.body){buffer+=decoder.decode(chunk,{stream:true});let end;
  while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],data=frame.match(/^data: (.+)$/m)?.[1];if(type&&data){const event={type,data:JSON.parse(data),at:new Date().toISOString()};round.events.push(event);if(type!=='draft'){await save();if(type==='post')console.log(JSON.stringify({round:report.rounds.length,...event.data}));}}}
 }
 round.finished_at=new Date().toISOString();await save();
 if(!round.events.some(e=>e.type==='conversation')||round.events.some(e=>e.type==='error'))throw Error('Incomplete round; retained for inspection');
}
report.after=await fetch(origin+'/api/health').then(r=>r.json());
report.complete=report.rounds.every(r=>new Set(r.events.filter(e=>e.type==='post').map(e=>e.data.role)).size===5);
await save();console.log(JSON.stringify({path,complete:report.complete,usage:report.after.usage}));
