import {createHash} from 'node:crypto';
import {CLIP_BEATS} from '../dist/featured-clip.js';
import {accessToken} from './azure.mjs';
import {readCompletion,draftInterpretations} from './streaming.mjs';

export const DESK_ROLES=[
 {id:'analyst',name:'Tactical analyst',brief:'Offer one useful, tentative interpretation of the visible duel, carry or shot. Cite a specific reviewed observation. Do not infer team shape, measured speed, intent or outcome.'},
 {id:'reviewer',name:'Evidence reviewer',brief:'Respond directly to the analyst’s published contribution. Accept ONLY its observable claim, then name the precise missing evidence. Do not endorse an inference just because the analyst suggested it. The clip does not establish motivation, ability, team tactics, emotions or outcome. A nearby defender is visible; the effectiveness of that pressure is unknown. A useful review says which part of the analyst statement is observable and which is uncertain.'},
 {id:'presenter',name:'Match presenter',brief:'Respond to the analyst and reviewer with a concise audience-appropriate takeaway. Keep only supported observations from the prior statements. Give one concrete replay cue, such as the change from carrying to striking. Explicitly say the result is unconfirmed; replay does not guarantee resolving it. Do not assign motivation or ability.'}
];
export const VIDEO_EVIDENCE=CLIP_BEATS.map(b=>({id:b.id,second:b.at,observation:b.observation[0]}));
const ids=VIDEO_EVIDENCE.map(e=>e.id);
export const deskSchema={type:'object',additionalProperties:false,properties:{post:{type:'object',additionalProperties:false,properties:{interpretation:{type:'string'},headline:{type:'string'},caution:{type:'string'},evidence_ids:{type:'object',additionalProperties:false,properties:{primary:{type:'string',enum:ids},secondary:{type:['string','null'],enum:[...ids,null]}},required:['primary','secondary']}},required:['interpretation','headline','caution','evidence_ids']}},required:['post']};
export function validatePost(raw){
 const p=raw?.post;
 for(const f of ['interpretation','headline','caution'])if(typeof p?.[f]!=='string'||!p[f].trim()||p[f].length>1000||/\d/.test(p[f]))throw Error('Invalid public contribution');
 // Conservative guard for known overclaims; citations alone do not validate semantics.
 if(/tactical intent|individual skill|intenci[oó]n t[aá]ctica|habilidad individual|inten[çc][aã]o t[aá]tica|habilidade individual/i.test(p.interpretation+' '+p.headline))throw Error('Unsupported intent or ability claim');
 const citations=[p.evidence_ids?.primary,p.evidence_ids?.secondary].filter(x=>x!==null&&x!==undefined);
 if(!citations.length||citations.some(x=>!ids.includes(x)))throw Error('Unsupported video evidence');
 return {summary:p.interpretation,title:p.headline,caution:p.caution,evidence_ids:[...new Set(citations)]};
}
export function deskFallback(role,language){
 const copy={en:[['Watch the next touch','The reviewed clip shows an attacker moving from a close duel into a shooting action. Replay the carry and watch the transition into the strike.'],['Keep the result open','The goalkeeper raises both gloves, but contact and the final ball trajectory are unclear. The attacker’s reaction cannot establish the outcome.'],['A shot, a reaction, an open question','The visible story is the duel, forward carry, shot and goalkeeper response. We cannot confirm a goal or save from this clip.']],es:[['Mira el siguiente toque','El clip revisado muestra un duelo cercano, una conducción y un disparo. Repite la conducción y observa cómo llega al remate.'],['El resultado sigue abierto','El portero levanta ambos guantes, pero el contacto y la trayectoria final no están claros. La reacción del atacante no demuestra el resultado.'],['Un disparo y una pregunta abierta','La secuencia visible es duelo, conducción, disparo y reacción del portero. No podemos confirmar un gol ni una parada.']],pt:[['Observe o próximo toque','O vídeo revisado mostra um duelo próximo, uma condução e um chute. Reveja a condução e a passagem para a finalização.'],['O resultado continua aberto','O goleiro levanta as luvas, mas o contato e a trajetória final não estão claros. A reação do atacante não comprova o resultado.'],['Um chute e uma pergunta em aberto','A sequência visível é duelo, condução, chute e reação do goleiro. Não podemos confirmar gol ou defesa.']]};
 const i=DESK_ROLES.findIndex(r=>r.id===role),c=copy[language]||copy.en;
 return {role,title:c[i][0],summary:c[i][1],caution:{en:'Reviewed notes · live AI unavailable.',es:'Notas revisadas · IA en vivo no disponible.',pt:'Notas revisadas · IA ao vivo indisponível.'}[language]||'Reviewed notes · live AI unavailable.',evidence_ids:i===0?['featured-carry','featured-shot']:['featured-keeper','featured-reaction'],engine:'reviewed_fallback'};
}
export class DiscussionDesk{
 constructor(narrator){this.narrator=narrator;this.store=narrator.store;this.jobs=new Map();}
 async discuss({language='en',mode='fan'},listener){
  const key=createHash('sha256').update(JSON.stringify({v:'video-desk-v2',model:process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini',language,mode,evidence:VIDEO_EVIDENCE})).digest('hex');
  let job=this.jobs.get(key);
  if(job){job.listeners.add(listener);for(const frame of job.history)listener(frame.type,frame.data);try{return await job.promise;}finally{job.listeners.delete(listener);}}
  job={listeners:new Set([listener]),history:[]};this.jobs.set(key,job);
  const emit=(type,data)=>{const f={type,data};if(type==='draft'){const i=job.history.findIndex(x=>x.type==='draft'&&x.data.role===data.role);if(i>=0)job.history.splice(i,1);}if(type==='post')job.history=job.history.filter(x=>x.data.role!==data.role||x.type!=='draft');job.history.push(f);for(const fn of job.listeners){try{fn(type,data);}catch{}}};
  job.promise=this.generate(key,{language,mode},emit);
  try{return await job.promise;}finally{this.jobs.delete(key);}
 }
 async generate(key,{language,mode},emit){
  const posts=[];
  try{
   const cached=await this.store.read(key);
   if(cached?.schema==='btr.video-desk.v1'&&cached.posts?.length===3){for(const post of cached.posts){posts.push(post);emit('post',{...post,cached:true});}emit('complete',{cached:true,posts:3});return posts;}
  }catch{/* Storage unavailable: each request below will fail closed on reserve. */}
  for(const role of DESK_ROLES){
   emit('speaker',{role:role.id});const started=performance.now();let acquired=false;
   try{
    if(!process.env.AZURE_OPENAI_ENDPOINT||this.narrator.busy>=2)throw Error('AI unavailable or busy');
    this.narrator.busy++;acquired=true;
    if(!await this.store.reserve())throw Error('Daily allowance reached');
    const token=await accessToken('https://cognitiveservices.azure.com/');
    const audience={fan:'A curious football fan.',beginner:'A newcomer. Define football terms, use plain language, no assumed knowledge.',math:'A math-curious viewer. Explain why speed needs calibrated distance and time; video timestamps alone do not measure speed. No invented measurements.',analyst:'An experienced viewer. Be precise about visible evidence and tactical uncertainty.',player:'Follow the lime-shirted attacker only. No verified identity; no emotion inference.'}[mode];
    const system=`You are the ${role.name} on Before the Roar's public AI studio panel. ${role.brief} Write in ${{en:'English',es:'Spanish',pt:'Brazilian Portuguese'}[language]}. Audience: ${audience} Produce a public editorial contribution, NOT private chain-of-thought or internal reasoning. Your interpretation is at most sixty words, the headline at most eight words, and caution one short specific limit. Refer to previous panel contributions when provided. This eight-second AI-generated film has MANUALLY reviewed observations, not automated vision. Use only the supplied observations. The wider match score, player identity, coordinates, speed, pass accuracy, shot outcome and emotions are UNKNOWN. Motivation and ability cannot be established. Never use the phrases tactical intent or individual skill, including translations. Focus on the observable sequence: facing a nearby defender, carrying, striking, goalkeeper raising gloves. Explain a possible immediate significance without inventing decisions or team strategy. No digits or spelled-out numerical statistics in prose. No claimed goal, save or calibrated metric. A hypothesis must say may/could or equivalent. Do not say you watched or processed pixels. Put evidence IDs ONLY in evidence_ids, not in prose. Use specific source observations, not prior model statements, as evidence. Return strict JSON.`;
    const url=new URL(`openai/deployments/${encodeURIComponent(process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini')}/chat/completions?api-version=2024-10-21`,process.env.AZURE_OPENAI_ENDPOINT);
    const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify({messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({evidence:VIDEO_EVIDENCE,previous_public_contributions:posts.map(p=>({role:p.role,summary:p.summary,caution:p.caution,evidence_ids:p.evidence_ids}))})}],temperature:.2,max_tokens:650,stream:true,stream_options:{include_usage:true},response_format:{type:'json_schema',json_schema:{name:'studio_contribution',strict:true,schema:deskSchema}}})});
    if(!response.ok)throw Error(`Model HTTP ${response.status}`);
    let previous='',first=null;
    const result=await readCompletion(response.body,content=>{const draft=draftInterpretations(content,['post']).post;if(draft&&draft!==previous){previous=draft;first??=Math.round(performance.now()-started);emit('draft',{role:role.id,summary:draft,first_text_ms:first});}});
    const post={...validatePost(JSON.parse(result.content)),role:role.id,engine:'azure_openai',latency_ms:Math.round(performance.now()-started),first_text_ms:first,model:process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini'};posts.push(post);emit('post',post);
   }catch(error){console.warn(JSON.stringify({event:'desk_fallback',role:role.id,message:error.message}));const post=deskFallback(role.id,language);posts.push(post);emit('post',post);}
   finally{if(acquired)this.narrator.busy--;}
  }
  if(posts.every(p=>p.engine==='azure_openai'))try{await this.store.write(key,{schema:'btr.video-desk.v1',posts});}catch{}
  emit('complete',{cached:false,posts:posts.length});return posts;
 }
}
