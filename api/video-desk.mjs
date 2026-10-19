import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {accessToken} from './azure.mjs';
import {videoStory} from '../dist/video-story.js';
import {combinedSignal} from './request-guard.mjs';
export const VIDEO_CONTRACT='Use only the supplied observed event and roster. Write distinct, concise football explanations. Scout states observation; Guide teaches one concept; Host synthesizes and asks what evidence to inspect next. Do not infer player intention, tactical causation or a goal from a shot candidate. No claim beyond the cutoff. Current missing tracking prohibits new live claims but does not erase the prior event. Do not add numbers; Vector provides calculations separately. Cite exactly the event ID. At most 60 words per role.';
export function videoCatalog(packet){
 const challenge=/withhold|still claim/i.test(packet.question||''),posts=videoStory({events:[packet.event],ball:packet.tracking?{}:null,players:packet.tracking?[{}]:[]},packet.roster,{challenge});
 const alternate={Scout:packet.event.type==='shot'?'The ball travelled toward the goal mouth. Its measured path supports a shot candidate; the result is not established.':'The receiving player stayed close enough to the ball for a completed-transfer candidate. This is evidence of reception, not of the passer’s intention.',Guide:packet.event.type==='shot'?'The goal mouth is the opening between the posts. A ball travelling toward it may be a shot, but a goal requires separate evidence that it crossed the line.':'Receiving a pass keeps the move going. To judge whether it helped, watch what the receiver can do next rather than treating completion alone as success.',Host:challenge?'Keep the observed event. Withhold the tactical explanation until there is evidence of the defenders’ movement and the next action.':packet.event.type==='shot'?'There is a measurable attempt toward goal. Next, inspect the goal-line outcome; speed alone cannot supply it.':'The transfer is recorded. Next, inspect the receiver’s options before calling it a breakthrough.'};
 return Object.fromEntries(['Scout','Guide','Host'].map(role=>[role,[posts.find(p=>p.role===role).text,alternate[role]]]));
}
export function validateVideoInput(input){if(!Number.isFinite(input?.time)||input.time<0||input.time>60||!Number.isFinite(input.eventTime)||input.eventTime>input.time+.15||input.eventTime<0||!Number.isInteger(input.from)||!['pass','shot'].includes(input.type)||typeof input.tracking!=='boolean'||typeof input.challenge!=='boolean')throw Error('Invalid measured-video request');return input;}
export function validateVideoPost(post,event){if(typeof post?.text!=='string'||!post.text.trim()||post.text.length>700||post.evidence_id!==event.id||/\d/.test(post.text))throw Error('Invalid text or source citation');return post;}
export async function requestVideoRoles(packet,roles,prior=[],token=null,signal){
 const catalog=videoCatalog(packet),schema={type:'object',additionalProperties:false,properties:Object.fromEntries(roles.map(r=>[r,{type:'object',additionalProperties:false,properties:{text:{type:'string',enum:catalog[r]},evidence_id:{type:'string',enum:[packet.event.id]}},required:['text','evidence_id']}])),required:roles};
 const res=await fetch(new URL(`openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT||'gpt-4o-mini'}/chat/completions?api-version=2024-10-21`,process.env.AZURE_OPENAI_ENDPOINT),{method:'POST',headers:{Authorization:'Bearer '+(token||await accessToken('https://cognitiveservices.azure.com/')),'Content-Type':'application/json'},signal:combinedSignal(signal,30000),body:JSON.stringify({messages:[{role:'system',content:VIDEO_CONTRACT},{role:'user',content:JSON.stringify({...packet,roles,prior_public_contributions:prior})}],temperature:0,max_tokens:roles.length*220,response_format:{type:'json_schema',json_schema:{name:'measured_video_roles',strict:true,schema}}})});
 if(!res.ok)throw Error('AI editor HTTP '+res.status);const body=await res.json(),posts=JSON.parse(body.choices[0].message.content);for(const role of roles)if(!catalog[role].includes(posts[role]?.text)||posts[role]?.evidence_id!==packet.event.id)throw Error('Response outside evidence-backed catalog');return {posts,usage:body.usage};
}
export class VideoDesk{
 constructor(narrator,{request,load}={}){this.store=narrator.store;this.requiresToken=!request;this.request=request||requestVideoRoles;this.load=load||(()=>Promise.all(['validation.json','calibration.json'].map(n=>readFile(new URL('../dist/assets/tracking/'+n,import.meta.url),'utf8').then(JSON.parse))));this.pending=new Map();}
 async discuss(raw,emit=()=>{},options={}){
  const input=validateVideoInput(raw),[validation,cal]=await this.load();
  const match=validation.events.find(e=>e.type===input.type&&e.from===input.from&&Math.abs(e.end-input.eventTime)<.5&&e.end<=input.time+.15);if(!match)throw Error('No validated frame event at this cutoff');
  const {truth,matched,...event}=match,packet={event,cutoff:input.time,tracking:input.tracking,roster:cal.roster,question:input.challenge?'What can we still claim, and what must we withhold?':'Explain the observed moment for a new football viewer.'};
  const key=createHash('sha256').update(JSON.stringify({policy:'video-desk-v65-1-bounded-single',event,input:{tracking:input.tracking,challenge:input.challenge}})).digest('hex');
  const cached=await this.store.read(key).catch(()=>null);if(cached?.engine==='azure_video'){for(const p of cached.posts)emit('post',p);emit('complete',{...cached,posts:undefined,cached:true});return cached;}
  if(this.pending.has(key)){const result=await this.pending.get(key);for(const p of result.posts)emit('post',p);emit('complete',{...result,posts:undefined,cached:true});return result;}
  const run=this.run(packet,input,key,emit,options);this.pending.set(key,run);try{return await run;}finally{this.pending.delete(key);}
 }
 async run(packet,input,key,emit,options={}){
  const posts=videoStory({events:[packet.event],ball:input.tracking?{}:null,players:input.tracking?[{}]:[]},packet.roster,{challenge:input.challenge});const raw=[],started=performance.now();let error=null,calls=0;
  try{const token=this.requiresToken?await accessToken('https://cognitiveservices.azure.com/'):null;if(!await this.store.reserve())throw Error('Daily allowance reached');calls++;const response=await this.request(packet,['Scout','Guide','Host'],[],token,options.signal);raw.push(response);const catalog=videoCatalog(packet);for(const role of ['Scout','Guide','Host']){const p=response.posts[role];if(!catalog[role].includes(p?.text)||p?.evidence_id!==packet.event.id)throw Error('Response outside evidence-backed catalog');}for(const role of ['Scout','Guide','Host']){const p=response.posts[role],target=posts.find(x=>x.role===role);Object.assign(target,{text:p.text,engine:'azure_video',source:target.source+' · AI-selected, source-rendered wording'});emit('post',target);}}catch(e){error=e.message;}
  for(const p of posts.filter(p=>p.engine!=='azure_video'))emit('post',p);
  const result={key,posts,engine:error?'partial_or_source_fallback':'azure_video',error,calls,raw,cutoff:packet.cutoff,event_id:packet.event.id,cached:false,elapsed_ms:Math.round(performance.now()-started)};
  if(!error)await this.store.write(key,result).catch(()=>{});emit('complete',{...result,posts:undefined,raw:undefined});return result;
 }
}
