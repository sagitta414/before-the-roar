import {writeFile} from 'node:fs/promises';
const base=process.argv[2];if(!base?.startsWith('https://'))throw Error('HTTPS API required');
const snapshot=(scenario,time,extra={})=>({scenario,time,language:'en',corrected:false,tracking:true,...extra});
const cases=[
 {...snapshot('wide',16,{corrected:true}),previous:snapshot('wide',16)},
 {...snapshot('wide',16,{tracking:false}),previous:snapshot('wide',16)},
 snapshot('press',9,{language:'es'}),
 {...snapshot('press',10,{language:'es'}),previous:snapshot('press',9,{language:'es'})},
 snapshot('counter',27,{language:'pt'}),
 {...snapshot('counter',28,{language:'pt'}),previous:snapshot('counter',27,{language:'pt'})}
];
const report={at:new Date().toISOString(),scope:'Six developer-authored live integration probes, not a blinded accuracy evaluation. One Azure selection per fresh snapshot; source-rendered public wording.',rounds:[]};
const health=await fetch(base+'/api/health').then(r=>r.json());report.before=health.usage;if(health.usage.limit-health.usage.used<6)throw Error('Insufficient allowance');
for(const input of cases){const response=await fetch(base+'/api/evidence-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(60000)});const body=await response.text();const frames=body.split('\n\n').map(f=>{const type=f.match(/^event: (.+)$/m)?.[1],data=f.match(/^data: (.+)$/m)?.[1];return type&&data?{type,data:JSON.parse(data)}:null}).filter(Boolean);const receipt=frames.find(f=>f.type==='receipt')?.data,posts=frames.filter(f=>f.type==='post').map(f=>f.data);const ids=new Set(receipt?.receipt.records.map(r=>r.id));const pass=response.ok&&receipt?.engine==='azure_selection'&&posts.length===5&&posts.every(p=>p.evidence_ids.every(id=>ids.has(id)));report.rounds.push({input,status:response.status,pass,receipt,posts});console.log(JSON.stringify({scenario:input.scenario,time:input.time,tracking:input.tracking,pass,engine:receipt?.engine,error:receipt?.error}));}
report.after=(await fetch(base+'/api/health').then(r=>r.json())).usage;report.pass=report.rounds.every(r=>r.pass);await writeFile('docs/proof/studio-v58.json',JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
