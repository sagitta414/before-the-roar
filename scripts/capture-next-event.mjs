// Preserve an unedited two-round synthetic discussion across a newly reached event.
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw Error('Pass the deployed HTTPS API origin');
const path = 'docs/proof/live-next-event-v81.json';
const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(30000) }).then(r => r.json());
if (health.usage.limit - health.usage.used < 2) throw Error('Two available requests required');
const report = { schema:'btr.live-next-event.v1', recorded_at:new Date().toISOString(), before:health, rounds:[], complete:false, limits:'One live synthetic case; source-rendered public prose and one AI angle selection per round. Not a general quality score.' };
await mkdir('docs/proof',{recursive:true});
const save = () => writeFile(path,JSON.stringify(report,null,2)+'\n');
for (const [time,question] of [[22,'Before the next pass arrives, what is established by this wide run?'],[26,'Now check the next recorded event against that reading. What changed, and what remains unproven?']]) {
 const parentKey=report.rounds.at(-1)?.events.find(e=>e.type==='conversation')?.data.id;
 const input={scenario:'wide',time,language:'en',mode:'analyst',focus:7,team:'harbor',corrected:false,question,...(parentKey?{parentKey}:{})};
 const round={input,events:[],started_at:new Date().toISOString()};report.rounds.push(round);await save();
 const response=await fetch(origin+'/api/match-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(120000)});
 if(!response.ok)throw Error('Match discussion HTTP '+response.status);
 let buffer='';const decoder=new TextDecoder();
 for await(const chunk of response.body){buffer+=decoder.decode(chunk,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],data=frame.match(/^data: (.+)$/m)?.[1];if(type&&data){round.events.push({type,data:JSON.parse(data),at:new Date().toISOString()});if(type!=='draft')await save();}}}
 round.finished_at=new Date().toISOString();await save();
 if(!round.events.some(e=>e.type==='complete')||round.events.some(e=>e.type==='error'))throw Error('Incomplete live round; partial receipt retained');
}
report.after=await fetch(origin+'/api/health',{signal:AbortSignal.timeout(30000)}).then(r=>r.json());
report.complete=report.rounds.every(r=>new Set(r.events.filter(e=>e.type==='post').map(e=>e.data.role)).size===5);
await save();
console.log(JSON.stringify({path,complete:report.complete,requests_used:report.after.usage.used-health.usage.used,rounds:report.rounds.map(r=>r.events.filter(e=>e.type==='post').map(e=>({role:e.data.role,engine:e.data.engine,summary:e.data.summary}))) }));
