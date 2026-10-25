import {matchSession} from './match-session.js';
import {buildAccessibleReplay,replayCueAt} from './accessible-replay-core.js';
import {workspace,subscribeWorkspace} from './source-workspace.js';
import {COLOR_VISION_MODES} from './accessibility-core.js';

const $=selector=>document.querySelector(selector);
const clock=seconds=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
const speechLanguages={en:'en-US',es:'es-ES',pt:'pt-BR'};
const ui={
 en:{button:'Replay my way',title:'The moment, your way.',intro:'One reached play. Spoken action, readable captions and a plain-language explanation.',play:'Play accessible replay',pause:'Pause replay',again:'Replay this segment',spoken:'Spoken action',captions:'Captions',plain:'Plain explanation',spatial:'Directional event cues',possession:'Possession changes.',check:'Can I use this replay?',scope:'Only evidence reached before this replay was opened appears here.',ready:'Ready to replay',ended:'Segment complete',unsupported:'Spoken action is unavailable in this browser. Captions remain available.',label:'BTR · AUDIO DESCRIPTION',open:'Play a moment first to unlock its replay.'},
 es:{button:'Repetir a tu manera',title:'La jugada, a tu manera.',intro:'Una jugada alcanzada. Acción narrada, subtítulos claros y explicación sencilla.',play:'Reproducir repetición accesible',pause:'Pausar repetición',again:'Repetir este segmento',spoken:'Acción narrada',captions:'Subtítulos',plain:'Explicación sencilla',spatial:'Sigue el balón con sonido',possession:'Cambia la posesión.',check:'¿Puedo usar esta repetición?',scope:'Solo aparece evidencia alcanzada antes de abrir esta repetición.',ready:'Lista para repetir',ended:'Segmento terminado',unsupported:'La narración no está disponible en este navegador. Los subtítulos siguen disponibles.',label:'BTR · AUDIODESCRIPCIÓN',open:'Reproduce una jugada para desbloquear la repetición.'},
 pt:{button:'Rever do seu jeito',title:'O lance, do seu jeito.',intro:'Um lance já visto. Ação narrada, legendas legíveis e explicação simples.',play:'Reproduzir replay acessível',pause:'Pausar replay',again:'Rever este trecho',spoken:'Ação narrada',captions:'Legendas',plain:'Explicação simples',spatial:'Siga a bola pelo som',possession:'A posse muda.',check:'Posso usar este replay?',scope:'Só aparece evidência alcançada antes de abrir este replay.',ready:'Pronto para rever',ended:'Trecho concluído',unsupported:'A narração não está disponível neste navegador. As legendas continuam disponíveis.',label:'BTR · AUDIODESCRIÇÃO',open:'Assista a um lance para liberar o replay.'}
};

function make(tag,className,text){const element=document.createElement(tag);if(className)element.className=className;if(text!==undefined)element.textContent=text;return element;}

