import {validateMatchPost,repeatsContribution} from './match-desk.mjs';
export const EVALUATION_CASES=[
 {id:'wide-original',input:{source:'match',scenario:'wide',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'}},
 {id:'wide-corrected',input:{source:'match',scenario:'wide',time:16,corrected:true,language:'en',mode:'analyst',focus:7,team:'harbor'}},
 {id:'pressure-to-chance',input:{source:'match',scenario:'press',time:29,corrected:false,language:'en',mode:'analyst',focus:8,team:'harbor'}}
];
export const MODEL_ROLES=['analyst','guide','presenter'];
export function comparisonSchema(ids){
 const result={type:'object',additionalProperties:false,properties:{},required:MODEL_ROLES};
 for(const role of MODEL_ROLES){const main=role==='guide'?'viewing_question':role==='presenter'?'takeaway':'interpretation';const fields={[main]:{type:'string'},headline:{type:'string'},caution:{type:'string'},evidence_ids:{type:'object',additionalProperties:false,properties:{primary:{type:'string',enum:ids},secondary:{type:['string','null'],enum:[...ids,null]}},required:['primary','secondary']}};if(role==='presenter')fields.replay_cue={type:'string'};result.properties[role]={type:'object',additionalProperties:false,properties:fields,required:Object.keys(fields)};}
 return result;
}
export function evaluateBaseline(raw,packet){
 const accepted=[],rejections=[];
 for(const role of MODEL_ROLES){try{const post=validateMatchPost({post:raw?.[role]},packet,role);if(role==='presenter'&&repeatsContribution(post.summary,accepted))throw Error('Repeated contribution');accepted.push({...post,role,engine:'azure_openai',cutoff:packet.cutoff,revision:packet.revision});}catch(e){rejections.push({role,reason:e.message});}}
 return {posts:accepted,rejections,accepted:accepted.length,rejected:rejections.length};
}
export function evaluationSummary(cases){
 return Object.fromEntries(['team','baseline'].map(arm=>{const values=cases.map(c=>c[arm]).filter(Boolean),accepted=values.reduce((sum,v)=>sum+(arm==='team'?v.posts.filter(p=>p.engine==='azure_openai').length:v.accepted),0);return [arm,{accepted:accepted+'/'+values.length*3,rejected:values.reduce((sum,v)=>sum+(arm==='team'?v.posts.filter(p=>MODEL_ROLES.includes(p.role)&&p.engine!=='azure_openai').length:v.rejected),0),requests:values.reduce((sum,v)=>sum+v.requests,0),seconds:Math.round(values.reduce((sum,v)=>sum+v.elapsed_ms,0)/100)/10}];}));
}
