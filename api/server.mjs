import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {generateMatch,initialState,ingest,snapshot,evidencePacket} from './match.mjs';
import {Narrator,fallback} from './azure.mjs';
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.svg':'image/svg+xml'};
export function createApp({narrator=new Narrator(),clock=()=>Date.now()}={}){
 const root=resolve('dist'),runs=new Map(),rates=new Map();let created=0;
 function emit(run,type,data){const item={id:++run.serial,type,data};run.history.push(item);if(run.history.length>80)run.history.shift();for(const client of run.clients){if(client.writableLength>256000){client.destroy();run.clients.delete(client);}else client.write(`id: ${item.id}\nevent: ${type}\ndata: ${JSON.stringify(data)}\n\n`);}}
 function explain(run,second){const packet=evidencePacket(run.match,run.state,second,run.language);emit(run,'thinking',{cutoff:second,recap:second===5400});
  narrator.explain(packet).catch(()=>fallback(packet)).then(result=>{if(!runs.has(run.id)||run.stopped)return;const item={...result,cutoff:second,recap:second===5400,evidence:packet.facts,stats:packet.stats,match_id:run.match.id};run.insights.push(item);emit(run,second===5400?'recap':'insight',item);if(second===5400){run.completed=true;emit(run,'complete',{duration:5400,events:run.state.count,score:run.state.score});for(const c of run.clients)c.end();run.clients.clear();}});
 }
 function tick(){
  for(const run of runs.values()){
   if(clock()-run.created>15*60e3){for(const c of run.clients)c.end();runs.delete(run.id);continue;}
   if(!run.clients.size&&clock()-(run.disconnected??run.created)>60000)run.stopped=true;
   if(run.completed||run.stopped||!run.clients.size||run.fulltime){run.lastTick=clock();continue;}
   const target=Math.min(5400,run.current+(clock()-(run.lastTick??clock()))/1000*run.speed),batch=[];run.lastTick=clock();
   while(run.nextCheckpoint<=target){
    while(run.cursor<run.match.events.length&&run.match.events[run.cursor].second<=run.nextCheckpoint){const e=run.match.events[run.cursor++];ingest(run.state,e);batch.push(e);}
    explain(run,run.nextCheckpoint);run.nextCheckpoint+=900;
   }
   while(run.cursor<run.match.events.length&&run.match.events[run.cursor].second<=target){const e=run.match.events[run.cursor++];ingest(run.state,e);batch.push(e);}
   run.current=target;emit(run,'state',{stats:snapshot(run.state,target),batch,server_time:clock(),processing_ms:Math.round((performance.now()-run.tickStart||0)*10)/10});
   if(target>=5400)run.fulltime=true;
  }
 }
 const timer=setInterval(()=>{for(const r of runs.values())r.tickStart=performance.now();tick();},500);timer.unref();
 const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  const origin=req.headers.origin,allowed=new Set((process.env.ALLOWED_ORIGINS||'https://before-the-roar.sagitta107.chatgpt.site,http://127.0.0.1:4396,http://127.0.0.1:4397').split(','));
  if(origin&&allowed.has(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');}
  if(req.method==='OPTIONS'){res.writeHead(origin&&!allowed.has(origin)?403:204).end();return;}
  let route;try{route=new URL(req.url,'http://local').pathname;}catch{return send(res,400,{error:'Invalid URL'});}
  try{
   if(route==='/api/health')return send(res,200,{ok:true,service:'Before the Roar · Azure Intelligence',model:process.env.AZURE_OPENAI_DEPLOYMENT||null,ai_configured:!!process.env.AZURE_OPENAI_ENDPOINT,persistent_cache:!!process.env.AZURE_STORAGE_URL,allowance:Number(process.env.AI_DAILY_LIMIT||120),active_runs:[...runs.values()].filter(r=>!r.completed&&!r.stopped).length,version:'1.0.0'});
   if(route==='/api/runs'&&req.method==='POST'){
    if(origin&&!allowed.has(origin)&&origin!==`https://${req.headers.host}`&&origin!==`http://${req.headers.host}`)return send(res,403,{error:'Origin not allowed'});
    if([...runs.values()].filter(r=>!r.completed&&!r.stopped).length>=6)return send(res,429,{error:'The studio is busy. Try again in a minute.'});
    const ip=req.headers['x-forwarded-for']?.split(',')[0]||req.socket.remoteAddress;
    const rate=rates.get(ip)||{n:0,until:clock()+600000};if(rate.until<clock()){rate.n=0;rate.until=clock()+600000;}if(rate.n>=6)return send(res,429,{error:'Please wait before starting another match.'});
    if(rates.size>1000)for(const [k,v] of rates)if(v.until<clock())rates.delete(k);
    let body='';for await(const c of req){body+=c;if(body.length>2048)return send(res,413,{error:'Request too large'});}
    let input;try{input=JSON.parse(body);}catch{return send(res,400,{error:'Invalid JSON'});}
    const {seed=7,language='en',speed=90}=input;if(!Number.isInteger(seed)||seed<1||seed>12||!['en','es','pt'].includes(language)||![30,90].includes(speed))return send(res,400,{error:'Choose a supported seed, language and replay speed.'});
    rate.n++;rates.set(ip,rate);created++;
    const id=randomBytes(12).toString('hex'),token=randomBytes(24).toString('hex'),match=generateMatch(seed);
    const run={id,token,match,language,speed,state:initialState(),cursor:0,serial:0,history:[],clients:new Set(),insights:[],created:clock(),started:null,nextCheckpoint:900,current:0};runs.set(id,run);
    return send(res,201,{id,token,match:{id:match.id,seed,duration:5400,clubs:match.clubs,provenance:match.provenance},speed,language});
   }
   const found=route.match(/^\/api\/runs\/([a-f0-9]{24})\/(stream|export|stop)$/);
   if(found){
    const run=runs.get(found[1]);if(!run)return send(res,404,{error:'This match session expired. Start a new match.'});
    const provided=(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[a-f0-9]{48}$/.test(provided)||!timingSafeEqual(Buffer.from(provided),Buffer.from(run.token)))return send(res,403,{error:'Session authorization required'});
    if(found[2]==='stop'&&req.method==='POST'){run.stopped=true;emit(run,'stopped',{});for(const c of run.clients)c.end();run.clients.clear();return send(res,200,{stopped:true});}
    if(found[2]==='export'&&req.method==='GET')return send(res,200,{schema:'btr.match-export.v1',synthetic:true,provenance:run.match.provenance,match_id:run.match.id,seed:run.match.seed,language:run.language,cutoff:run.current,complete:!!run.completed,events:run.state.events,stats:snapshot(run.state,run.current),insights:run.insights,overlay:run.insights.at(-1)?{schema:'btr.overlay.v1',start_match_second:run.insights.at(-1).cutoff,expires_match_second:Math.min(5400,run.insights.at(-1).cutoff+900),audiences:run.insights.at(-1).audiences}:null});
    if(found[2]==='stream'&&req.method==='GET'){
     res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(`event: connected\ndata: ${JSON.stringify({match_id:run.match.id,language:run.language,speed:run.speed})}\n\n`);
     for(const item of run.history)res.write(`id: ${item.id}\nevent: ${item.type}\ndata: ${JSON.stringify(item.data)}\n\n`);
     if(run.completed||run.stopped){res.end();return;}run.clients.add(res);res.on('close',()=>{run.clients.delete(res);if(!run.clients.size)run.disconnected=clock();});return;
    }return send(res,405,{error:'Method not allowed'});
   }
   if(route.startsWith('/api/'))return send(res,404,{error:'Not found'});
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
   const path=resolve(root,'.'+decodeURIComponent(route).replace(/\/$/,'/index.html'));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
   const info=await stat(path);if(!info.isFile()){res.writeHead(404).end();return;}
   const headers={'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':extname(path)==='.mp4'?'public,max-age=86400':'no-cache','Accept-Ranges':'bytes'};
   const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=info.size-1,status=200;
   if(range){start=Number(range[1]);end=Math.min(end,range[2]?Number(range[2]):end);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;}
   res.writeHead(status,{...headers,'Content-Length':end-start+1});if(req.method==='HEAD')res.end();else createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }catch(error){if(error.code==='ENOENT')return send(res,404,{error:'Not found'});console.warn(JSON.stringify({event:'request_error',message:error.message}));if(!res.headersSent)send(res,500,{error:'The service could not complete this request.'});else res.end();}
 });
 server.on('close',()=>{clearInterval(timer);for(const run of runs.values())for(const c of run.clients)c.end();});
 return {server,runs,tick};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const {server}=createApp();server.listen(Number(process.env.PORT||4397),'0.0.0.0',()=>console.log(`BTR intelligence listening on ${process.env.PORT||4397}`));}
