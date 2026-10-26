// A bounded production request for the authored wide-run evidence case.
// This is a conditional editorial forecast, never a probability of causation.
const movement=packet=>packet.evidence.find(row=>row.record_type==='tracking'&&row.revision===packet.revision);
const metres=row=>Math.abs(row.position_m[1]-row.reference_position_m[1]);

export function nextAngleModel(original,alternate){
 if(original?.schema!=='btr.truth-story.v2'||alternate?.schema!=='btr.truth-story.v2'||original.scenario!=='wide'||alternate.scenario!=='wide'||original.revision!==1||alternate.revision!==2)throw Error('Next Angle needs the original and corrected wide-run records.');
 if(original.sequence_second!==alternate.sequence_second||original.sequence_second<16)throw Error('Next Angle needs matching, reached evidence cutoffs.');
 const before=movement(original),after=movement(alternate);
 if(!before||!after)throw Error('Both tracking source records are required.');
 const passes=original.evidence.filter(row=>row.record_type==='event'&&row.type==='pass');
 const completed=passes.filter(row=>row.outcome==='complete');
 const movementBefore=original.checks.find(row=>row.id==='movement');
 const movementAfter=alternate.checks.find(row=>row.id==='movement');
 if(movementBefore?.status!=='supported'||movementAfter?.status!=='withdrawn')throw Error('The expected claim transition is not present.');
 if(alternate.evidence.filter(row=>row.record_type==='event').map(row=>row.id).join('|')!==original.evidence.filter(row=>row.record_type==='event').map(row=>row.id).join('|'))throw Error('The alternate record must preserve completed events.');
 return {
  schema:'btr.next-angle.v1',synthetic:true,scenario:'wide',clock:original.clock,cutoff_second:original.sequence_second,
  source:{original:before.id,alternate:after.id,pass_ids:passes.map(row=>row.id)},
  request:{question:'Did Laurent begin shifting as Moreau ran wide, or does a continuous alternate tracking view show him holding position?',window:'67:14–67:18',kind:'Controlled synthetic wide tracking',reason:'The authored record measures lateral movement but does not establish what caused it.'},
  measured:{original_movement_m:Number(metres(before).toFixed(1)),alternate_movement_m:Number(metres(after).toFixed(1)),pass_attempts:passes.length,pass_completions:completed.length,pass_completion_percent:passes.length?Math.round(100*completed.length/passes.length):null,claims_checked:original.checks.length,claims_changed:original.checks.filter(row=>alternate.checks.find(other=>other.id===row.id)?.status!==row.status).length},
  forecast:{if_stationary:{movement_claim:'withdrawn',broadcast_line:alternate.narrative.currentLine},if_unavailable:{movement_claim:'retain only the original movement observation',broadcast_line:original.narrative.currentLine},unaffected:'The completed pass events remain in both records.'},
  limits:['The alternate is an authored synthetic record, not a second real camera feed.','A temporal relationship does not prove player intention or football causation.','The pass percentage describes completed records at this cutoff, not a future prediction or calibrated probability.']
 };
}
