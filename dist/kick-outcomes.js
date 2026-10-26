// Observed rates at the reached synthetic event cutoff; never predictive odds.
export function kickOutcomes(seen,team='harbor'){
 if(!Array.isArray(seen))throw Error('Completed event records are required.');
 const eligible=seen.filter(row=>team==='neutral'||row.team===team);
 const passes=eligible.filter(row=>row.type==='pass');
 const passCompletions=passes.filter(row=>row.outcome==='complete');
 const shots=eligible.filter(row=>row.type==='shot');
 const shotsOnTarget=shots.filter(row=>row.outcome==='goal'||row.outcome==='saved');
 const goals=shots.filter(row=>row.outcome==='goal');
 const rate=(count,total)=>total?Math.round(count/total*100):null;
 return {
  schema:'btr.kick-outcomes.v1',team,
  passes:{made:passCompletions.length,attempted:passes.length,percent:rate(passCompletions.length,passes.length),source_ids:passes.map(row=>row.id)},
  onTarget:{made:shotsOnTarget.length,attempted:shots.length,percent:rate(shotsOnTarget.length,shots.length),source_ids:shots.map(row=>row.id)},
  goals:{made:goals.length,attempted:shots.length,percent:rate(goals.length,shots.length),source_ids:shots.map(row=>row.id)},
  limits:['Only completed recorded events at this playhead are counted.','A rate over one or two attempts is descriptive, not a reliable estimate of future success.','No expected-goals, shot probability, or video-derived success rate is inferred.']
 };
}
