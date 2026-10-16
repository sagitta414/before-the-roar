// Five bounded live requests. Retain actual responses, including failures.
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.argv[2];
if(!base?.startsWith('https://'))throw Error('Supply the deployed HTTPS service');
const report={recorded_at:new Date().toISOString(),policy:'v53-audience-composition',limits:'Functional smoke test, not an independent accuracy or audience-benefit study.',rounds:[],complete:false};
const path='docs/proof/audience-v53.json';
const save=()=>writeFile(path,JSON.stringify(report,null,2)+'\n');
const initial={scenario:'wide',time:16,language:'en',mode:'analyst',focus:7,team:'harbor',corrected:false};
const cases=[
 {question:'What is happening away from the ball? Explain the positional reading.'},
 {question:'Explain the key difference in everyday language.',parent:0,angle:'beginner'},
 {question:'Go deeper. Give me a concrete replay task to inspect next, rather than repeating the same finding.',parent:1,angle:'next_check'},
 {question:'Nunca he visto fútbol. Explícalo con palabras sencillas.',language:'es',mode:'beginner',angle:'beginner'},
 {question:'Who will win the real Premier League next year?',angle:'outside_scope'}
];
report.before=await fetch(base+'/api/health').then(r=>r.json());
if(report.before.usage.limit-report.before.usage.used<5)throw Error('Five requests required; no allowance changes');
for(const spec of cases){
 const {parent,angle,...overrides}=spec;
 const input={...initial,...overrides,...(parent!=null?{parentKey:report.rounds[parent].events.find(e=>e.type==='conversation').data.id}:{})};
 const round={input,expected_angle:angle||null,events:[]};report.rounds.push(round);await save();
 const start=performance.now(),res=await fetch(base+'/api/match-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(90000)});
 assert.equal(res.status,200);
 let buffer='';const decoder=new TextDecoder();
 for await(const chunk of res.body){buffer+=decoder.decode(chunk,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(type&&raw)round.events.push({type,data:JSON.parse(raw)});}}
 round.elapsed_ms=Math.round(performance.now()-start);await save();
 const posts=Object.values(Object.fromEntries(round.events.filter(e=>e.type==='post').map(e=>[e.data.role,e.data])));
 assert.equal(posts.length,5);assert.ok(posts.every(p=>p.composition_policy==='v53-audience-composition'));
 assert.equal(posts.filter(p=>p.engine==='azure_selection').length,3);
 if(angle)assert.ok(posts.every(p=>p.editorial_angle===angle),`Expected ${angle}, got ${posts[0].editorial_angle}`);
 console.log(JSON.stringify({round:report.rounds.length,angle:posts[0].editorial_angle,elapsed_ms:round.elapsed_ms,new_roles:posts.filter(p=>!p.unchanged).map(p=>p.role)}));
}
report.after=await fetch(base+'/api/health').then(r=>r.json());report.complete=true;await save();
console.log(JSON.stringify({complete:true,path,requests:report.after.usage.used-report.before.usage.used}));
