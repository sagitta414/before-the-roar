import {clock,position} from './engine.js';
import {truthReport} from './analysis-model.js';

const contexts={
 wide:{number:'01',subject:102,subjectName:'Jules Laurent',partner:7,partnerName:'Luca Moreau',ready:16,end:31,question:'Did the run really move the defender?',chapters:[['Observe',8,false],['The claim',18,false],['Challenge',18,true],['The outcome',31,true]]},
 press:{number:'02',subject:8,subjectName:'Mateo Silva',partner:106,partnerName:'Samir Ali',ready:10,end:29,question:'Did pressure cause the recovery?',chapters:[['Observe',6,false],['The recovery',10,false],['The outcome',29,false]]},
 counter:{number:'03',subject:9,subjectName:'Theo Brooks',partner:104,partnerName:'Alex Ross',ready:12,end:28,question:'Does a good attack guarantee a goal?',chapters:[['Observe',4,false],['The transition',12,false],['The outcome',28,false]]}
};
export function truthStory(s,time,corrected=false,audience='fan'){
 const audit=truthReport(s,time,corrected),t=audit.reading.time,context=contexts[s.id],ready=t>=context.ready,resolved=t>=context.end,revised=audit.revealed,changed=revised&&ready&&s.id==='wide',m=audit.reading.metrics;
 const analyst=audience==='analyst';
 let headline,observation,interpretation,review,originalLine,currentLine;
 if(s.id==='wide'){
  originalLine=ready?`Laurent moved ${m.lateral.toFixed(1)} m toward Moreau’s flank.`:'The sequence has not reached the movement claim.';
  currentLine=changed?'The corrected record shows no lateral movement by Laurent.':originalLine;
  headline=changed?'The run stays. The claim changes.':ready?'Two movements. One tempting story.':'First, watch the space.';
  observation=changed?'Moreau’s run is still recorded. Laurent’s corrected tracking holds him at his starting position. The earlier line about the defender moving must be withdrawn.':ready?'Moreau moves wide as Laurent shifts toward the same flank. That is an observation we can check. Saying the run caused the defender to move is a stronger claim.':'Harbor are building through midfield. Watch Moreau and Laurent; there is not yet a movement claim to judge.';
  interpretation=changed?'We can still describe the run and the completed events. We can no longer say this record shows Laurent following it.':'Movement at the same time does not establish cause. The interpretation must stay open to correction.';
  review=changed?'One changed tracking record affects one movement claim. Keep the passes and shot events; replace the unsupported sentence.':revised?'The tracking correction is active, but this early playhead has no movement claim to withdraw.':ready?'The measured shift supports a movement observation. It does not, on its own, prove that Moreau caused it. Challenge the record and compare the story.':'Hold the explanation. A compelling take should wait for its supporting evidence.';
 }else if(s.id==='press'){
  originalLine=ready?'Cole intercepted the pass after Silva closed on the ball carrier.':'The interception has not happened at this playhead.';currentLine=originalLine;
  headline=ready?'Pressure first. Proof of cause? Not yet.':'The press is taking shape.';
  observation=ready?'Silva closes on the ball carrier. Cole then intercepts the next pass. Both are recorded; the sequence supports describing pressure before a recovery.':'Silva approaches the ball carrier. The recovery is still ahead of the evidence cutoff, so the story cannot claim it yet.';
  interpretation='The order of events does not isolate why the pass was intercepted. This case has no alternative tracking record.';
  review=ready?'Keep the interception as a fact. Describe the pressure as context; do not turn event order into proven causation.':'The clock is an evidence boundary. An expected recovery is not yet a recorded recovery.';
 }else{
  const recovered=audit.reading.seen.some(e=>e.type==='tackle');
  originalLine=resolved?'Berg saved Brooks’ shot.':ready?'Cole’s recovery began a forward passing sequence.':recovered?'Cole has recovered possession.':'The recovery has not happened at this playhead.';currentLine=originalLine;
  headline=resolved?'A good move. A different ending.':ready?'An opening is not an outcome.':recovered?'A recovery. Now wait for the pass.':'Wait for the turning point.';
  observation=resolved?'Harbor recover, pass forward and create a shot. Berg makes the save. The build-up remains meaningful, but the finish cannot be called a goal.':ready?'The recovery and completed forward passes are visible in the record. The next outcome has not arrived at this playhead.':recovered?'Cole’s recovery is recorded. The first forward pass has not yet completed, so the next chapter remains open.':'Northbridge have possession. Let the recorded recovery arrive before describing a counterattack.';
  interpretation='Separate the quality of the build-up from the recorded shot result. This case has no alternative tracking record.';
  review=resolved?'Keep the transition. Keep the save. Withdraw the temptation to turn a promising attack into a goal that never happened.':'Describe only what has completed. A shot or goal cannot enter the recap before its event arrives.';
 }
 const outcome=resolved?(s.id==='counter'?'Recorded outcome: Berg saves. The score remains 0–0.':'Recorded outcome: Brooks scores. The goal event remains valid.'):'The final shot outcome is beyond this evidence cutoff.';
 const factLine=`Harbor: ${m.completed}/${m.passes} passes completed. ${m.goals} recorded goal${m.goals===1?'':'s'}.`;
 if(analyst){observation=`At ${clock(s,t)}, ${factLine} ${s.id==='wide'?`Laurent’s lateral displacement: R1 ${m.lateral.toFixed(1)} m; current record ${audit.reference.metrics.lateral.toFixed(1)} m. `:''}${observation}`;}
 const phase=changed?'Revised':resolved?'Outcome checked':ready?'Claim under review':'Gathering evidence';
 const chapters=context.chapters.map(([label,second,revision],index)=>({label,second,corrected:revision,index,clock:clock(s,second)}));
 const chapterIndex=s.id==='wide'?(changed?(resolved?3:2):ready?1:0):(resolved?2:ready?1:0);
 return {audit,context,time:t,clock:clock(s,t),revision:revised?2:1,changed,ready,resolved,phase,headline,observation,interpretation,review,originalLine,currentLine,outcome,factLine,chapters,chapterIndex,audience:analyst?'analyst':'fan'};
}

