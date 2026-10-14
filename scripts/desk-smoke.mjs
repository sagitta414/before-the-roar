import {writeFile,mkdir} from 'node:fs/promises';
const [base='http://127.0.0.1:4397',language='en',mode='fan',question='']=process.argv.slice(2);
const health=await fetch(base+'/api/health').then(r=>r.json());if(health.version!=='3.0.0'||!health.video_discussion)throw Error('New release is not serving yet');
const response=await fetch(base+'/api/desk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language,mode,question})});if(!response.ok)throw Error(`Desk HTTP ${response.status}`);
const reader=response.body.getReader(),decoder=new TextDecoder(),posts=[];let buffer='',drafts=0,complete=false;const started=performance.now();
while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let split;while((split=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,split);buffer=buffer.slice(split+2);let type='',data='';for(const line of block.split('\n')){if(line.startsWith('event:'))type=line.slice(6).trim();if(line.startsWith('data:'))data+=line.slice(5).trim();}if(!data)continue;const item=JSON.parse(data);if(type==='draft')drafts++;if(type==='post'){posts.push(item);console.log(JSON.stringify(item));}if(type==='complete')complete=true;if(type==='error')throw Error(item.message);}}
const result={language,mode,drafts,complete,elapsed_ms:Math.round(performance.now()-started),posts};await mkdir('tmp',{recursive:true});await writeFile(`tmp/desk-${language}-${mode}.json`,JSON.stringify(result,null,2));
if(!complete||posts.length!==3||posts.some(p=>p.engine!=='azure_openai'||!p.evidence_ids.length)||posts.map(p=>p.role).join(',')!=='analyst,reviewer,presenter')throw Error('Discussion verification failed');
if(posts.some(p=>!p.cached)&&drafts===0)throw Error('No streaming drafts received');console.log(JSON.stringify({passed:true,language,mode,drafts,elapsed_ms:result.elapsed_ms}));

