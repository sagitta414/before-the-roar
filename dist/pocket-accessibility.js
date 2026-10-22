const SIGNALS={
 pressure:{label:'Pressure rising',pattern:[16,95,16,70,20],frequency:168},
 possession_home:{label:'Harbor possession',pattern:[42,28,14],frequency:248,pan:-.72},
 possession_away:{label:'Northbridge possession',pattern:[14,28,42],frequency:248,pan:.72},
 shot:{label:'Shot candidate',pattern:[82],frequency:520},
 correction:{label:'Evidence corrected',pattern:[30,52,30],frequency:330}
};

const secondOf=event=>Number(event?.end??event?.t??event?.second??0);
const eventRows=story=>(story?.analysis?.seen||[]).filter(event=>event?.id&&event.type);

export function signalDefinition(kind,team='harbor'){
 if(kind==='possession')return SIGNALS[team==='north'?'possession_away':'possession_home'];
 return SIGNALS[kind]||null;
}

export function detectMatchSignals(previousStory,currentStory,{corrected=false}={}){
 const beforeIds=new Set(eventRows(previousStory).map(event=>event.id));
 const fresh=eventRows(currentStory).filter(event=>!beforeIds.has(event.id)).sort((a,b)=>secondOf(a)-secondOf(b));
 const signals=[];
 for(const event of fresh){
  if(event.type==='tackle'||event.outcome==='intercepted')signals.push({kind:'possession',team:event.team||'harbor',event});
  if(event.type==='shot')signals.push({kind:'shot',team:event.team||'harbor',event});
 }
 const previousPressure=Number(previousStory?.analysis?.pressure);
 const pressure=Number(currentStory?.analysis?.pressure);
 if(Number.isFinite(pressure)&&(!Number.isFinite(previousPressure)||pressure>previousPressure))signals.push({kind:'pressure',level:pressure});
 if(corrected)signals.push({kind:'correction'});
 return signals;
}

export function spatialDescription(story,focusName='the selected player'){
 const player=story?.brief?.player;
 const movement=Number(player?.displacement);
 if(!Number.isFinite(movement))return 'Movement description is unavailable at this evidence cutoff.';
 const name=player?.name||focusName;
 return `${name} is ${movement.toFixed(1)} metres from the starting position. This is straight-line displacement, not total distance run.`;
}

const presetCopy={
 player:{title:name=>`${name}'s reached window`,mode:'player',duration:25},
 tactical:{title:()=>`Tactical changes`,mode:'analyst',duration:25},
 beginner:{title:()=>`The play in plain language`,mode:'beginner',duration:20},
 disputed:{title:()=>`Claims Check disputed`,mode:'analyst',duration:20},
 spanish20:{title:()=>`Resumen de estudio`,mode:'fan',duration:20,language:'es'}
};

function evidenceTime(record,fallback){return Number(record?.end??record?.t??record?.second??fallback??0);}
function evidenceLabel(record){
 if(record.record_type==='event')return `${String(record.type||'event').replaceAll('_',' ')} · ${record.outcome||'recorded'}`;
 return record.description||record.detail||record.observation||String(record.record_type||record.type||'source').replaceAll('_',' ');
}

export function buildPerspectiveRecap({preset,story,alternateStory,focusName='Selected player',corrected=false}){
 const spec=presetCopy[preset]||presetCopy.tactical,cutoff=Number(story?.cutoff||0),all=(story?.evidence||[]).filter(record=>evidenceTime(record,cutoff)<=cutoff);
 let records=all.filter(record=>record.record_type==='event'||record.record_type==='observation'||record.record_type==='derived_analysis'||record.record_type==='football_context');
 if(preset==='player')records=records.filter(record=>[record.player,record.player_id,record.from,record.to].includes(story?.brief?.player?.id));
 if(preset==='disputed')records=records.filter(record=>(story?.review?.evidence_ids||[]).includes(record.id));
 records=records.slice(-4);
 const language=spec.language||story?.brief?.language||'en',isSpanish=language==='es',review=story?.review||{};
 const narration=preset==='disputed'
  ?(corrected?(isSpanish?'La afirmación fue retirada después de corregir la evidencia.':'The claim was withdrawn after the evidence correction.'):(review.reason||'The interpretation is qualified because the available evidence does not establish cause.'))
  :(alternateStory?.body||story?.body||story?.title||'The reached play is ready for review.');
 const entries=(records.length?records:[{id:'scope',record_type:'coverage',second:cutoff,description:'No matching event record has reached this cutoff.'}]).map((record,index)=>({
  timestamp_s:evidenceTime(record,cutoff),
  overlay:index===0?(alternateStory?.title||story?.title||spec.title(focusName)):evidenceLabel(record),
  narration:index===0?narration:evidenceLabel(record),
  evidence_ids:record.id?[record.id]:[],
  correction_status:corrected?'corrected':review.decision||'reviewed'
 }));
 return {schema:'btr.perspective-recap.v1',synthetic:true,preset,language,target_duration_s:spec.duration,title:spec.title(focusName),source_cutoff_s:cutoff,source_clock:story?.clock,correction_status:corrected?'corrected':review.decision||'reviewed',entries,limitations:['Uses only records at or before the displayed evidence cutoff.','Target duration is an editorial package length, not a claim that more source footage exists.']};
}
