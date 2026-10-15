import {createTruthLab} from './truth-lab.js?v=23';
import {matchSession} from './match-session.js';
import {matchStory} from './match-story.js';
import {createMatchPitch} from './match-pitch.js?v=22';
import {SCENARIOS,PLAYERS,position,clock,story} from './engine.js';
import {matchCenterSnapshot} from './analysis-model.js';
import {PRESENTER_PROFILES as profiles} from './presenter-profiles.js';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));return n;};
let scenario=SCENARIOS.find(s=>s.id===matchSession.get().scenario),time=matchSession.get().time,selectedPlayer=matchSession.get().focus,corrected=false,playing=false,lastFrame=0,lastDraw=0,section='watch';
const emit=(name,detail)=>document.dispatchEvent(new CustomEvent(name,{detail}));
function stop(){playing=false;for(const b of document.querySelectorAll('.scenario-play'))b.textContent='▶ Play sequence';}
function navigate(name){window.scrollTo({top:0,behavior:'instant'});for(const node of document.querySelectorAll('.extension-view'))node.hidden=node.id!==name;for(const node of document.querySelectorAll('.masthead .nav')){const active=node.dataset.section===name;node.classList.toggle('selected',active);node.setAttribute('aria-pressed',String(active));}emit('btr-section',name);if(name==='presenters')emit('btr-request-contributions');}
for(const button of document.querySelectorAll('[data-section]'))button.addEventListener('click',()=>navigate(button.dataset.section));
document.addEventListener('btr-section',e=>{section=e.detail;if(!['centre','truth','inside'].includes(section))stop();render();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
for(const select of document.querySelectorAll('.scenario-select'))select.addEventListener('change',()=>{scenario=SCENARIOS.find(s=>s.id===select.value);time=0;corrected=false;stop();render();});
for(const slider of document.querySelectorAll('.scenario-time'))slider.addEventListener('input',()=>{stop();time=Number(slider.value);render();});
function tick(now){if(!playing)return;if(lastFrame)time=Math.min(36,time+(now-lastFrame)/1000);lastFrame=now;if(now-lastDraw>80||time===36){render();lastDraw=now;}if(time===36)stop();else requestAnimationFrame(tick);}
for(const b of document.querySelectorAll('.scenario-play'))b.addEventListener('click',()=>{if(playing){stop();return;}if(time>=36)time=0;playing=true;lastFrame=0;for(const button of document.querySelectorAll('.scenario-play'))button.textContent='Ⅱ Pause sequence';requestAnimationFrame(tick);});
const rosterRows=new Map();
const pitchView=createMatchPitch($('formation-pitch'),id=>{selectedPlayer=id;render();});
for(const button of document.querySelectorAll('[data-pitch-view]'))button.addEventListener('click',()=>{pitchView.setView(button.dataset.pitchView);for(const other of document.querySelectorAll('[data-pitch-view]'))other.setAttribute('aria-pressed',String(other===button));});
pitchView.setView('stadium');
for(const p of PLAYERS){
 const button=el('button','lineup-row'),number=el('span','shirt-number',String(p.number||p.id)),identity=el('span','lineup-identity'),name=el('span','lineup-name',p.name),role=el('span','lineup-role',p.role||(p.number===1?'Goalkeeper':'Outfield')),stat=el('span','lineup-stat');
 identity.append(name,role);button.append(number,identity,stat);button.setAttribute('aria-label',`Follow ${p.name}`);button.addEventListener('click',()=>{selectedPlayer=p.id;render();});$(p.team==='harbor'?'home-lineup':'away-lineup').append(button);rosterRows.set(p.id,{button,stat});
}
function dot(parent,x,y,color,r=1.8){parent.append(svg('circle',{cx:x,cy:y,r,fill:color,stroke:'#fff8','stroke-width':.25}));}
function renderCenter(state){
 pitchView.update(scenario,state,selectedPlayer,corrected);
 for(const p of state.players){const row=rosterRows.get(p.id);row.stat.textContent=p.completed+'/'+p.passes;row.stat.title='Completed / attempted passes';row.button.classList.toggle('selected',p.id===selectedPlayer);row.button.setAttribute('aria-pressed',String(p.id===selectedPlayer));}
 const p=state.players.find(p=>p.id===selectedPlayer),number=p.number||p.id,slot=(number===1?2:0)+(p.team==='north'?1:0),photo=el('span','focus-player-photo'),identity=el('div','focus-player-identity'),detail=$('player-detail');
 photo.style.backgroundPosition=(slot%2*100)+'% '+(Math.floor(slot/2)*100)+'%';photo.setAttribute('aria-hidden','true');identity.append(el('span','micro','PLAYER FOCUS · '+(p.team==='harbor'?'HARBOR FC':'NORTHBRIDGE')),el('h3','',p.name),el('span','focus-role','#'+number+' · '+(p.role||(number===1?'Goalkeeper':'Outfield'))));
 const stats=el('div','player-stats');for(const [value,label]of [[p.completed+'/'+p.passes,'PASSES COMPLETE'],[p.involvements,'INVOLVEMENTS'],[p.displacement.toFixed(1)+' m','DISPLACEMENT']]){const item=el('div');item.append(el('strong','',String(value)),el('span','',label));stats.append(item);}
 detail.replaceChildren(photo,identity,stats);
 const sharedStory=matchStory({...matchSession.get(),scenario:scenario.id,time,corrected,focus:selectedPlayer});
 $('pitch-moment-title').textContent=sharedStory.title;
 $('pitch-moment-copy').textContent=sharedStory.body;
 const network=$('network-pitch').querySelector('.pitch-data'),team=$('network-team').value;network.replaceChildren();const passes=state.seen.filter(e=>e.type==='pass'&&e.team===team&&e.outcome==='complete');for(const e of passes){network.append(svg('line',{x1:e.start[0],y1:e.start[1],x2:e.endPosition[0],y2:e.endPosition[1],stroke:team==='harbor'?'#c8ed48':'#77b3ff','stroke-width':.7,opacity:.8}));dot(network,...e.start,'#d7ecff',1);dot(network,...e.endPosition,team==='harbor'?'#c8ed48':'#77b3ff',1.5);}$('network-note').textContent=`${passes.length} completed passes shown. Links use each pass’s recorded origin and destination; unfinished events stay out.`;
 const shots=$('shots-pitch').querySelector('.pitch-data');shots.replaceChildren();const attempts=state.seen.filter(e=>e.type==='shot');for(const e of attempts){dot(shots,...e.start,e.outcome==='goal'?'#c8ed48':'#ffa888',2.4);shots.append(svg('line',{x1:e.start[0],y1:e.start[1],x2:e.endPosition[0],y2:e.endPosition[1],stroke:'#fff8','stroke-width':.4,'stroke-dasharray':'1 1'}));}$('shots-note').textContent=attempts.length?attempts.map(e=>`${e.outcome==='goal'?'Goal':e.outcome==='saved'?'Saved':'Shot'} · ${clock(scenario,e.end)}`).join(' · '):'No completed shot at this point in the sequence. No xG estimate is assigned.';
 const heat=$('density-pitch').querySelector('.pitch-data');heat.replaceChildren();const bins=new Map();for(const e of state.seen){for(const loc of [e.start,...(e.type==='pass'?[e.endPosition]:[])]){const x=Math.min(90,Math.floor(loc[0]/15)*15),y=Math.min(51,Math.floor(loc[1]/17)*17),key=x+','+y;bins.set(key,(bins.get(key)||0)+1);}}const max=Math.max(1,...bins.values());for(const [key,count]of bins){const [x,y]=key.split(',').map(Number);heat.append(svg('rect',{x,y,width:15,height:17,fill:'#d5ed57',opacity:.15+.6*count/max}));}
}
const truthLab=createTruthLab({pause:stop,seek:(second,revision)=>{stop();time=second;corrected=revision;render();},toggleCorrection:()=>{stop();corrected=!corrected;render();}});
function renderTruth(){truthLab.render(scenario,time,corrected,matchSession.get().language,matchSession.get().mode);}
function render(){matchSession.set({scenario:scenario.id,time,corrected,focus:selectedPlayer,section},'analysis');renderLocal();}
function renderLocal(){if(matchSession.get().source==='pitchside'){stop();return;}const state=matchCenterSnapshot(scenario,time,corrected);for(const s of document.querySelectorAll('.scenario-select'))s.value=scenario.id;for(const s of document.querySelectorAll('.scenario-time'))s.value=time;for(const c of document.querySelectorAll('.scenario-clock'))c.textContent=clock(scenario,time);if(section==='centre')renderCenter(state);if(section==='truth')renderTruth();emit('btr-analysis-state',{scenario:scenario.id,time,corrected,focus:selectedPlayer,section,...{language:matchSession.get().language,mode:matchSession.get().mode}});}
matchSession.subscribe((next,source)=>{if(source==='analysis')return;scenario=SCENARIOS.find(s=>s.id===next.scenario);time=next.time;corrected=next.corrected;selectedPlayer=next.focus;section=next.section;if(source!=='film')stop();renderLocal();});
$('network-team').addEventListener('change',render);
const profileLines=new Map(),profileCards=new Map(),profileButtons=new Map();
const roleLabels={analyst:'Tactics & replay',guide:'New to football',math:'Explain the math',reviewer:'Check the evidence',presenter:'Bring it together'};
const roster=el('div','presenter-roster');roster.setAttribute('role','group');roster.setAttribute('aria-label','Choose a presenter');$('presenter-grid').before(roster);
function selectProfile(id){for(const [key,card]of profileCards){card.hidden=key!==id;profileButtons.get(key).setAttribute('aria-pressed',String(key===id));}}
for(const p of profiles){
 const picker=el('button','presenter-pick'),face=el('img');face.src='assets/'+p.image+'-portrait.webp';face.alt='';face.width=160;face.height=160;const faceFrame=el('span','picker-portrait');faceFrame.append(face);picker.id='choose-'+p.id;picker.setAttribute('aria-label','View '+p.name+' profile: '+roleLabels[p.id]);picker.setAttribute('aria-controls','profile-'+p.id);picker.append(faceFrame,el('strong','',p.name),el('span','',roleLabels[p.id]));picker.addEventListener('click',()=>selectProfile(p.id));roster.append(picker);profileButtons.set(p.id,picker);
 const card=el('article','presenter-card '+p.id),art=el('div','presenter-art'),portrait=el('img','presenter-photo');card.id='profile-'+p.id;card.setAttribute('aria-labelledby','name-'+p.id);
 portrait.src='assets/'+p.image+'-portrait.webp';portrait.alt=p.name+', a fictional AI football presenter';portrait.loading='lazy';art.append(portrait,el('span','persona-tag','FICTIONAL AI PRESENTER'));
 const body=el('div','presenter-body'),overview=el('div','profile-overview'),actions=el('div','profile-actions'),name=el('h2','',p.name.toUpperCase());name.id='name-'+p.id;overview.append(el('span','eyebrow',p.role),name,el('h3','',p.title),el('p','presenter-voice',p.voice));
 const expertise=el('div','expertise-tags');for(const tag of p.expertise)expertise.append(el('span','',tag));overview.append(expertise,el('p','profile-description',p.body));
 const method=el('details','presenter-method');method.append(el('summary','','Expertise, sources & limits'));const source=el('div','presenter-source');source.append(el('span','latest-label','WORKING EVIDENCE'),el('p','',p.tools));const steps=el('ol');for(const step of p.method)steps.append(el('li','',step));method.append(source,steps,el('span','latest-label','PASSING THE MIC'),el('p','',p.handoff),el('span','latest-label','EVIDENCE LIMIT'),el('p','',p.boundary));overview.append(method);
 const latest=el('blockquote','','Play the film to hear '+p.name+' and see the latest contribution here.');actions.append(el('span','latest-label','FROM THE WATCH ROOM'),latest);
 const example=el('button','presenter-question');example.append(el('span','latest-label','TRY A QUESTION ↗'),el('span','',p.question));example.addEventListener('click',()=>emit('btr-agent-question',{role:p.id,question:p.question}));
 const button=el('button','join-presenter','Join '+p.name+' in the room ↗');button.addEventListener('click',()=>emit('btr-profile-role',p.id));actions.append(example,button);body.append(overview,actions);card.append(art,body);$('presenter-grid').append(card);profileLines.set(p.id,latest);profileCards.set(p.id,card);
}
selectProfile('analyst');
document.addEventListener('btr-contributions',e=>{for(const p of profiles){const post=e.detail.posts.find(x=>x.role===p.id);profileLines.get(p.id).textContent=post?`${({azure_openai:'Azure AI',calculated:'Calculated',evidence_rules:'Evidence check',instant_notes:'Match notes',reviewed_fallback:'Reviewed fallback'})[post.engine]||'Match notes'} · ${post.summary}`:'Watch the film to see this role’s latest public contribution.';}});
$('return-room').addEventListener('click',()=>emit('btr-profile-role',null));

document.addEventListener("btr-analysis-request",()=>render());
document.addEventListener("btr-seek-scenario",e=>{const s=SCENARIOS.find(s=>s.id===e.detail.scenario);if(s){if(s!==scenario)corrected=false;scenario=s;time=Math.max(0,Math.min(s.duration,Number(e.detail.time)||0));stop();render();}});
