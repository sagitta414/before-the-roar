// One session for Watch, Match Centre, Truth Lab and the output desk.
export const DEFAULT_SESSION={source:'pitchside',clipTime:0,clipChallenge:false,studyScene:false,scenario:'wide',time:16,corrected:false,language:'en',mode:'fan',focus:7,team:'harbor',insightPace:'balanced',insightDetail:'quick',section:'watch'};
export function reduceSession(state,patch){
 const next={...state,...patch};
 next.source=next.source==='match'?'match':'pitchside';
 next.clipTime=Math.max(0,Math.min(60,Number(next.clipTime)||0));
 next.clipChallenge=!!next.clipChallenge;
 next.studyScene=!!next.studyScene;
 if(!['wide','press','counter'].includes(next.scenario))next.scenario='wide';
 if(next.scenario!==state.scenario){next.time=0;next.corrected=false;}
 next.time=Math.max(0,Math.min(36,Number(next.time)||0));next.corrected=!!next.corrected&&next.scenario==='wide';
 if(!['en','es','pt'].includes(next.language))next.language='en';
 if(!['fan','beginner','math','analyst','player'].includes(next.mode))next.mode='fan';
 if(![...Array.from({length:11},(_,i)=>i+1),...Array.from({length:11},(_,i)=>i+101)].includes(Number(next.focus)))next.focus=7;else next.focus=Number(next.focus);
 if(!['harbor','north','neutral'].includes(next.team))next.team='neutral';
 if(!['essential','balanced','every'].includes(next.insightPace))next.insightPace='balanced';
 if(!['quick','full'].includes(next.insightDetail))next.insightDetail='quick';
 return Object.fromEntries(Object.keys(DEFAULT_SESSION).map(k=>[k,next[k]]));
}
export function createSession(initial={}){
 let value=reduceSession(DEFAULT_SESSION,{...DEFAULT_SESSION,...initial});const listeners=new Set();
 return {get:()=>({...value}),set(patch,source='control'){const next=reduceSession(value,patch);if(JSON.stringify(next)===JSON.stringify(value))return;value=next;for(const fn of listeners)fn({...value},source);},subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
}
export const matchSession=createSession();
