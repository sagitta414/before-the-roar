import {writeFile} from 'node:fs/promises';
const base=process.argv[2]||'https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io';
const language=process.argv[3]||'en';const started=Date.now();
const health=await fetch(base+'/api/health').then(r=>r.json());console.log(JSON.stringify({health}));
const response=await fetch(base+'/api/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seed:7,language,speed:90})});if(!response.ok)throw Error(await response.text());
const session=await response.json(),headers={Authorization:`Bearer ${session.token}`};
const stream=await fetch(`${base}/api/runs/${session.id}/stream`,{headers});const reader=stream.body.getReader(),decoder=new TextDecoder();let buffer='',states=0,recap=false;const results=[];
while(true){const{value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let at;while((at=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,at);buffer=buffer.slice(at+2);const type=block.match(/event: (.+)/)?.[1],raw=block.match(/data: (.+)/)?.[1];if(!raw)continue;const data=JSON.parse(raw);if(type==='state')states++;if(type==='insight'||type==='recap'){recap ||= type==='recap';results.push({cutoff:data.cutoff,engine:data.engine,cached:data.cached,latency_ms:data.latency_ms,reason:data.reason,tokens:data.usage?.total_tokens,headline:data.audiences.fan.headline});console.log(JSON.stringify(results.at(-1)));}}}
const data=await fetch(`${base}/api/runs/${session.id}/export`,{headers}).then(r=>r.json());await writeFile(`tmp/cloud-${language}.json`,JSON.stringify(data,null,2));
const summary={language,elapsed_ms:Date.now()-started,states,events:data.events.length,complete:data.complete,recap,ai:results.filter(r=>r.engine==='azure_openai').length,results};await writeFile(`tmp/cloud-${language}-summary.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));if(!recap||!data.complete||summary.ai!==6)process.exitCode=1;