export function truthStoryPacket(s,time,corrected=false,audience='fan'){
 const n=truthStory(s,time,corrected,audience),windowId=`${s.id}-window-${n.time.toFixed(1)}`;
 const evidence=n.audit.reading.seen.map(e=>({record_type:'event',...e}));
 evidence.push({record_type:'coverage',id:windowId,from_second:0,through_second:n.time,event_ids:n.audit.reading.seen.map(e=>e.id),source:'Complete authored scenario event window'});
 const claimRows=n.audit.rows.map(row=>({...row,source:row.source.length?[...row.source]:[windowId],current_source:row.source.length?[...row.source]:[windowId]}));
 const movement=claimRows.find(row=>row.id==='movement');
 if(movement.source.some(id=>id.includes('-track-'))){
  const id=movement.source[0];evidence.push({record_type:'tracking',id,player_id:102,second:n.time,position_m:position(s,102,n.time),reference_position_m:position(s,102,0),revision:1});
  if(n.changed){const revisedId=id+'-r2';evidence.push({record_type:'tracking',id:revisedId,player_id:102,second:n.time,position_m:position(s,102,n.time,true),reference_position_m:position(s,102,0,true),revision:2});movement.current_source=[revisedId];}
 }
 const {headline,observation,interpretation,originalLine,currentLine,outcome,review}=n;
 return {schema:'btr.truth-story.v2',synthetic:true,scenario:s.id,sequence_second:n.time,clock:n.clock,revision:n.revision,audience:n.audience,correction:n.audit.revealed?'Defender 102 held at original coordinates':null,narrative:{headline,observation,interpretation,originalLine,currentLine,outcome,review},checks:claimRows,evidence,generator:'deterministic-evidence-review',limits:['A demonstration using authored synthetic records, not an external ground-truth validation.','No model confidence score or proof of causation.','Separate from the generated film and the Azure AI room.']};
}
