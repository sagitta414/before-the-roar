import {createBroadcastOutput} from './broadcast-output.js';
import {PITCHSIDE,pitchsideStory,pitchsidePanel,pitchsideKey,pitchsideExport,clipClock,clipDiscussionMatches,clipEditorialCutoff} from './pitchside-story.js';
import {SCENARIOS,PLAYERS,clock} from './engine.js';
import {matchSession} from './match-session.js';
import {matchStory,localPanel,matchExport,editorialKey,WORDS} from './match-story.js';
import {PRESENTER_PROFILES as profiles} from './presenter-profiles.js';
import {createMatchPitch} from './match-pitch.js';
import {matchCenterSnapshot} from './analysis-model.js';
import {arrangeReadingRoom} from './reading-room.js';
import {ROLE_LABELS} from './editorial-roles.js';
import {samePlayWindow} from './play-analysis.js';
import {FILM_SCENES,scenePlayback} from './film-math.js';
import {mediaPlan,bindMedia,localMediaTime} from './film-media.js';
arrangeReadingRoom();
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;},put=(id,t)=>{if($(id).textContent!==String(t))$(id).textContent=t;};
const film=$('film'),threads=new Map();let state=matchSession.get(),current=matchStory(state),base='',started=false,selected=null,narrativeOnly=false,voices=false,speechKey='',lastRender=0;
let watchSource=state.source,clipTime=state.clipTime;
const chapterLabels={en:['The duel','The outlet','Close control','The defender','The sideline','The keeper','The gesture','The pass'],es:['El duelo','La salida','El control','El defensor','La banda','El portero','El gesto','El pase'],pt:['O duelo','A saída','O controle','O defensor','A lateral','O goleiro','O gesto','O passe']};
const chapterStarts=[0,8,16,24,32,40,48,52],chapterNav=el('nav','film-chapters'),chapterLabel=el('div','film-chapter-label');chapterNav.setAttribute('aria-label','Film chapters');$('player').before(chapterLabel);document.querySelector('.transport').after(chapterNav);
const sceneMode=el('select','scene-mode');sceneMode.setAttribute('aria-label','Film playback mode');for(const [value,label]of [['reel','Full minute · continuous'],['scene','Study one scene']]){const option=el('option','',label);option.value=value;sceneMode.append(option);}sceneMode.onchange=()=>matchSession.set({studyScene:sceneMode.value==='scene'});
for(const [i,t]of chapterStarts.entries()){const button=el('button');button.append(el('span','',clipClock(t)),el('b','',chapterLabels.en[i]));button.onclick=()=>{started=true;seek(t);};chapterNav.append(button);}
const isClip=()=>watchSource==='pitchside',viewTime=()=>isClip()?clipTime:state.time,viewInput=()=>isClip()?{time:clipTime,language:state.language,mode:state.mode,clip_id:PITCHSIDE.id,clipChallenge:state.clipChallenge}:state,viewStory=input=>isClip()?pitchsideStory(input):matchStory(input),viewPanel=packet=>isClip()?pitchsidePanel(packet):localPanel(packet),displayTime=t=>isClip()?clipClock(t):clock(SCENARIOS.find(s=>s.id===state.scenario),t);
const overlayChannel='BroadcastChannel'in window?new BroadcastChannel('btr-match-cue-v1'):null;
const config=fetch('api-config.json').then(r=>r.json()).then(c=>base=['localhost','127.0.0.1'].includes(location.hostname)?'':c.baseUrl||'').catch(()=>{});
const correctedPitch=createMatchPitch($('corrected-replay'),id=>matchSession.set({focus:id,mode:'player'}));correctedPitch.setView('stadium');
const locale=()=>state.language,scopeKey=s=>isClip()?[PITCHSIDE.id,s.language,s.mode,s.clipChallenge].join(':'):['match',s.scenario,s.language,s.mode,s.focus,s.team,s.corrected].join(':'),currentThreads=()=>[...threads.values()].filter(t=>t.scope===scopeKey(state)&&t.cutoff<=viewTime()&&(isClip()?clipDiscussionMatches(clipTime,t.cutoff):samePlayWindow(SCENARIOS.find(x=>x.id===state.scenario),state.time,t.cutoff))),activeThread=()=>currentThreads().sort((a,b)=>b.cutoff-a.cutoff||b.created-a.created)[0];
function toast(t){put('toast',t);$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,5000);}
function silence(){if('speechSynthesis'in window)speechSynthesis.cancel();}
function save(name,data){const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=el('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function navigate(name){media.pause();silence();window.scrollTo({top:0,behavior:'instant'});document.querySelectorAll('.extension-view').forEach(n=>n.hidden=n.id!==name);$('watch').hidden=name!=='watch';$('lab').hidden=name!=='lab';for(const b of document.querySelectorAll('.masthead .nav')){const active=b.id===name+'-nav';b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}document.dispatchEvent(new CustomEvent('btr-section',{detail:name}));if(name==='lab'&&!$('simulation').src)$('simulation').src='simulation.html?embedded=1';if(name!=='lab')$('simulation').contentWindow?.postMessage({type:'btr-pause-lab'},location.origin);history.replaceState(null,'','#'+name);}
const mediaStatus=el('div','media-status');mediaStatus.setAttribute('role','status');const mediaMessage=el('span'),retryMedia=el('button','','Retry playback');retryMedia.hidden=true;mediaStatus.append(mediaMessage,retryMedia);document.querySelector('.transport').after(mediaStatus);
const media=bindMedia(film,status=>{const busy=['loading','buffering'].includes(status);$('player').classList.toggle('media-loading',busy);mediaStatus.hidden=['ready','idle'].includes(status);mediaMessage.textContent=({loading:'Preparing the film…',buffering:'Buffering…',slow:'The film is taking longer than expected. You can retry or explore its reviewed evidence.',error:'Playback could not start. Retry the film; the evidence is still available.'})[status]||'';retryMedia.hidden=!['slow','error'].includes(status);});retryMedia.onclick=()=>media.retry();
function seek(t){media.pause();if(isClip()){clipTime=Math.max(0,Math.min(PITCHSIDE.duration,Number(t)||0));matchSession.set({clipTime},'seek');loadVideo();render();}else matchSession.set({time:t},'seek');}
async function play(){if(isClip()&&state.studyScene){const scene=FILM_SCENES.findLast(s=>s.start<=clipTime);if(clipTime>=scene.end-.05)seek(scene.start);}else if(viewTime()>=(isClip()?PITCHSIDE.duration:36)-.05)seek(0);started=true;$('opening').hidden=true;loadVideo();await media.play();}
function loadVideo(){if(state.section!=='watch'){media.unload();return;}media.sync(mediaPlan(state),viewTime());film.setAttribute('aria-label',isClip()?'AI-generated football film with reviewed observations':'Synthetic match film synchronized with event data');}
// Paused metadata/seek events must not overwrite a newer evidence-page playhead.
film.addEventListener('timeupdate',()=>{if(state.section==='watch'&&film.readyState>=1&&!film.seeking&&(!film.paused||film.ended)){if(isClip()){const playback=scenePlayback(clipTime,Math.min(PITCHSIDE.duration,media.globalTime()),state.studyScene);clipTime=playback.time;if(playback.stop){media.pause();film.currentTime=localMediaTime(mediaPlan(state),clipTime);toast('Scene complete. Replay it or choose another moment below.');}if(performance.now()-lastRender>120||film.ended||playback.stop){lastRender=performance.now();matchSession.set({clipTime},'film');render();}}else matchSession.set({time:Math.min(36,media.globalTime())},'film');}});
for(const event of ['play','pause','ended'])film.addEventListener(event,()=>{put('play',film.paused?'▶':'Ⅱ');$('play').setAttribute('aria-label',film.paused?'Play film':'Pause film');$('end-replay').hidden=!film.ended;if(film.ended)render();});
film.muted=true;
function render(){
 renderSource();if(isClip()){renderClip();return;}
 current=matchStory(state);const s=SCENARIOS.find(s=>s.id===state.scenario),w=current.words;
 $('opening').hidden=started||state.time>0;
 overlayChannel?.postMessage({type:'match-state',state});
 put('session-clock',current.clock);put('session-score',`${current.brief.score.harbor} – ${current.brief.score.north}`);put('session-revision','R'+current.revision);
 for(const [id,value]of [['session-scenario',state.scenario],['session-language',state.language],['session-mode',state.mode],['session-player',state.focus],['session-team',state.team],['perspective',state.mode],['story-language',state.language],['brief-language',state.language],['cue-language',state.language]])if($(id))$(id).value=value;
 for(const id of ['session-mode','perspective'])for(const option of $(id).options)option.textContent=w[option.value];
 put('bug-clock',current.clock);put('current-time','00:'+String(Math.floor(state.time)).padStart(2,'0'));$('scrub').value=state.time;put('match-score',`${current.brief.score.harbor} : ${current.brief.score.north}`);
 put('match-heading',s.title);put('caption-kicker',w[state.mode]);put('caption-title',current.title);$('broadcast-caption').hidden=!started&&state.time===0;put('now-label',w[state.mode]);put('now-copy',current.body);put('instant-stats',current.stats);put('instant-math',state.mode==='math'?current.equation:state.mode==='player'?current.playerLine:'');
 put('recap-title',current.complete?w.recap:w.partial);put('recap-copy',current.analysis.summary);$('recap-card').hidden=!current.resolved;put('recap-proof',`${w.at} ${current.clock} · R${current.revision}`);
 $('film').hidden=state.corrected;$('corrected-replay').hidden=!state.corrected;if(state.corrected)correctedPitch.update(s,matchCenterSnapshot(s,state.time,true),state.focus,true);
 put('film-scope',state.corrected?'CORRECTED TRACKING · TACTICAL REPLAY':'COORDINATE-RENDERED MATCH FILM');$('restore-record').hidden=!state.corrected;
 put('lesson-mode',w[state.mode]);put('lesson-time',current.clock);put('lesson-title',current.title);put('lesson-body',current.body);$('math-card').hidden=state.mode!=='math';put('math-card',current.equation);
 const signature=[state.scenario,state.language,current.brief.state.seen.length,state.corrected,state.focus].join(':');
 if($('beats').dataset.signature!==signature){$('beats').dataset.signature=signature;$('beats').replaceChildren();$('evidence-list').replaceChildren();for(const e of current.brief.state.seen){const name=PLAYERS.find(p=>p.id===e.from)?.name,b=el('button','beat');b.append(el('b','',clock(s,e.end)),el('strong','',name),el('small','',e.type+' · '+e.outcome));b.addEventListener('click',()=>seek(e.end));$('beats').append(b);const row=el('div','evidence-item'),link=el('button','',`${clock(s,e.end)} · ${e.id} ↗`);link.onclick=()=>{$('learn-dialog').close();seek(e.end);};row.append(link,el('p','',`${name} · ${e.type} · ${e.distance.toFixed(1)} m · ${e.outcome}`));$('evidence-list').append(row);}if(!current.brief.state.seen.length)$('evidence-list').append(el('p','','No completed events at this cutoff.'));}
 renderPanel();
 // Two meaningful editorial checkpoints; local explanations update at every event.
 if(started&&state.section==='watch'){const threshold={wide:16,press:10,counter:12}[s.id],end=s.actions.find(e=>e.type==='shot').end,cutoff=state.time>=end?end:state.time>=threshold?threshold:null;if(cutoff!==null)requestPanel('',cutoff,false);}
}
function renderPanel(){
 const thread=activeThread(),discussionPacket=thread?viewStory({...viewInput(),time:thread.cutoff}):current,fallback=viewPanel(discussionPacket),list=thread?[...thread.posts.values()]:fallback,discussionEvidence=discussionPacket.evidence;
 const signature=[scopeKey(state),thread?.key,thread?.serial,state.language,selected,narrativeOnly,thread?0:Math.floor(viewTime()*4),state.corrected].join('|');if($('conversation').dataset.signature===signature)return;$('conversation').dataset.signature=signature;
 const box=$('conversation'),readingKey=[thread?.key||scopeKey(state),selected,narrativeOnly,state.mode].join('|'),sameThread=box.dataset.thread===readingKey,scrollTop=box.scrollTop,opened=new Set([...box.querySelectorAll('.message-evidence[open]')].map(n=>n.dataset.role));box.dataset.thread=readingKey;box.replaceChildren();
 if(thread)box.append(el('p','discussion-cutoff',`${current.words.at} ${displayTime(thread.cutoff)} · ${isClip()?'REVIEWED FILM':'R'+current.revision}`));
 if(thread?.question)box.append(el('p','viewer-message',thread.question));
 const waiting=!current.brief.state.seen.length&&!thread&&!selected;
 if(waiting){const welcome=el('div','welcome');welcome.append(el('span','eyebrow','FIVE PERSPECTIVES. ONE CONVERSATION.'),el('h3','',{en:'START WITH THE PLAY.',es:'EMPIEZA CON LA JUGADA.',pt:'COMECE PELA JOGADA.'}[state.language]),el('p','',{en:'Press play. The crew will pick out the detail, explain the football, check the numbers and give you a reason to replay.',es:'Pulsa reproducir. El equipo observará el detalle, explicará el fútbol, comprobará los números y te dará una razón para repetir.',pt:'Aperte play. A equipe observará o detalhe, explicará o futebol, verificará os números e dará um motivo para rever.'}[state.language]));const agenda=el('div','crew-agenda');for(const p of profiles)agenda.append(el('span','',p.name),el('strong','',ROLE_LABELS[state.language][p.id]));welcome.append(agenda);box.append(welcome);}
 for(const profile of waiting?[]:profiles){const role=profile.id;if(narrativeOnly&&role!=='presenter'||!narrativeOnly&&selected&&role!==selected)continue;const draft=$('stream-live').checked?thread?.drafts.get(role):null,post=list.find(p=>p.role===role)||(!draft&&thread?.pending?fallback.find(p=>p.role===role):null);if(!post&&!draft)continue;
  const row=el('article',`message ${profile.image}`),meta=el('div','message-meta'),face=el('span','message-face'),identity=el('div','message-identity');face.style.backgroundImage=`url(assets/${profile.image}-portrait.webp)`;identity.append(el('b','message-name',profile.name),el('span','message-specialty',ROLE_LABELS[state.language][role]));meta.append(face,identity,el('span','message-badge',draft&&!post?'DRAFT':post.engine==='azure_openai'?'AI':post.engine==='calculated'?'MATH':post.engine==='evidence_rules'?'CHECK':'NOTES'));row.append(meta);
  if(post?.decision)row.append(el('strong','verdict verdict-'+post.decision,current.words[post.decision]||'HOLD'));
  if(post?.metric_value){const metric=el('div','metric-chip');metric.append(el('b','',post.metric_value),el('span','',post.metric_title));row.append(metric);}
  row.append(el('p','',post?.summary||draft.summary));
  if(post?.replay_cue)row.append(el('p','replay-cue',post.replay_cue));
  if(post){const detail=el('details','message-evidence'),label={en:'Evidence',es:'Evidencia',pt:'Evidência'}[state.language];detail.dataset.role=role;detail.open=sameThread?opened.has(role):false;detail.append(el('summary','',label));
   if(post.working)detail.append(el('code','working',post.working));
   if(post.target_claim)detail.append(el('blockquote','reviewed-claim',post.target_claim));
   if(post.reviewed_contribution)detail.append(el('p','',`Scout: ${post.reviewed_contribution}`));
   const links=el('div','citations');for(const id of post.evidence_ids.slice(-3)){const e=discussionEvidence.find(e=>e.id===id);if(!e)continue;const b=el('button','',`${displayTime(e.end??e.second??thread?.cutoff??viewTime())} ↗`);b.title=id;b.setAttribute('aria-label','Replay evidence '+id);b.onclick=()=>seek(e.end??e.second??thread?.cutoff??viewTime());links.append(b);}detail.append(links);if(post.caution)detail.append(el('p','',post.caution));row.append(detail);
  }
  box.append(row);
 }
 for(const b of document.querySelectorAll('[data-agent]')){b.setAttribute('aria-pressed',String(selected===b.dataset.agent));b.classList.toggle('active',!!thread?.pending&&!thread.posts.has(b.dataset.agent));b.querySelector('.agent-state').textContent=thread?.posts.has(b.dataset.agent)?'READY':thread?.pending?'WRITING':'INSTANT';}
 put('party-status',thread?.error||(!thread?(isClip()?current.copy.ready:'Instant match notes · AI joins at key moments'):thread.pending?'AI discussion streaming · exact cutoff shown above':!list.some(p=>p.engine==='azure_openai')&&!current.brief.state.seen.length?'Match notes · waiting for the first completed event':thread.fallback?(isClip()?current.copy.noAI:'Match notes · AI unavailable for this turn'):`AI discussion ready${thread.cached?' · cached':''}`));
 put('response-timing',thread?.first!=null?`First AI text ${(thread.first/1000).toFixed(1)}s${thread.total!=null?' · panel '+(thread.total/1000).toFixed(1)+'s':''}`:thread?.cached?'Cached discussion · no new model calls':'Instant facts · measured AI response times');
 $('all-agents').hidden=!selected;$('question').disabled=!!thread?.pending;$('send-question').disabled=!!thread?.pending;$('export').disabled=false;
 document.dispatchEvent(new CustomEvent('btr-contributions',{detail:{posts:list,language:state.language,mode:state.mode}}));box.scrollTop=sameThread?scrollTop:0;
 if(voices&&thread?.complete&&speechKey!==thread.key){speechKey=thread.key;const host=thread.posts.get('presenter');if(host){const utterance=new SpeechSynthesisUtterance([host.summary,host.replay_cue].filter(Boolean).join(' '));utterance.lang={en:'en-US',es:'es-ES',pt:'pt-BR'}[state.language];speechSynthesis.speak(utterance);}}
}
async function requestPanel(question='',cutoff=viewTime(),manual=true){
 const clipRequest=isClip(),input={...viewInput(),time:Math.floor(cutoff*10)/10,question},key=clipRequest?pitchsideKey(input):editorialKey(input),existing=threads.get(key);if(existing){if(manual&&!existing.pending&&(existing.error||existing.fallback))threads.delete(key);else return;}
 if(manual)media.pause();const thread={key,scope:scopeKey(input),cutoff:input.time,question,posts:new Map(),drafts:new Map(),pending:true,serial:0,created:Date.now()};threads.set(key,thread);if(threads.size>30)threads.delete(threads.keys().next().value);renderPanel();
 try{await config;const response=await fetch(base+(clipRequest?'/api/clip-desk':'/api/match-desk'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});if(!response.ok)throw Error((await response.json()).error||'AI unavailable');const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
  while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});if(buffer.length>256000)throw Error('Stream too large');let split;while((split=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,split);buffer=buffer.slice(split+2);const type=block.split('\n').find(l=>l.startsWith('event:'))?.slice(6).trim(),data=JSON.parse(block.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5)).join(''));if(type==='error')throw Error(data.message);if(type==='trace')document.dispatchEvent(new CustomEvent('btr-agent-trace',{detail:{key,data}}));if(type==='post'){thread.posts.set(data.role,data);thread.drafts.delete(data.role);thread.fallback||=data.engine==='reviewed_fallback';}if(type==='draft'){thread.first??=data.first_text_ms;if(!thread.posts.has(data.role))thread.drafts.set(data.role,data);}if(type==='complete'){thread.complete=true;thread.cached=data.cached;thread.total=data.elapsed_ms;}thread.serial++;renderPanel();}}
  if(!thread.complete)throw Error('Discussion interrupted. Use Ask the crew to retry.');
 }catch(e){thread.error=e.message;thread.drafts.clear();thread.fallback=true;for(const p of clipRequest?pitchsidePanel(pitchsideStory(input)):localPanel(matchStory(input)))if(!thread.posts.has(p.role))thread.posts.set(p.role,p);}finally{thread.pending=false;thread.serial++;renderPanel();}
}
for(const p of PLAYERS){const o=el('option','',p.name);o.value=p.id;$('session-player').append(o);}
for(const [id,key]of [['session-scenario','scenario'],['session-language','language'],['session-mode','mode'],['session-player','focus'],['session-team','team'],['story-language','language'],['perspective','mode']])$(id).addEventListener('change',()=>{silence();matchSession.set({[key]:$(id).value});if(key==='language'||key==='mode'||key==='team'||key==='focus')try{localStorage.setItem('btr-preferences-v1',JSON.stringify({language:state.language,mode:state.mode,team:state.team,focus:state.focus}));}catch{}});
// Preferences only; playback and corrections are never restored implicitly.
try{const saved=JSON.parse(localStorage.getItem('btr-preferences-v1')||'null');if(saved)matchSession.set({language:saved.language,mode:saved.mode,team:saved.team,focus:saved.focus});}catch{}
matchSession.subscribe((next,source)=>{const previous=state;state=next;watchSource=state.source;clipTime=state.clipTime;if(previous.source!==state.source||previous.scenario!==state.scenario)started=false;if(scopeKey(previous)!==scopeKey(state))silence();if(source!=='film')loadVideo();if(source!=='film'||performance.now()-lastRender>120){lastRender=performance.now();render();}});
document.addEventListener('btr-section',e=>{matchSession.set({section:e.detail});if(e.detail!=='watch'){$('watch').hidden=true;$('lab').hidden=e.detail!=='lab';media.pause();silence();}});
document.addEventListener('btr-request-contributions',()=>{ $('conversation').dataset.signature='';renderPanel();});
document.addEventListener('btr-profile-role',e=>{navigate('watch');selected=profiles.some(p=>p.id===e.detail)?e.detail:null;narrativeOnly=false;renderPanel();});
document.addEventListener('btr-agent-question',e=>{navigate('watch');selected=e.detail.role;$('question').value=e.detail.question;renderPanel();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){media.pause();silence();}});
for(const id of ['watch-nav','back-watch'])$(id).onclick=()=>navigate('watch');$('lab-nav').onclick=()=>navigate('lab');
for(const id of ['hero-play','end-replay'])$(id).onclick=play;$('play').onclick=()=>film.paused?play():media.pause();$('restart').onclick=()=>{seek(0);play();};$('scrub').oninput=()=>seek(Number($('scrub').value));
film.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();film.paused?play():media.pause();}};
$('slow').onclick=()=>{film.playbackRate=film.playbackRate===1?.5:1;put('slow',film.playbackRate===1?'1×':'½×');};$('sound').onclick=()=>{film.muted=!film.muted;put('sound',film.muted?'Sound off':'Sound on');};$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('player').requestFullscreen();
$('restore-record').onclick=()=>matchSession.set({corrected:false});$('open-truth').onclick=()=>navigate('truth');$('open-centre').onclick=()=>navigate('centre');
$('question-form').onsubmit=e=>{e.preventDefault();const q=$('question').value.trim();if(q){$('question').value='';requestPanel(q);}};$('request-panel').onclick=()=>requestPanel();
for(const b of document.querySelectorAll('[data-question]')){b.disabled=false;b.onclick=()=>requestPanel(b.dataset.question);}
for(const b of document.querySelectorAll('[data-agent]'))b.onclick=()=>{selected=selected===b.dataset.agent?null:b.dataset.agent;renderPanel();};$('all-agents').onclick=()=>{selected=null;renderPanel();};
for(const [id,value]of [['room-tab',false],['narrative-tab',true]])$(id).onclick=()=>{narrativeOnly=value;selected=null;for(const [tab,on]of [['room',!value],['narrative',value]]){$(tab+'-tab').setAttribute('aria-selected',String(on));$(tab+'-panel').hidden=!on;}renderPanel();};
for(const id of ['room-tab','narrative-tab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'room-tab':e.key==='End'?'narrative-tab':id==='room-tab'?'narrative-tab':'room-tab';$(next).click();$(next).focus();}};
$('voices').onclick=()=>{if(!('speechSynthesis'in window))return toast('Device voices are unavailable.');voices=!voices;silence();put('voices',voices?'Voices on':'Voices off');$('voices').setAttribute('aria-pressed',String(voices));speechKey='';$('conversation').dataset.signature='';renderPanel();};
for(const name of ['learn','settings','about']){$(name).onclick=()=>{media.pause();$(name+'-dialog').showModal();};$('close-'+name).onclick=()=>$(name+'-dialog').close();}$('learn-inline').onclick=()=>{$('learn').click();};
$('party-toggle').onclick=()=>{const hidden=document.body.classList.toggle('party-closed');$('party-toggle').setAttribute('aria-pressed',String(!hidden));};$('replays').onclick=()=>{$('beats').hidden=!$('beats').hidden;document.querySelector('.timeline-heading').hidden=$('beats').hidden;$('replays').setAttribute('aria-expanded',String(!$('beats').hidden));};
$('stream-live').onchange=()=>{$('conversation').dataset.signature='';renderPanel();};$('clean-feed').onclick=()=>{$('player').classList.toggle('clean-feed');};
for(const id of ['export','recap-export'])$(id).onclick=()=>save(isClip()?'btr-pitchside-story.json':'btr-match-story.json',(isClip()?pitchsideExport:matchExport)(viewInput(),[...(activeThread()?.posts.values()||[])]));
$('overlay-export').onclick=createBroadcastOutput();
function setSource(value){media.pause();silence();$('conversation').dataset.signature='';matchSession.set({source:value});}
function renderSource(){
 const clip=isClip(),onWatch=state.section==='watch';document.body.classList.toggle('watching-clip',clip);
 chapterNav.hidden=chapterLabel.hidden=!clip;
 if(clip){const index=chapterStarts.findLastIndex(t=>clipTime>=t),labels=chapterLabels[state.language];sceneMode.value=state.studyScene?'scene':'reel';for(const option of sceneMode.options)option.textContent=({en:['Full minute · continuous','Study one scene'],es:['Minuto completo · continuo','Estudiar una escena'],pt:['Minuto completo · contínuo','Estudar uma cena']})[state.language][option.value==='scene'?1:0];if(chapterLabel.dataset.scene!==String(index)||chapterLabel.dataset.language!==state.language||chapterLabel.dataset.mode!==sceneMode.value){chapterLabel.dataset.scene=index;chapterLabel.dataset.language=state.language;chapterLabel.dataset.mode=sceneMode.value;chapterLabel.replaceChildren(el('strong','',`${String(index+1).padStart(2,'0')} / 08 · ${labels[index]}`),sceneMode,el('small','',state.studyScene?{en:'Pauses at scene end',es:'Pausa al final de la escena',pt:'Pausa no fim da cena'}[state.language]:{en:'One minute · AI alongside',es:'Un minuto · con IA',pt:'Um minuto · com IA'}[state.language]));}document.querySelector('.replay-badge').textContent='SCENE '+String(index+1).padStart(2,'0');for(const [i,b]of [...chapterNav.children].entries()){b.setAttribute('aria-current',String(i===index));b.querySelector('b').textContent=labels[i];}}else document.querySelector('.replay-badge').textContent='REPLAY';
 put('composer-note',clip?'This film · citations follow the video playhead.':'Same match · evidence cutoff shown on every discussion.');
 const prompts=document.querySelectorAll('[data-question]');prompts[0].textContent=clip?'What matters here?':'Did he score?';prompts[0].dataset.question=clip?'What matters in the latest shot, and what remains unverified?':'Did he score?';prompts[2].dataset.question=clip?'Can we measure the player’s speed from this clip?':'Can we tell how fast the shot was?';
 $('watch-source').value=watchSource;$('scrub').max=clip?PITCHSIDE.duration:36;put('duration',clip?clipClock(PITCHSIDE.duration):'00:36');
 $('clip-session-label').hidden=!(clip);$('session-scenario').closest('label').hidden=clip;
 document.querySelector('.session-fixture').hidden=clip;
 for(const id of ['session-team','session-player'])$(id).closest('label').hidden=clip;
 document.querySelector('.scorebug .lime').textContent=clip?'LIME':'HARBOR';document.querySelector('.scorebug .blue').textContent=clip?'BLUE':'NORTHBRIDGE';
 put('open-centre',clip?'Explore this film ↗':'Explore this play ↗');put('open-truth',clip?'Open the evidence lab ↗':'Challenge its evidence ↗');
 put('loading-note',clip?(state.studyScene?'Single-scene replay · pause at the cut':'The full 60-second film · commentary throughout'):'36 seconds of play · one shared story');
 document.querySelector('#opening h1').innerHTML=clip?'INSIDE THE PLAY.<br>EVERY<br><em>PERSPECTIVE.</em>':'ONE MATCH.<br>EVERY<br><em>PERSPECTIVE.</em>';
 document.querySelector('.quiet-footer').innerHTML=clip?'<span>AI FILM. REVIEWED MOMENTS. YOUR PERSPECTIVE.</span><span>Google Flow · 720p · AI-generated footage</span>':'<span>THE FILM. THE DATA. THE SAME PLAY.</span><span>Synthetic coordinates · illustrative choreography</span>';
 document.querySelector('.lesson-meta>span:last-child').textContent=clip?'REVIEWED VIDEO EVIDENCE':'SHARED MATCH EVIDENCE';
 document.querySelector('#learn-dialog .sheet-note').textContent=clip?'The approximate markers were manually reviewed against this exact clip. No automated tracking or calibrated measurements are claimed.':'Measurements come from synthetic coordinates and event intervals. Tactical explanations remain interpretations, not proof of causation.';
 $('watch-source-note').textContent=clip?'Watch the full minute with the AI crew. Chapters are optional jump points; playback continues through every cut. The film combines separately generated shots, with observations checked against each shot. Single-scene study is available in the playback menu.':'One authored sequence links this film, Match Centre, Truth Lab and the AI discussion.';
}
function renderClip(){
 current=pitchsideStory(viewInput());const w=current.words;
 overlayChannel?.postMessage({type:'clip-state',state:viewInput()});
 $('opening').hidden=started||clipTime>0;$('film').hidden=false;$('corrected-replay').hidden=true;$('restore-record').hidden=true;
 for(const [id,value]of [['session-language',state.language],['session-mode',state.mode],['perspective',state.mode],['story-language',state.language]])$(id).value=value;
 for(const id of ['session-mode','perspective'])for(const option of $(id).options)option.textContent=w[option.value];
 put('bug-clock',clipClock(clipTime));put('current-time',clipClock(clipTime));$('scrub').value=clipTime;put('match-score','VS');put('match-heading',PITCHSIDE.title);put('film-scope','60 SECONDS / AI FILM');
 put('caption-kicker',w[state.mode]);put('caption-title',current.title);$('broadcast-caption').hidden=!started&&clipTime===0;put('now-label',w[state.mode]);put('now-copy',current.body);put('instant-stats',current.stats);put('instant-math',state.mode==='math'?current.equation:'Manual review · no calibrated tracking');
 put('recap-title',current.complete?current.copy.recap:current.copy.partial);put('recap-copy',current.recap);$('recap-card').hidden=!current.complete;put('recap-proof',current.copy.notes+' · '+clipClock(clipTime));
 put('lesson-mode',w[state.mode]);put('lesson-time',clipClock(clipTime));put('lesson-title',current.title);put('lesson-body',current.body);$('math-card').hidden=state.mode!=='math';put('math-card',current.equation);
 const signature=['pitchside',state.language,current.evidence.length].join(':');
 if($('beats').dataset.signature!==signature){$('beats').dataset.signature=signature;$('beats').replaceChildren();$('evidence-list').replaceChildren();for(const e of current.evidence){const b=el('button','beat');b.append(el('b','',clipClock(e.second)),el('strong','',e.title),el('small','','Reviewed observation'));b.onclick=()=>seek(e.second);$('beats').append(b);const row=el('div','evidence-item'),link=el('button','',clipClock(e.second)+' · '+e.id+' ↗');link.onclick=()=>{$('learn-dialog').close();seek(e.second);};row.append(link,el('p','',e.observation));$('evidence-list').append(row);}if(!current.evidence.length)$('evidence-list').append(el('p','',current.copy.intro));}
 renderPanel();if(started&&state.section==='watch'){const cutoff=clipEditorialCutoff(clipTime);if(cutoff!==undefined)requestPanel('',cutoff,false);}
}
$('watch-source').onchange=()=>setSource($('watch-source').value);
state=matchSession.get();loadVideo();render();$('hero-play').disabled=false;$('play').disabled=false;put('connection-status','MATCH NOTES READY');config.then(()=>fetch(base+'/api/health')).then(r=>r.json()).then(h=>put('connection-status',h.ai_configured?'AZURE AI READY':'INSTANT MATCH NOTES')).catch(()=>{});
const initial=location.hash.slice(1);if(['truth','centre','inside','presenters','lab'].includes(initial))document.getElementById(initial+'-nav')?.click();