const launch=make('button','accessible-replay-launch');launch.type='button';
const dialog=make('dialog','accessible-replay-dialog');dialog.setAttribute('aria-labelledby','accessible-replay-title');
dialog.innerHTML=`<div class="accessible-replay-shell"><header><div><small>BTR / ACCESSIBLE REPLAY</small><h2 id="accessible-replay-title"></h2><p data-replay-intro></p></div><button type="button" class="accessible-replay-close" aria-label="Close accessible replay">×</button></header><div class="accessible-replay-grid"><div class="accessible-replay-screen"><video playsinline preload="metadata" muted aria-label="Short evidence-bounded football replay"></video><div class="accessible-replay-caption" aria-live="polite"><span data-replay-speaker></span><strong data-replay-caption></strong></div><div class="accessible-replay-origin"><span data-replay-source></span><b data-replay-revision></b></div></div><aside class="accessible-replay-information"><div class="accessible-replay-time"><span data-replay-window></span><span data-replay-progress></span></div><div class="accessible-replay-evidence"><span data-replay-kind></span><h3 data-replay-title></h3><p data-replay-explanation></p><small data-replay-ids></small></div><div class="accessible-replay-markers" aria-label="Color and shape key"><span class="home"></span><span class="away"></span></div><p class="accessible-replay-limit" data-replay-limit></p></aside></div><footer><div class="accessible-replay-actions"><button type="button" class="accessible-replay-play"></button><button type="button" class="accessible-replay-again"></button></div><div class="accessible-replay-options"><label><input type="checkbox" data-replay-option="spoken" checked><span data-replay-spoken></span></label><label><input type="checkbox" data-replay-option="captions" checked><span data-replay-captions></span></label><label><input type="checkbox" data-replay-option="plain" checked><span data-replay-plain></span></label><label class="accessible-replay-spatial"><input type="checkbox" data-replay-option="spatial"><span data-replay-spatial></span></label></div><p class="accessible-replay-status" role="status" data-replay-status></p><details class="accessible-replay-check"><summary data-replay-check></summary><ul data-replay-check-list></ul><small>Live interface checks, not a WCAG certification. Test with users and assistive technology.</small></details><small data-replay-scope></small></footer></div>`;
document.body.append(dialog);
$('.viewing-actions')?.prepend(launch);

