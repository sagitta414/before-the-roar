import {writeFile} from 'node:fs/promises';
const base=process.argv[2];if(!base?.startsWith('https://'))throw Error('Supply HTTPS API origin');
const report={recorded_at:new Date().toISOString(),limits:'Six developer-authored live probes, not blind testing, an accuracy score or proof of general reasoning. The model selects grounded catalog responses. Tracking correction and two event cutoffs are tested.',rounds:[],complete:false};
const cases=[
 {scenario:'wide',time:16,corrected:false,question:'Can the defender’s lateral movement be measured here without claiming the runner caused it?'},
 {scenario:'wide',time:16,corrected:true,question:'With the revised tracking, what must be withdrawn and what can we still say about the passing?'},
 {scenario:'press',time:9,corrected:false,question:'Freeze at this instant. Has possession actually changed yet, or is that still an expectation?'},
 {scenario:'press',time:10,corrected:false,question:'What new event is now supported, and does it establish that the pressure caused the mistake?',parent:2},
 {scenario:'counter',time:27,corrected:false,question:'The shot has started. Can you already report a goal at this evidence cutoff?'},
 {scenario:'counter',time:28,corrected:false,question:'Now that the shot record has arrived, what was the result and which parts of the build-up remain valid?',parent:4}
];
const save=async()=>{await writeFile('docs/proof/evidence-v55.json',JSON.stringify(report,null,2));await writeFile('dist/assets/evidence-v55.json',JSON.stringify(report,null,2));};
const health=await fetch(base+'/api/health').then(r=>r.json());if(health.usage.limit-health.usage.used<6)throw Error('Insufficient existing allowance; no limit changes');
for(const spec of cases){
 const {parent,...input}=spec;Object.assign(input,{language:'en',mode:'analyst',focus:7,team:'harbor'});
 if(parent!=null){const id=report.rounds[parent].events.find(e=>e.type==='conversation')?.data.id;if(id)input.parentKey=id;}
 const round={input,events:[]};report.rounds.push(round);const start=performance.now();
 try{const res=await fetch(base+'/api/match-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(90000)});round.http_status=res.status;
  let buffer='';const decoder=new TextDecoder();for await(const chunk of res.body){buffer+=decoder.decode(chunk,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(type&&raw)round.events.push({type,data:JSON.parse(raw)});}}
 }catch(e){round.error=e.message;}
 round.elapsed_ms=Math.round(performance.now()-start);await save();console.log(JSON.stringify({case:report.rounds.length,status:round.http_status,elapsed:round.elapsed_ms,posts:round.events.filter(e=>e.type==='post').map(e=>({role:e.data.role,summary:e.data.summary,angle:e.data.editorial_angle}))}));
}
report.complete=report.rounds.every(r=>r.http_status===200&&r.events.filter(e=>e.type==='post').length>=5);await save();
