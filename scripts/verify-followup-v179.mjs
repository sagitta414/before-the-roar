import {writeFile,mkdir} from 'node:fs/promises';
const base=process.argv[2];
if(!base)throw Error('Supply the API base URL; this explicitly runs paid model requests.');
const cases=[
 {id:'intent',time:25,opening:'Describe the visible duel and distinguish observation from interpretation.',followup:'Can the evidence establish the defender’s intent? Correct any intent inference and add a new observation only if one has arrived.'},
 {id:'outlet',time:12,opening:'What does this received pass establish, and what remains outside the shot?',followup:'What specific evidence would change that reading? Give a different contribution from each specialist, without inventing new action.'},
 {id:'escape',time:22,opening:'Explain this close-control moment using only this shot.',followup:'Does the defender following prove the attacker beat him? Tell me what conclusion survives and one concrete comparison to watch.'}
];
async function run(input){
 const response=await fetch(base+'/api/clip-desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clip_id:'pitchside-minute-veo-quality-v1',language:'en',mode:'analyst',...input}),signal:AbortSignal.timeout(180000)});
 if(!response.ok)throw Error(`Desk ${response.status}: ${await response.text()}`);
 const events=(await response.text()).split('\n\n').filter(b=>b.includes('data:')).map(b=>({type:b.split('\n').find(l=>l.startsWith('event:'))?.slice(6).trim(),data:JSON.parse(b.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5)).join(''))}));
 const failure=events.find(e=>e.type==='error');if(failure)throw Error(failure.data.message);
 return {events,conversation:events.find(e=>e.type==='conversation')?.data,posts:events.filter(e=>e.type==='post').map(e=>e.data),complete:events.find(e=>e.type==='complete')?.data};
}
const report={version:'v179',kind:'developer live smoke; not independent quality evaluation',started_at:new Date().toISOString(),cases:[]};
await mkdir('tmp',{recursive:true});
for(const c of cases){
 const opening=await run({time:c.time,question:c.opening});
 if(!opening.conversation?.id)throw Error('No conversation receipt; refusing disconnected follow-up.');
 const followup=await run({time:c.time,question:c.followup,parentKey:opening.conversation.id});
 report.cases.push({...c,opening,followup});
 await writeFile('tmp/followup-v179-live.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({case:c.id,openingCalls:opening.complete?.model_calls,followupCalls:followup.complete?.model_calls,cached:followup.complete?.cached,posts:followup.posts.map(({role,engine,summary,replay_cue,evidence_ids})=>({role,engine,summary,replay_cue,evidence_ids})),rejections:followup.events.filter(e=>e.type==='trace'&&/fallback|revision/.test(e.data.action))},null,2));
}
