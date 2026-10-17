// Recoverable, bounded SSE reader shared by the public demo and tests.
export async function fetchReview(base,input,{signal,onEvent=()=>{}}={}){
 const response=await fetch(base+'/api/evidence-review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});
 if(!response.ok)throw Error(response.status===429?'The desk is busy or rate-limited. Wait and retry; the saved demonstration still works.':'AI review unavailable. Retry when connected.');
 let buffer='',receipt=null,complete=null;const posts=[],reader=response.body.getReader(),decoder=new TextDecoder();
 try{while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});if(buffer.length>256000)throw Error('Response exceeds safe size');let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=frame.match(/^event: (.+)$/m)?.[1],raw=frame.match(/^data: (.+)$/m)?.[1];if(!type||!raw)continue;const data=JSON.parse(raw);if(type==='error')throw Error(data.message||'Review interrupted');if(type==='receipt')receipt=data;if(type==='post')posts.push(data);if(type==='complete')complete=data;onEvent({type,data});}}}finally{reader.releaseLock();}
 if(!complete||!receipt||posts.length!==5)throw Error('Review interrupted. Retry to recover the cached result.');return {...receipt,posts};
}
