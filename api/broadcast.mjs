import {randomBytes,timingSafeEqual} from 'node:crypto';
import {matchStory} from '../dist/match-story.js';
import {pitchsideStory,PITCHSIDE} from '../dist/pitchside-story.js';
import {PLAYERS} from '../dist/engine.js';

export function broadcastInput(input){
 if(!input||!['pitchside','match'].includes(input.source)||!['en','es','pt'].includes(input.language)||!['fan','beginner','math','analyst','player'].includes(input.mode))throw Error('Choose a valid source, language and perspective.');
 const limit=input.source==='pitchside'?PITCHSIDE.duration:36;
 if(!Number.isFinite(input.time)||input.time<0||input.time>limit)throw Error('Invalid evidence cutoff.');
 if(input.source==='pitchside'){
  if(input.clip_id!==PITCHSIDE.id)throw Error('Unknown film.');
  return {source:input.source,clip_id:PITCHSIDE.id,time:input.time,language:input.language,mode:input.mode,clipChallenge:input.clipChallenge===true};
 }
 if(!['wide','press','counter'].includes(input.scenario)||!PLAYERS.some(p=>p.id===input.focus)||!['harbor','north','neutral'].includes(input.team)||typeof input.corrected!=='boolean')throw Error('Invalid match session.');
 return {source:'match',scenario:input.scenario,time:input.time,language:input.language,mode:input.mode,focus:input.focus,team:input.team,corrected:input.corrected};
}
export function broadcastCue(input,sequence,now){
 const s=input.source==='pitchside'?pitchsideStory(input):matchStory(input);
 return {schema:'btr.broadcast-cue.v1',sequence,issued_at:now,expires_at:now+6000,source:input.source,source_id:input.source==='pitchside'?PITCHSIDE.id:input.scenario,cutoff:s.cutoff,clock:s.clock,revision:s.revision,language:s.language,mode:s.mode,title:s.title,body:s.body,evidence_ids:s.evidence.map(e=>e.id),placement:'lower-left',display_duration_ms:6000};
}
export class BroadcastRooms{
 constructor({clock=()=>Date.now(),ttl=30*60e3,max=32}={}){this.clock=clock;this.ttl=ttl;this.max=max;this.rooms=new Map();}
 prune(){for(const [id,r]of this.rooms)if(r.expires<=this.clock()){for(const client of r.clients)client.end();this.rooms.delete(id);}}
 create(input){this.prune();if(this.rooms.size>=this.max)throw Error('The broadcast desk is full.');const state=broadcastInput(input),id=randomBytes(12).toString('hex'),writeKey=randomBytes(24).toString('hex'),readKey=randomBytes(24).toString('hex');const r={id,writeKey,readKey,expires:this.clock()+this.ttl,clients:new Set(),sequence:0,closed:false,lastUpdate:-Infinity};r.cue=broadcastCue(state,++r.sequence,this.clock());this.rooms.set(id,r);return {id,writeKey,readKey,expires_at:r.expires};}
 get(id){this.prune();return this.rooms.get(id);}
 authorized(room,key,write=false){const expected=write?room.writeKey:room.readKey;return typeof key==='string'&&/^[a-f0-9]{48}$/.test(key)&&timingSafeEqual(Buffer.from(key),Buffer.from(expected));}
 update(room,input){if(room.closed)throw Error('Broadcast has stopped.');const now=this.clock();if(now-room.lastUpdate<250)throw Error('Updates are too frequent.');room.cue=broadcastCue(broadcastInput(input),++room.sequence,now);room.lastUpdate=now;this.publish(room,'cue',room.cue);return room.cue;}
 publish(room,type,data){for(const client of room.clients){if(client.destroyed||client.writableLength>256000){client.destroy();room.clients.delete(client);}else client.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);}}
 subscribe(room,res){if(room.clients.size>=6)return false;res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'});res.write(`event: connected\ndata: ${JSON.stringify({expires_at:room.expires})}\n\n`);if(room.closed){res.write('event: stopped\ndata: {}\n\n');res.end();return true;}if(room.cue.expires_at>this.clock())res.write(`event: cue\ndata: ${JSON.stringify(room.cue)}\n\n`);room.clients.add(res);res.on('close',()=>room.clients.delete(res));return true;}
 stop(room){room.closed=true;this.publish(room,'stopped',{});for(const client of room.clients)client.end();room.clients.clear();}
 close(){for(const room of this.rooms.values())this.stop(room);this.rooms.clear();}
}
