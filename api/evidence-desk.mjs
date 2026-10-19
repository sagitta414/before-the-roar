import {createHash} from 'node:crypto';
import {normalizeStudio,studioInsight,choose} from '../dist/studio-insight.js';
import {auditEvidence} from '../dist/evidence-audit.js';
import {PLAN_POLICY,proposePlan,verifyPlan} from './review-planner.mjs';
import {accessToken} from './azure.mjs';
export class EvidenceDesk{
 constructor(narrator,{select}={}){this.narrator=narrator;this.select=select;this.pending=new Map();}
 async review(raw,options={}){
  const input=normalizeStudio(raw),previous=raw.previous?normalizeStudio(raw.previous):null;
  if(previous&&previous.scenario!==input.scenario)throw Error('Previous evidence belongs to another scenario');
  const intent=raw.intent||'opening';if(!['opening','challenge','math'].includes(intent))throw Error('Invalid review intent');
  const key=createHash('sha256').update(JSON.stringify({policy:PLAN_POLICY,input,previous,intent})).digest('hex');
  const saved=await this.narrator.store.read(key).catch(()=>null);if(saved?.engine==='azure_selection')return {...saved,cached:true};
  if(this.pending.has(key))return this.pending.get(key);
   const run=this.run(input,previous,key,intent,options);this.pending.set(key,run);try{return await run;}finally{this.pending.delete(key);}
 }
 async run(input,previous,key,intent='opening',options={}){
  const now=studioInsight(input),before=previous?studioInsight(previous):null,start=performance.now();
  const audit=auditEvidence(input,previous);let plan=null,usage=null,validation=null;
  let focus='change',engine='azure_selection',error=null,acquired=false;
  try{
   if(!this.select&&!process.env.AZURE_OPENAI_ENDPOINT)throw Error('AI unavailable');
   if((this.narrator.busy||0)>=2)throw Error('AI desk is busy');
   this.narrator.busy=(this.narrator.busy||0)+1;acquired=true;
    const token=this.select?null:await accessToken('https://cognitiveservices.azure.com/');
    if(!await this.narrator.store.reserve())throw Error('Daily allowance reached');
   const packet={current:now.receipt,previous:before?.receipt||null,intent};
   if(this.select)focus=await this.select(packet);
    else{const proposal=await proposePlan(packet,{token,signal:options.signal});plan=proposal.plan;usage=proposal.usage;validation=verifyPlan(plan,packet);if(!validation.accepted)throw Error('Plan rejected: '+validation.errors.join('; '));focus=plan.tool==='pass_progression'?'measurement':'change';}
   if(!['change','measurement','learning'].includes(focus))throw Error('Invalid editorial selection');
  }catch(e){engine='reviewed_fallback';error=e.message;plan=null;}finally{if(acquired)this.narrator.busy--;}
  const posts=now.roles.map(p=>({...p,engine:['math','reviewer'].includes(p.role)?'evidence_rules':engine}));
  const host=posts.find(p=>p.role==='presenter'),l=input.language;
  if(focus==='measurement'){host.summary=audit.progression.summary+' '+now.limit;host.evidence_ids=[...new Set([...host.evidence_ids,...audit.progression.evidence_ids])];}
  if(focus==='learning')host.summary=now.roles[0].summary+' '+choose(l,'Watch what changes on the pitch, then separate the observation from its possible explanation.','Observa qué cambia en el campo y separa la observación de su posible explicación.','Observe o que muda no campo e separe a observação da possível explicação.');
  const math=posts.find(p=>p.role==='math'),guide=posts.find(p=>p.role==='guide'),check=posts.find(p=>p.role==='reviewer');
  guide.summary=audit.audiences.beginner;
  if(intent!=='opening'||plan?.tool==='pass_progression'){math.summary=audit.progression.summary;math.evidence_ids=audit.progression.evidence_ids;math.working=audit.progression.equation;}
  if(intent==='challenge'){check.summary=audit.ledger.map(x=>x.text).join(' ');host.summary=now.change+' '+now.limit;host.evidence_ids=[...now.roles[0].evidence_ids,now.scope];}
  if(!input.tracking&&intent==='challenge')host.summary=choose(l,'Player tracking must be restored before comparing defensive movement. The completed passes still support the progression calculation.','Hay que restaurar el seguimiento antes de comparar movimientos defensivos. Los pases completados aún permiten calcular la progresión.','Restaure o rastreamento antes de comparar movimentos defensivos. Os passes completos ainda permitem calcular a progressão.');
  const questions={defensive_shape:audit.question,pass_route:choose(l,'Which completed pass contributes most to forward progression?','¿Qué pase completado aporta más progresión?','Qual passe completo mais contribui para a progressão?'),next_event:choose(l,'What does the next completed event establish that this cutoff cannot?','¿Qué establece el siguiente evento completado que este instante no permite?','O que o próximo evento completo estabelece que este instante não permite?')};
  const nextQuestion=questions[plan?.next_question||(!input.tracking?'pass_route':'defensive_shape')];
  if(intent==='challenge')host.summary+=' '+nextQuestion;
  const tool=plan?.tool||(intent==='math'?'pass_progression':'source_delta');
  const toolResult=tool==='pass_progression'?audit.progression:{summary:now.change,delta:tool==='source_delta'?audit.delta:undefined,evidence_ids:now.roles[0].evidence_ids};
  const available=new Set(now.receipt.records.map(r=>r.id));for(const post of posts)if(post.evidence_ids.some(id=>!available.has(id)))throw Error('Evidence reference outside current snapshot');
  const result={key,engine,focus,error,cached:false,elapsed_ms:Math.round(performance.now()-start),receipt:now.receipt,previous:before?.receipt.snapshot||null,posts,intent,plan,validation,usage,delta:audit.delta,ledger:audit.ledger,audiences:audit.audiences,tool_result:{tool,...toolResult},next_question:nextQuestion,policy:'One Azure analyst proposes an evidence tool and citations. Verified calculations and source-rendered roles constrain public claims; this is not five independent models.'};
  if(engine==='azure_selection')await this.narrator.store.write(key,result).catch(()=>{});
  return result;
 }
}
