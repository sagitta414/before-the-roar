// Fixed generator and seed, frozen before the first evaluation. No expected answers enter model packets.
export function qualityFixtures(seed=20261017){let state=seed>>>0;const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};return Array.from({length:12},(_,i)=>{
 const id='holdout-'+i,cutoff=20+Math.floor(rand()*45),x=15+rand()*25,y=10+rand()*40,dx=8+rand()*18,dt=2+rand()*3;
 const pass={id:id+'-pass',type:'pass',team:'harbor',from:6,to:8,t:cutoff-6-dt,end:cutoff-6,start:[x,y],endPosition:[x+dx,y+3],distance:Math.hypot(dx,3),speed:Math.hypot(dx,3)/dt*3.6,outcome:'complete'};
 const tracking={id:id+'-track-r1',type:'tracking',player:102,second:cutoff,start:[70,25],position:[70,25+4+rand()*10]};
 const prior={snapshot:{scenario:id,time:cutoff-1,tracking:true,corrected:false,language:['en','es','pt'][i%3]},records:[pass,tracking]};
 const records=[pass],trackingAvailable=i%4!==2;
 if(trackingAvailable)records.push({...tracking,id:id+'-track-r2',position:i%4===0?[70,25]:tracking.position});
 if(i%4===1||i%4===3)records.push({id:id+'-shot',type:'shot',team:'harbor',from:9,t:cutoff-1,end:cutoff,start:[88,32],endPosition:[102,34],outcome:i%4===1?'saved':'goal'});
 records.push({id:id+'-scope',type:'coverage',second:cutoff,tracking:trackingAvailable});
 const intent=['opening','challenge','math'][i%3],packet={current:{snapshot:{...prior.snapshot,time:cutoff,tracking:trackingAvailable,corrected:i%4===0},records},previous:prior,intent};
 const expectedTool=intent==='challenge'?'source_delta':intent==='math'?'pass_progression':records.some(r=>r.type==='shot')?'latest_outcome':'pass_progression';
 return {id,packet,expectedTool};
 });}
