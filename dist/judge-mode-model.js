import {SCENARIOS} from './engine.js';
import {truthStoryPacket} from './truth-story-model.js';

const scenario=SCENARIOS.find(item=>item.id==='wide');
const movement=packet=>packet.checks.find(item=>item.id==='movement');
const tracking=packet=>packet.evidence.filter(item=>item.record_type==='tracking').at(-1);

export function judgeProof({runId='preview',startedAt=0}={}){
 // Judge mode shares the same 67:16 evidence cutoff as Watch and Truth Lab.
 // All displayed values and source IDs are derived from these packets.
 const original=truthStoryPacket(scenario,16,false,'analyst','en');
 const corrected=truthStoryPacket(scenario,16,true,'analyst','en');
 const before=movement(original),after=movement(corrected);
 const originalTracking=tracking(original),correctedTracking=tracking(corrected);
 return {
  schema:'btr.judge-proof.v1',run_id:runId,started_at:startedAt,synthetic:true,
  event:{id:originalTracking.id,received_at:startedAt,match_clock:original.clock,label:'Defender movement observation',source:'Authored synthetic tracking'},
  original:{revision:1,measurement:before.reading,status:before.status,evidence_id:before.source[0],position:originalTracking.position_m,narrative:original.narrative.originalLine},
  corrected:{revision:2,measurement:after.reference,status:after.status,evidence_id:after.current_source[0],position:correctedTracking.position_m,narrative:corrected.narrative.currentLine},
  preserved:{passes:corrected.checks.find(item=>item.id==='passes').reference,sources:corrected.checks.find(item=>item.id==='passes').current_source},
  handoffs:[
   {role:'Scout',action:'OBSERVE',text:'Moreau runs wide while Laurent appears to shift toward the same flank.',evidence:[originalTracking.id]},
   {role:'Guide',action:'EXPLAIN',text:'For a new fan: a defender may move sideways to protect the space a wide runner is trying to open. That explains the idea, not the cause.',evidence:[originalTracking.id]},
   {role:'Vector',action:'CALCULATE',text:`Original tracking measures ${before.reading} of lateral movement.`,evidence:[before.source[0]]},
   {role:'Check',action:'CHALLENGE',text:'Simultaneous movement does not prove the run caused the shift. Hold the causal claim and test the tracking revision.',evidence:[before.source[0]]},
   {role:'Host',action:'PUBLISH R1',text:original.narrative.interpretation,evidence:[before.source[0]]},
   {role:'Truth Lab',action:'REVISE SOURCE',text:`The alternate observation changes Laurent's displacement from ${before.reading} to ${after.reference}.`,evidence:[before.source[0],after.current_source[0]]},
   {role:'Check',action:'WITHDRAW',text:'The defender-movement claim no longer survives the source revision. Two completed passes remain supported.',evidence:[after.current_source[0],...corrected.checks.find(item=>item.id==='passes').current_source]},
   {role:'Host',action:'PUBLISH R2',text:corrected.narrative.currentLine,evidence:[after.current_source[0]]}
  ],
  outcomes:{calculation_updated:before.reading!==after.reference,claim_withdrawn:after.status==='withdrawn',narrative_changed:original.narrative.originalLine!==corrected.narrative.currentLine,unaffected_facts_preserved:original.checks.find(item=>item.id==='passes').reading===corrected.checks.find(item=>item.id==='passes').reference},
  coverage:[
   {label:'SOURCE REVISION',result:'Movement recalculated and withdrawn',status:'demonstrated'},
   {label:'EVIDENCE CUTOFF',result:'Future events stay out of the story',status:'tested'},
   {label:'MISSING TRACKING',result:'Movement claims are withheld',status:'tested'},
   {label:'OUTCOME GUARD',result:'A saved shot never becomes a goal',status:'tested'}
  ],
  limits:['Authored synthetic scenario; the event is injected into a new browser session, not captured from a live stadium feed.','The correction demonstrates source revision and claim withdrawal; it does not prove causation.']
 };
}
