import {SCENARIOS} from './engine.js';
import {truthStoryPacket} from './truth-story-model.js';

const scenario=SCENARIOS.find(item=>item.id==='wide');
const movement=packet=>packet.checks.find(item=>item.id==='movement');
const tracking=packet=>packet.evidence.filter(item=>item.record_type==='tracking').at(-1);

export function judgeProof({runId='preview',startedAt=0}={}){
 const original=truthStoryPacket(scenario,18,false,'analyst','en');
 const corrected=truthStoryPacket(scenario,18,true,'analyst','en');
 const before=movement(original),after=movement(corrected);
 return {
  schema:'btr.judge-proof.v1',run_id:runId,started_at:startedAt,synthetic:true,
  event:{id:'wide-track-102-450',received_at:startedAt,match_clock:'67:18',label:'Defender movement observation',source:'Authored synthetic tracking'},
  original:{revision:1,measurement:before.reading,status:before.status,evidence_id:before.source[0],position:tracking(original).position_m,narrative:original.narrative.originalLine},
  corrected:{revision:2,measurement:after.reference,status:after.status,evidence_id:after.current_source[0],position:tracking(corrected).position_m,narrative:corrected.narrative.currentLine},
  preserved:{passes:corrected.checks.find(item=>item.id==='passes').reference,sources:corrected.checks.find(item=>item.id==='passes').current_source},
  handoffs:[
   {role:'Scout',action:'OBSERVE',text:'Moreau runs wide while Laurent appears to shift toward the same flank.',evidence:['wide-track-102-450']},
   {role:'Guide',action:'EXPLAIN',text:'For a new fan: a defender may move sideways to protect the space a wide runner is trying to open. That explains the idea, not the cause.',evidence:['wide-track-102-450']},
   {role:'Vector',action:'CALCULATE',text:`Original tracking measures ${before.reading} of lateral movement.`,evidence:[before.source[0]]},
   {role:'Check',action:'CHALLENGE',text:'Simultaneous movement does not prove the run caused the shift. Hold the causal claim and test the tracking revision.',evidence:[before.source[0]]},
   {role:'Host',action:'PUBLISH R1',text:original.narrative.interpretation,evidence:[before.source[0]]},
   {role:'Truth Lab',action:'REVISE SOURCE',text:`The alternate observation changes Laurent's displacement from ${before.reading} to ${after.reference}.`,evidence:[before.source[0],after.current_source[0]]},
   {role:'Check',action:'WITHDRAW',text:'The defender-movement claim no longer survives the source revision. Two completed passes remain supported.',evidence:[after.current_source[0],...corrected.checks.find(item=>item.id==='passes').current_source]},
   {role:'Host',action:'PUBLISH R2',text:corrected.narrative.currentLine,evidence:[after.current_source[0]]}
  ],
  outcomes:{calculation_updated:before.reading!==after.reference,claim_withdrawn:after.status==='withdrawn',narrative_changed:original.narrative.originalLine!==corrected.narrative.currentLine,unaffected_facts_preserved:original.checks.find(item=>item.id==='passes').reading===corrected.checks.find(item=>item.id==='passes').reference},
  limits:['Authored synthetic scenario; the event is injected into a new browser session, not captured from a live stadium feed.','The correction demonstrates source revision and claim withdrawal; it does not prove causation.']
 };
}