let plan=null,activeCue=null,autoplay=false,spokenCueAt=null,spatialCueAt=null,playing=false,audioContext=null;
const video=dialog.querySelector('video');
const text=(selector,value)=>{const element=dialog.querySelector(selector);if(element)element.textContent=value;};
const checked=name=>dialog.querySelector(`[data-replay-option="${name}"]`).checked;
function stopSpeech(){if('speechSynthesis'in window)window.speechSynthesis.cancel();spokenCueAt=null;}
function say(cue){
 if(!checked('spoken')||!('speechSynthesis'in window)||!playing)return;
 const priority=cue.kind==='correction'||cue.possessionChange||/limit|límite|limite/i.test(cue.title);
 if(spokenCueAt!==null&&cue.at-spokenCueAt<3.5&&!priority)return;
 const short=cue.possessionChange?`${ui[plan.language].possession} ${cue.text.split(/[.!?]/)[0].slice(0,85)}`:cue.kind==='correction'?cue.text:cue.text.split(/[.!?]/)[0].slice(0,105);
 if('speechSynthesis'in window)window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(short);utterance.lang=speechLanguages[plan.language];utterance.rate=1.04;window.speechSynthesis.speak(utterance);spokenCueAt=cue.at;
}
function spatialCue(cue){
 if(!playing||!checked('spatial')||plan.source!=='match'||cue.pan===undefined||spatialCueAt===cue.at)return;
 spatialCueAt=cue.at;
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 try{audioContext||=new Audio();audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),pan=audioContext.createStereoPanner?.();oscillator.type='sine';oscillator.frequency.value=cue.possessionChange?470:330;gain.gain.setValueAtTime(.0001,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.055,audioContext.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.23);oscillator.connect(gain);if(pan){pan.pan.value=cue.pan;gain.connect(pan);pan.connect(audioContext.destination);}else gain.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+.24);}catch{}
}
function captionContrast(){
 const caption=dialog.querySelector('.accessible-replay-caption strong'),style=getComputedStyle(caption),rgb=value=>[...value.matchAll(/[\d.]+/g)].slice(0,3).map(match=>Number(match[0])/255),luminance=value=>{const [r,g,b]=rgb(value).map(channel=>channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;};
 const foreground=luminance(style.color),background=luminance(style.backgroundColor);
 return ((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)).toFixed(1);
}
function updateReadiness(){
 const list=dialog.querySelector('[data-replay-check-list]');if(!plan)return;
 const color=document.documentElement.dataset.colorVision||'standard',rows=[
  `Captions: ${checked('captions')?'on and synchronized to the replay':'off by choice'}. Text contrast ${captionContrast()}:1 against its opaque background.`,
  `Spoken action: ${checked('spoken')?'on':'off or unavailable'}; browser voice support varies.`,
  `Color: ${COLOR_VISION_MODES[color]?.label||COLOR_VISION_MODES.standard.label} plus distinct marker shapes and text labels.`,
  `Keyboard: labeled play, replay, option and close controls; Escape closes the panel.`,
  `Screen reader: named controls, current evidence text and source IDs.`,
  plan.source==='match'?`Directional event sound: ${checked('spatial')?'on':'off'}; uses synthetic event positions only.`:'Film: manually reviewed frames; no player tracking or directional event sound.'
 ];list.replaceChildren(...rows.map(row=>make('li','',row)));
}
function updateCue(force=false){
 if(!plan)return;
 const position=Math.min(plan.end,Math.max(plan.start,video.currentTime||plan.start)),cue=replayCueAt(plan,position),labels=ui[plan.language];
 text('[data-replay-progress]',`${clock(position)} / ${clock(plan.end)}`);
 if(!force&&activeCue===cue)return;
 activeCue=cue;
 text('[data-replay-speaker]',`${labels.label} · ${cue.kind==='correction'?plan.labels.correction:cue.kind==='calculated'?plan.labels.calculated:plan.labels.observed}`);
 text('[data-replay-caption]',cue.text);
 text('[data-replay-kind]',cue.kind==='correction'?plan.labels.correction:cue.kind==='calculated'?plan.labels.calculated:plan.labels.observed);
 text('[data-replay-title]',cue.title);
 text('[data-replay-explanation]',checked('plain')?cue.text:cue.detail||cue.text);
 text('[data-replay-ids]',cue.evidenceIds?.length?`SOURCE ${cue.evidenceIds.join(' · ')}`:'SOURCE · opening context');
 dialog.querySelector('.accessible-replay-caption').hidden=!checked('captions');
 dialog.querySelector('.accessible-replay-caption').setAttribute('aria-live',checked('spoken')?'off':'polite');
 if(playing){say(cue);spatialCue(cue);}updateReadiness();
}
function finish(){playing=false;video.pause();stopSpeech();text('[data-replay-status]',ui[plan.language].ended);dialog.querySelector('.accessible-replay-play').textContent=ui[plan.language].play;}
function seekStart(){if(video.readyState>=1)video.currentTime=plan.start;else autoplay=true;}
async function play(){
 if(!plan)return;
 if(video.currentTime>=plan.end-.1){spatialCueAt=null;seekStart();}
 if(video.readyState<2||video.seeking){autoplay=true;return;}
 autoplay=false;try{await video.play();playing=true;dialog.querySelector('.accessible-replay-play').textContent=ui[plan.language].pause;updateCue(true);text('[data-replay-status]','');}catch{text('[data-replay-status]','Playback could not start. Use the play button to try again.');}
}
function populate(){
 const session=matchSession.get(),language=['en','es','pt'].includes(session.language)?session.language:'en',labels=ui[language];
 plan=buildAccessibleReplay(session);activeCue=null;spokenCueAt=null;spatialCueAt=null;
 text('#accessible-replay-title',labels.title);text('[data-replay-intro]',labels.intro);text('[data-replay-window]',`${clock(plan.start)}–${clock(plan.end)} · ${Math.round(plan.end-plan.start)}s`);text('[data-replay-source]',plan.source==='match'?'SYNTHETIC MATCH / MEASURED REPLAY':'REVIEWED FILM / EDITED SHOTS');text('[data-replay-revision]',`R${plan.revision}`);text('[data-replay-limit]',plan.limit);text('[data-replay-scope]',labels.scope);text('[data-replay-spoken]',labels.spoken);text('[data-replay-captions]',labels.captions);text('[data-replay-plain]',labels.plain);text('[data-replay-spatial]',labels.spatial);text('[data-replay-check]',labels.check);text('[data-replay-status]',labels.ready);dialog.querySelector('.accessible-replay-play').textContent=labels.play;dialog.querySelector('.accessible-replay-again').textContent=labels.again;
 const markers=dialog.querySelectorAll('.accessible-replay-markers span');markers[0].textContent=plan.source==='match'?'● HARBOR':'● REVIEWED FRAME';markers[1].textContent=plan.source==='match'?'■ NORTHBRIDGE':'◆ EDITORIAL LIMIT';dialog.querySelector('.accessible-replay-spatial').hidden=plan.source!=='match';dialog.querySelector('[data-replay-option="spatial"]').checked=false;
 const supported='speechSynthesis'in window;dialog.querySelector('[data-replay-option="spoken"]').disabled=!supported;if(!supported){dialog.querySelector('[data-replay-option="spoken"]').checked=false;text('[data-replay-status]',labels.unsupported);}
 const spatialSupported=Boolean(window.AudioContext||window.webkitAudioContext);dialog.querySelector('[data-replay-option="spatial"]').disabled=!spatialSupported;
 video.pause();video.poster=plan.poster;video.src=plan.video;video.load();seekStart();updateCue(true);updateReadiness();
}
function close(){autoplay=false;playing=false;video.pause();stopSpeech();video.removeAttribute('src');video.load();}
launch.onclick=()=>{if(launch.disabled||workspace.source)return;$('#film')?.pause();populate();dialog.showModal();autoplay=true;if(video.readyState>=2)play();};
dialog.querySelector('.accessible-replay-close').onclick=()=>dialog.close();
dialog.querySelector('.accessible-replay-play').onclick=()=>{if(playing){video.pause();playing=false;stopSpeech();dialog.querySelector('.accessible-replay-play').textContent=ui[plan.language].play;}else play();};
dialog.querySelector('.accessible-replay-again').onclick=()=>{video.pause();playing=false;stopSpeech();spatialCueAt=null;seekStart();play();};
dialog.querySelectorAll('[data-replay-option]').forEach(input=>input.onchange=()=>{if(input.dataset.replayOption==='spoken'){if(!input.checked)stopSpeech();else if(activeCue)say(activeCue);}if(input.dataset.replayOption==='spatial'&&input.checked){const Audio=window.AudioContext||window.webkitAudioContext;try{audioContext||=new Audio();audioContext.resume();}catch{input.checked=false;}}updateCue(true);updateReadiness();});
dialog.addEventListener('close',close);
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
video.addEventListener('loadedmetadata',()=>{video.currentTime=plan.start;});
video.addEventListener('seeked',()=>{if(autoplay)play();else updateCue(true);});
video.addEventListener('loadeddata',()=>{if(autoplay)play();});
video.addEventListener('timeupdate',()=>{if(!plan)return;if(video.currentTime>=plan.end-.05){finish();return;}updateCue();});
video.addEventListener('ended',finish);
function refreshLaunch(){const session=matchSession.get(),language=['en','es','pt'].includes(session.language)?session.language:'en';launch.textContent=`▶ ${ui[language].button}`;launch.disabled=Boolean(workspace.source)||(session.source==='match'?session.time:session.clipTime)<1.5;launch.title=launch.disabled?workspace.source?'Available for the built-in film and synthetic match.':ui[language].open:'';}
matchSession.subscribe((next,source)=>{refreshLaunch();if(dialog.open&&source!=='film'&&source!=='study-video'){const changed=next.source!==plan.source||next.scenario!==plan.scenario||(next.source==='match'&&next.corrected!==(plan.revision===2))||(next.source==='pitchside'&&(next.clipChallenge?5:4)!==plan.revision);if(changed)dialog.close();}});
document.addEventListener('btr-section',event=>{if(event.detail!=='watch'&&dialog.open)dialog.close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open){video.pause();playing=false;stopSpeech();dialog.querySelector('.accessible-replay-play').textContent=ui[plan.language].play;}});
subscribeWorkspace(()=>{refreshLaunch();if(workspace.source&&dialog.open)dialog.close();});
refreshLaunch();
