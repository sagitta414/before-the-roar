import {PRESENTER_IDS} from './presenter-profiles.js';
export function normalizeQuestion(value=''){
 if(typeof value!=='string'||value.length>180)throw Error('Keep your question under 180 characters.');
 return value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
}
export const partyKey=(language,mode,question='')=>JSON.stringify([language,mode,normalizeQuestion(question)]);
export class PartyThread{
 constructor(language,mode,question=''){this.language=language;this.mode=mode;this.question=normalizeQuestion(question);this.posts=new Map();this.drafts=new Map();this.pending=true;this.complete=false;this.error='';this.speaker='analyst';}
 accept(type,data){
  if(type==='speaker')this.speaker=data.role;
  if(!PRESENTER_IDS.includes(data.role)&&['draft','post'].includes(type))return;
  if(type==='draft'&&!this.posts.has(data.role))this.drafts.set(data.role,data);
  if(type==='post'){this.posts.set(data.role,data);this.drafts.delete(data.role);}
  if(type==='complete'){this.pending=false;this.complete=true;this.drafts.clear();}
 }
 fail(message){this.error=message;this.pending=false;this.drafts.clear();}
}
