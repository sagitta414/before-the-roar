// Read-only availability. The server remains the authority for reservations.
export function availabilitySummary(health, now=Date.now()) {
 const usage=health?.usage, valid=usage && Number.isFinite(usage.limit) && Number.isFinite(usage.used) && /^\d{4}-\d{2}-\d{2}$/.test(usage.day);
 const resetAt=valid?Date.parse(usage.day+'T00:00:00Z')+86400000:null;
 const remaining=valid&&resetAt>now?Math.max(0,usage.limit-usage.used):null;
 if(!health)return {state:'unknown',title:'AI connection not confirmed',detail:'Playback and calculated evidence remain available. Retry the connection to check AI availability.',remaining,resetAt};
 if(!health.ai_configured)return {state:'offline',title:'AI unavailable · reviewed notes available',detail:'Playback, calculations and synthetic datasets still work.',remaining,resetAt};
 if(remaining===0)return {state:'exhausted',title:'AI allowance reached · reviewed notes available',detail:'No new AI generation until the daily reset. Saved results can still be retrieved.',remaining,resetAt};
 if(remaining===null)return {state:'unknown',title:'AI allowance not confirmed',detail:'The server will check the allowance before generating. Playback remains available.',remaining,resetAt};
 return {state:'available',title:remaining+' AI requests remaining today',detail:'Shared across visitors. Synthetic round: 1 request. Film round: 3, or 4 if Host needs editorial revision. Cached work uses none.',remaining,resetAt};
}
export function createAvailability({fetcher=fetch,now=Date.now,timeoutMs=8000,retryDelayMs=1500}={}) {
 let value=null,checkedAt=-Infinity,pending=null,phase='idle',config=null;
 const listeners=new Set();
 const summary=()=>{
  if(['checking','retrying'].includes(phase))return value?{...availabilitySummary(value,now()),state:'refreshing',detail:'Last confirmed allowance · checking for an update. Playback and reviewed explanations are ready.'}:{state:phase,title:'Checking AI availability',detail:'Playback and reviewed explanations are ready.',remaining:null,resetAt:null};
  if(phase==='failed')return value?{...availabilitySummary(value,now()),state:'stale',title:'AI status needs a refresh',detail:'Last confirmed allowance shown. Playback and reviewed explanations are ready.',}:{...availabilitySummary(null,now()),state:'unreachable',title:'AI status not confirmed · retry available'};
  return availabilitySummary(value,now());
 };
 const notify=()=>{const s=summary();for(const fn of listeners)fn(s);return s;};
 async function request(){
  const controller=new AbortController();let timer;
  try{return await Promise.race([
   (async()=>{
    if(!config){const response=await fetcher('api-config.json',{signal:controller.signal});if(!response.ok)throw Error('Configuration unavailable');config=await response.json();}
    const local=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname);
    const response=await fetcher((local?'':config.baseUrl||'')+'/api/health',{signal:controller.signal});
    if(!response.ok)throw Error('Health unavailable');const health=await response.json();
    if(typeof health?.ai_configured!=='boolean')throw Error('Invalid health response');return health;
   })(),
   new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Connection timed out'));},timeoutMs);})
  ]);}finally{clearTimeout(timer);controller.abort();}
 }
 return {get:summary,subscribe(fn){listeners.add(fn);fn(summary());return()=>listeners.delete(fn);},
  async check(force=false){
   if(pending)return pending;if(!force&&now()-checkedAt<30000)return summary();
   phase='checking';notify();
   pending=(async()=>{
    for(let attempt=0;attempt<2;attempt++){
     try{value=await request();phase='ready';break;}
     catch{if(attempt===0){phase='retrying';notify();await new Promise(r=>setTimeout(r,retryDelayMs));}else phase='failed';}
    }
    checkedAt=now();return notify();
   })();
   try{return await pending;}finally{pending=null;}
  }
 };
}
export const aiAvailability=createAvailability();
export function availabilityText(status){return status.detail+(status.resetAt?' Resets '+new Date(status.resetAt).toLocaleString(undefined,{hour:'numeric',minute:'2-digit',month:'short',day:'numeric',timeZoneName:'short'})+' (00:00 UTC).':'');}
