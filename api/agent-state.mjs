import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';

// Durable checkpoints. Blob ETags prevent a second worker overwriting newer work.
// Local runs use atomic files; production uses the existing managed-identity Blob store.
export class AgentState {
 constructor(store={}, {directory=process.env.BTR_STATE_DIR||join(tmpdir(),'btr-agent-state')}={}){this.store=store;this.directory=directory;this.localLocks=new Map();}
 path(key){if(!/^[a-z0-9-]{8,100}$/.test(key))throw Error('Invalid checkpoint key');return `agents/${key}.json`;}
 async read(key){
  const path=this.path(key);
  if(this.store.base){const res=await this.store.blob(path);if(res.status===404)return null;if(!res.ok)throw Error('Checkpoint storage unavailable');return {value:await res.json(),etag:res.headers.get('etag')};}
  try{const value=JSON.parse(await readFile(join(this.directory,key+'.json'),'utf8'));return {value,etag:String(value.version)};}catch(e){if(e.code==='ENOENT')return null;throw e;}
 }
 async write(key,value,etag=null){
  const path=this.path(key),next={...value,version:(value.version||0)+1,updated_at:Date.now()};
  if(this.store.base){const r=await this.store.blob(path,{method:'PUT',headers:{'x-ms-blob-type':'BlockBlob','Content-Type':'application/json',...(etag?{'If-Match':etag}:{'If-None-Match':'*'})},body:JSON.stringify(next)});if([409,412].includes(r.status))throw Error('Checkpoint conflict; reconnect to the current run');if(!r.ok)throw Error('Checkpoint could not be saved');return {value:next,etag:r.headers.get('etag')};}
  // Serialize local writers as well as checking their version.
  const prior=this.localLocks.get(key)||Promise.resolve();let release;const lock=new Promise(r=>release=r);this.localLocks.set(key,lock);await prior;
  try{const current=await this.read(key);if((current?.etag||null)!==etag)throw Error('Checkpoint conflict; reconnect to the current run');await mkdir(this.directory,{recursive:true});const temp=join(this.directory,key+'.'+randomBytes(6).toString('hex')+'.tmp');await writeFile(temp,JSON.stringify(next));await rename(temp,join(this.directory,key+'.json'));return {value:next,etag:String(next.version)};}finally{release();if(this.localLocks.get(key)===lock)this.localLocks.delete(key);}
 }
 async open(key,initial){return new Journal(this,key,await this.read(key)||await this.write(key,initial));}
}
export class Journal {
 constructor(state,key,record){this.state=state;this.key=key;this.record=record;this.queue=Promise.resolve();}
 get value(){return this.record.value;}
 async change(fn){const operation=this.queue.then(async()=>{const next=structuredClone(this.value);fn(next);this.record=await this.state.write(this.key,next,this.record.etag);return this.value;});this.queue=operation.catch(()=>{});return operation;}
}
export class DeskInterrupted extends Error {constructor(){super('Worker stopped after the specialist checkpoint. Resume to continue from saved work.');this.code='CHECKPOINT_INTERRUPTED';}}
