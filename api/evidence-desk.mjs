import {createHash} from 'node:crypto';
import {accessToken} from './azure.mjs';
import {normalizeStudio,studioInsight,choose} from '../dist/studio-insight.js';
export class EvidenceDesk{
 constructor(narrator,{select}={}){this.narrator=narrator;this.select=select;this.pending=new Map();}
 async review(raw){
  const input=normalizeStudio(raw),previous=raw.previous?normalizeStudio(raw.previous):null;
  if(previous&&previous.scenario!==input.scenario)throw Error('Previous evidence belongs to another scenario');
  const key=createHash('sha256').update(JSON.stringify({policy:'studio-v58',input,previous})).digest('hex');
  const saved=await this.narrator.store.read(key).catch(()=>null);if(saved?.engine==='azure_selection')return {...saved,cached:true};
  if(this.pending.has(key))return this.pending.get(key);
  const run=this.run(input,previous,key);this.pending.set(key,run);try{return await run;}finally{this.pending.delete(key);}
 }
 async run(input,previous,key){
  const now=studioInsight(input),before=previous?studioInsight(previous):null,start=performance.now();
  let focus='change',engine='azure_selection',error=null,acquired=false;
  try{
   if(!this.select&&!process.env.AZURE_OPENAI_ENDPOINT)throw Error('AI unavailable');
   if((this.narrator.busy||0)>=2)throw Error('AI desk is busy');
   this.narrator.busy=(this.narrator.busy||0)+1;acquired=true;
   if(!await this.narrator.store.reserve())throw Error('Daily allowance reached');
   const packet={current:now.receipt,previous:before?.receipt||null,contributions:now.roles};
   if(this.select)focus=await this.select(packet);
   else{
    const response=await fetch(new URL(`openai/deployments/${encodeURIComponent(process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini')}/chat/completions?api-version=2024-10-21`,process.env.AZURE_OPENAI_ENDPOINT),{method:'POST',headers:{Authorization:`Bearer ${await accessToken('https://cognitiveservices.azure.com/')}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(18000),body:JSON.stringify({messages:[{role:'system',content:'Choose the editorial focus for a five-role evidence review. Compare previous and current source records. Use change when the cutoff, revision or tracking availability changed; measurement for unchanged measured evidence; learning when a concept needs explaining. Tracking omitted from current records is unavailable even if it existed previously. One AI editor selects the emphasis; public wording is source-rendered. Return only the schema.'},{role:'user',content:JSON.stringify(packet)}],temperature:0,max_tokens:70,response_format:{type:'json_schema',json_schema:{name:'review_focus',strict:true,schema:{type:'object',additionalProperties:false,properties:{focus:{type:'string',enum:['change','measurement','learning']}},required:['focus']}}}})});
    if(!response.ok)throw Error('AI selection HTTP '+response.status);focus=JSON.parse((await response.json()).choices[0].message.content).focus;
   }
   if(!['change','measurement','learning'].includes(focus))throw Error('Invalid editorial selection');
  }catch(e){engine='reviewed_fallback';error=e.message;}finally{if(acquired)this.narrator.busy--;}
  const posts=now.roles.map(p=>({...p,engine:['math','reviewer'].includes(p.role)?'evidence_rules':engine}));
  const host=posts.find(p=>p.role==='presenter'),l=input.language;
  if(focus==='measurement')host.summary=now.roles[0].summary+' '+choose(l,'The pass speed is an endpoint average, not a measured peak.','La velocidad del pase es una media entre puntos, no un máximo medido.','A velocidade do passe é uma média entre pontos, não um pico medido.');
  if(focus==='learning')host.summary=now.roles[0].summary+' '+choose(l,'Watch what changes on the pitch, then separate the observation from its possible explanation.','Observa qué cambia en el campo y separa la observación de su posible explicación.','Observe o que muda no campo e separe a observação da possível explicação.');
  const available=new Set(now.receipt.records.map(r=>r.id));for(const post of posts)if(post.evidence_ids.some(id=>!available.has(id)))throw Error('Evidence reference outside current snapshot');
  const result={key,engine,focus,error,cached:false,elapsed_ms:Math.round(performance.now()-start),receipt:now.receipt,previous:before?.receipt.snapshot||null,posts,policy:'One AI editor chooses an emphasis; five public roles use source-rendered wording and verified references.'};
  if(engine==='azure_selection')await this.narrator.store.write(key,result).catch(()=>{});
  return result;
 }
}
