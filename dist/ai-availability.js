// Read-only availability. The server remains the authority for reservations.
export function availabilitySummary(health, now=Date.now()) {
 const usage=health?.usage, valid=usage && Number.isFinite(usage.limit) && Number.isFinite(usage.used) && /^\d{4}-\d{2}-\d{2}$/.test(usage.day);
 const resetAt=valid?Date.parse(usage.day+'T00:00:00Z')+86400000:null;
 const remaining=valid&&resetAt>now?Math.max(0,usage.limit-usage.used):null;
 if(!health)return {state:'unknown',title:'Checking AI availability',detail:'Playback and calculated evidence remain available.',remaining,resetAt};
 if(!health.ai_configured)return {state:'offline',title:'AI unavailable · reviewed notes available',detail:'Playback, calculations and synthetic datasets still work.',remaining,resetAt};
 if(remaining===0)return {state:'exhausted',title:'AI allowance reached · reviewed notes available',detail:'No new AI generation until the daily reset. Saved results can still be retrieved.',remaining,resetAt};
 if(remaining===null)return {state:'unknown',title:'AI allowance not confirmed',detail:'The server will check the allowance before generating. Playback remains available.',remaining,resetAt};
 return {state:'available',title:remaining+' AI requests remaining today',detail:'Shared across visitors. A new discussion uses up to 6 requests; cached work uses none.',remaining,resetAt};
}
export function createAvailability({fetcher=fetch,now=Date.now}={}) {
 let value=null,checkedAt=-Infinity,pending=null;const listeners=new Set();
 const summary=()=>availabilitySummary(value,now());
 return {get:summary,subscribe(fn){listeners.add(fn);fn(summary());return()=>listeners.delete(fn);},
  async check(force=false){if(pending)return pending;if(!force&&now()-checkedAt<30000)return summary();
   pending=(async()=>{try{const c=await fetcher('api-config.json').then(r=>r.json());const local=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname);const r=await fetcher((local?'':c.baseUrl||'')+'/api/health',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Health unavailable');value=await r.json();}catch{value=null;}checkedAt=now();for(const fn of listeners)fn(summary());return summary();})();
   try{return await pending;}finally{pending=null;}
  }
 };
}
export const aiAvailability=createAvailability();
export function availabilityText(status){return status.detail+(status.resetAt?' Resets '+new Date(status.resetAt).toLocaleString(undefined,{hour:'numeric',minute:'2-digit',month:'short',day:'numeric',timeZoneName:'short'})+' (00:00 UTC).':'');}
