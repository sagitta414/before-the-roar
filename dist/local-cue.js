// Bounded, client-reported observations. Video bytes and file names never enter this contract.
export function localInput(raw){
 const fail=()=>{throw Error('Invalid local evidence packet.');};
 if(!raw||raw.source!=='upload'||!/^[a-f0-9]{64}$/.test(raw.hash||'')||!Number.isInteger(raw.revision)||raw.revision<1||raw.revision>1e7||!Number.isFinite(raw.time)||raw.time<0||raw.time>120)fail();
 let event=null;
 if(raw.event){const e=raw.event;if(!/^[a-zA-Z0-9_-]{1,80}$/.test(e.id||'')||!['pass','shot','duel'].includes(e.type)||!Number.isFinite(e.second)||e.second<0||e.second>raw.time)fail();
  event={id:e.id,type:e.type,second:e.second,measured:e.measured===true};
  if(event.measured){for(const [key,max] of [['distance',130],['speed',250]]){if(e[key]!=null){if(!Number.isFinite(e[key])||e[key]<0||e[key]>max)fail();event[key]=e[key];}}}
 }
 return {source:'upload',hash:raw.hash,revision:raw.revision,time:raw.time,event,corrected:raw.corrected===true,synthetic:raw.synthetic===true,language:'en',mode:'fan'};
}
export function localCue(input,sequence,now){
 const s=localInput(input),e=s.event,withdrawn=s.corrected&&!!e;
 const title=withdrawn?'Claim withdrawn':e?`${e.type==='shot'?'Shot':e.type==='pass'?'Pass':'Duel'} candidate`:'Waiting for an observation';
 const body=withdrawn?'The desktop reviewer withdrew this observation. No overlay claim is released.':e?`An ${e.measured?'experimental detector':'human reviewer'} reported this candidate at ${e.second.toFixed(1)} seconds. Intention and outcome remain unverified.`:'Play and analyze the local clip on the main screen. Its next observed event will appear here.';
 return {schema:'btr.broadcast-cue.v1',sequence,issued_at:now,expires_at:now+6000,source:'upload',source_id:s.hash,cutoff:s.time,clock:s.time.toFixed(1)+' s',revision:s.revision,language:'en',mode:'fan',title,body,evidence_ids:e?[e.id]:[],evidence:e?[{id:e.id,type:e.type,second:e.second,description:'Client-reported observation; original bytes remain on the desktop.'}]:[],experience:{corrected:withdrawn,synthetic:s.synthetic},explanation:{observation:body,calculation:!withdrawn&&e?.measured?{distance_m:e.distance??null,speed_kmh:e.speed??null}:null,decision:withdrawn?'withdraw':e?'qualify':'wait',review:'Client-reported evidence, not independently verified by the server. Controlled marker assumptions apply.'},placement:'lower-left',display_duration_ms:6000};
}
export function workspaceInput(workspace){const e=workspace.events.at(-1),c=workspace.cues.at(-1),event=e?{id:e.id,type:e.type,second:e.end,measured:true,distance:e.distance,speed:e.speed}:c?{id:c.id,type:c.type,second:c.second,measured:false}:null;return localInput({source:'upload',hash:workspace.source.hash,revision:workspace.revision,time:event?.second||0,event,corrected:workspace.corrected,synthetic:workspace.source.synthetic});}
