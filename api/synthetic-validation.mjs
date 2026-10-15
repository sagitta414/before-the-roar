const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function validateSyntheticMatch(match){
 const failures=[],warnings=[],seen=new Set();let second=-1,seq=0,ball=null,passes=0,completed=0,shots=0,pressures=0,goals=0;
 const fail=(event,message)=>failures.push({id:event.id,message});
 for(const e of match.events){
  if(seen.has(e.id))fail(e,'Duplicate event ID');seen.add(e.id);
  if(e.seq!==seq+1||e.second<second)fail(e,'Sequence or clock moved backwards');seq=e.seq;second=e.second;
  if(!e.synthetic||!['home','away'].includes(e.team)||e.player<1||e.player>11)fail(e,'Invalid team, player or provenance');
  for(const p of [e.from,e.to].filter(Boolean))if(p.length!==2||!p.every(Number.isFinite)||p[0]<0||p[0]>105||p[1]<0||p[1]>68)fail(e,'Coordinate outside 105 × 68 m pitch');
  if(['pass','carry','shot','recovery'].includes(e.type)&&ball&&e.from&&distance(ball,e.from)>.2)fail(e,'Ball origin jumps without a restart');
  if(e.type==='pass'){
   passes++;completed+=e.complete?1:0;if(e.player===e.recipient)fail(e,'Pass receiver equals passer');
   if(Math.abs(distance(e.from,e.to)-e.distance_m)>.11)fail(e,'Pass distance disagrees with coordinates');
   if(e.travel_seconds<=0||Math.abs(e.distance_m/e.travel_seconds*3.6-e.ball_speed_kmh)>.11)fail(e,'Pass speed disagrees with distance / time');
  }
  if(e.type==='carry'&&distance(e.from,e.to)/e.travel_seconds>8.51)fail(e,'Carry exceeds declared simulator speed cap');
  if(e.type==='shot'){shots++;if(e.outcome==='goal')goals++;}
  if(e.type==='pressure')pressures++;
  if(e.type==='restart'&&e.reason==='goal'&&distance(e.to,[52.5,34])>.01)fail(e,'Goal must restart at centre');
  if(e.to&&e.type!=='pressure')ball=e.to;
 }
 if(second!==5400)failures.push({id:'fulltime',message:'Fixture does not finish at 90 minutes'});
 if(match.events.filter(e=>e.type==='halftime').length!==1)failures.push({id:'halftime',message:'Expected one halftime boundary'});
 const completion=passes?completed/passes*100:0;
 // These are declared design targets, not claims of real-league calibration.
 if(shots<5||shots>35)warnings.push('Shot count falls outside the simulator design target of 5–35 per match.');
 if(completion<65||completion>95)warnings.push('Pass completion falls outside the simulator design target of 65–95%.');
 return {schema:'btr.dataset-validation.v1',valid:failures.length===0,checks:['unique IDs','monotonic clock','team and player ranges','pitch bounds','ball continuity','distance and speed agreement','carry cap','goal restart','halftime and fulltime'],failures,warnings,summary:{events:match.events.length,passes,completed,completion_pct:Math.round(completion*10)/10,shots,goals,pressures},calibration:'Internal invariants and declared design targets. Not calibrated against real Premier League matches.'};
}
