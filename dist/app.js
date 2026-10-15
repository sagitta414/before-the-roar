import {PLAYERS,SCENARIOS,position,ball,story,metrics,clock,overlayPacket} from './engine.js';
import {syncFilm} from './video-sync.js';
import {FEATURED_CLIP,CLIP_BEATS,clipStory,clipOverlayPacket,clipTime} from './featured-clip.js';
const SCENES=[FEATURED_CLIP,...SCENARIOS];
const $=id=>document.getElementById(id);
const film=$('match-film');
const state={index:0,t:0,playing:false,speed:1,mode:'casual',lang:'en',focus:8,corrected:false,alternative:false,quiet:matchMedia('(prefers-reduced-motion: reduce)').matches,tab:'story',view:'cinematic'};
const cinemaCopy={wide:['The run you<br>didn’t notice.','La carrera<br>que no viste.'],press:['The pressure<br>before the pass.','La presión<br>antes del pase.'],counter:['One recovery.<br>A different game.','Una recuperación.<br>Otro partido.']};
const observed=new Map();
const canvas=$('pitch'),ctx=canvas.getContext('2d');let width=900,height=480,dpr=1,last=0,uiTick=0;
const getS=()=>SCENES[state.index];
const isFeatured=()=>getS().id==='featured';
const txt=(en,es)=>state.lang==='es'?es:en;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),3400);}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
// A projected tactical pitch, generated entirely from the synthetic tracking coordinates.
function project(x,y){const mobile=width<500;const top=height*(mobile?.32:.29),bottom=height*(mobile?.71:.80);const q=y/68;const left=width*(.19-.16*q),right=width*(.81+.16*q);return [left+(right-left)*x/105,top+(bottom-top)*q];}
function line(points,color='#c0d7b64d',lw=1,dash=[]){ctx.beginPath();points.forEach(([x,y],i)=>{const p=project(x,y);i?ctx.lineTo(...p):ctx.moveTo(...p)});ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
function polygon(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>{const p=project(x,y);i?ctx.lineTo(...p):ctx.moveTo(...p)});ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function ellipse(cx,cy,rx,ry,color,lw=1){const a=[];for(let i=0;i<=80;i++){const ang=i/80*Math.PI*2;a.push([cx+Math.cos(ang)*rx,cy+Math.sin(ang)*ry])}line(a,color,lw);}
function arrow(a,b,color,dashed=false){const p=project(...a),q=project(...b),angle=Math.atan2(q[1]-p[1],q[0]-p[0]);ctx.save();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.setLineDash(dashed?[5,5]:[]);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(...q);ctx.lineTo(q[0]-7*Math.cos(angle-.45),q[1]-7*Math.sin(angle-.45));ctx.moveTo(...q);ctx.lineTo(q[0]-7*Math.cos(angle+.45),q[1]-7*Math.sin(angle+.45));ctx.stroke();ctx.restore();}
function draw(){
 const s=getS(),t=state.t;

 if(state.view==='cinematic')return;
 ctx.clearRect(0,0,width,height);
 // Fine stadium geometry and soft floodlight wash.
 const glow=ctx.createRadialGradient(width*.58,height*.18,0,width*.58,height*.18,width*.65);glow.addColorStop(0,'#759b7715');glow.addColorStop(1,'#091a1500');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle='#5e8571';ctx.lineWidth=.6;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(0,height*.2-i*8);ctx.quadraticCurveTo(width*.5,height*.12-i*5,width,height*.20-i*8);ctx.stroke();}ctx.restore();
 polygon([[0,0],[105,0],[105,68],[0,68]],'#214d38');
 for(let i=0;i<10;i++)polygon([[i*10.5,0],[(i+1)*10.5,0],[(i+1)*10.5,68],[i*10.5,68]],i%2?'#29563c':'#244d37');
 polygon([[0,0],[105,0],[105,68],[0,68]],'#10291a20');
 line([[0,0],[105,0],[105,68],[0,68],[0,0]],'#b9d5a66b',1.2);line([[52.5,0],[52.5,68]],'#b9d5a64d');ellipse(52.5,34,9.15,9.15,'#b9d5a64d');
 line([[0,13.84],[16.5,13.84],[16.5,54.16],[0,54.16]]);line([[105,13.84],[88.5,13.84],[88.5,54.16],[105,54.16]]);line([[0,24.84],[5.5,24.84],[5.5,43.16],[0,43.16]]);line([[105,24.84],[99.5,24.84],[99.5,43.16],[105,43.16]]);
 for(const x of [11,52.5,94]){const p=project(x,34);ctx.fillStyle='#b4cc9766';ctx.beginPath();ctx.arc(...p,1.5,0,Math.PI*2);ctx.fill();}
 // Goal nets.
 for(const x of [0,105]){const outward=x===0?-2:2;line([[x,30.34],[x+outward,30.34],[x+outward,37.66],[x,37.66]],'#c4d5c66b');for(let y=31;y<38;y+=1.3)line([[x,y],[x+outward,y]],'#bccabc30',.6);}
 const engaged=t>=8;const focus=state.mode==='player'?Number(state.focus):s.focus;
 if(s.id==='wide'&&t>=12&&!state.corrected&&!state.alternative){const a=position(s,102,t),b=position(s,104,t);polygon([[a[0]-5,a[1]+2],[b[0]-4,b[1]-1],[b[0]-13,b[1]-1],[a[0]-12,a[1]+2]],'#d0f78a18');line([[a[0]-3,a[1]],[b[0]-3,b[1]]],'#d0f78a66',1,[3,4]);if(state.mode==='analyst'){const p=project(76,22);ctx.font='8px "DM Sans",Arial';ctx.fillStyle='#dbfba1';ctx.fillText(txt('OPENING LANE','ESPACIO ABIERTO'),p[0]-20,p[1]-8);}}
 if(engaged&&!state.quiet){const current=position(s,focus,t,state.corrected,state.alternative),start=position(s,focus,Math.max(0,t-10),state.corrected,state.alternative);arrow(start,current,'#d7f5a0b0',true);if(s.id==='wide'&&!state.alternative&&!state.corrected){arrow(position(s,102,Math.max(0,t-8)),position(s,102,t),'#86b1da88',true);}}
 if(state.mode==='analyst'){for(const event of metrics(s,t,state.corrected).seen.filter(e=>e.type==='pass').slice(-2))arrow(event.start,event.endPosition,'#f0efc866',true);}
 // Depth order keeps nearer players in front.
 [...PLAYERS].sort((a,b)=>position(s,a.id,t)[1]-position(s,b.id,t)[1]).forEach(p=>{
 const pos=position(s,p.id,t,state.corrected,state.alternative),[x,y]=project(...pos),isFocus=p.id===focus,r=width<500?4.5:5.7;const lime=p.team==='harbor';
 if(isFocus){const halo=ctx.createRadialGradient(x,y,3,x,y,32);halo.addColorStop(0,'#defa9640');halo.addColorStop(1,'#defa9600');ctx.fillStyle=halo;ctx.beginPath();ctx.ellipse(x,y,34,20,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d9f79988';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+3,14,7,0,0,Math.PI*2);ctx.stroke();}
 ctx.fillStyle='#061c1977';ctx.beginPath();ctx.ellipse(x+2,y+5,r*1.4,r*.5,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=lime?'#d3f58c':'#7ca6d2';ctx.fill();ctx.strokeStyle=lime?'#ebffc9':'#adc5e0';ctx.lineWidth=.9;ctx.stroke();
 ctx.font=`600 ${width<500?6:7}px "DM Sans",Arial`;ctx.fillStyle=lime?'#2f4c23':'#17385a';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.number||p.id,x,y+.2);
 if(isFocus){const name=p.name.toUpperCase();ctx.font=`600 ${width<500?7:8}px "DM Sans",Arial`;const textWidth=ctx.measureText(name).width;ctx.fillStyle='#0e251de8';ctx.fillRect(x-textWidth/2-7,y-29,textWidth+14,15);ctx.fillStyle='#d5f497';ctx.fillText(name,x,y-21);ctx.beginPath();ctx.moveTo(x-3,y-14);ctx.lineTo(x+3,y-14);ctx.lineTo(x,y-10);ctx.fill();}
 });
 const [bx,by]=project(...ball(s,t));ctx.shadowColor='#f9ffe0';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(bx,by,width<500?2.5:3.2,0,Math.PI*2);ctx.fillStyle='#fffde7';ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#152e24';ctx.lineWidth=.8;ctx.stroke();
 // Alternative view intentionally changes only one geometric assumption, not ball outcomes.
 if(state.alternative){const [x,y]=project(78,22);ctx.fillStyle='#ffe7b3';ctx.font='8px "DM Sans",Arial';ctx.textAlign='center';ctx.fillText(txt('DEFENDER HOLDS POSITION','DEFENSOR MANTIENE POSICIÓN'),x,y-34);}
 ctx.textAlign='left';ctx.textBaseline='alphabetic';
}
const chains={wide:[['Moreau moves wide','Moreau se abre','An off-ball run on the left.','Una carrera sin balón por la izquierda.'],['The defender shifts','El defensor se desplaza','A gap opens between defenders.','Se abre un espacio entre defensores.'],['The pass finds Brooks','El pase encuentra a Brooks','The sequence reaches the striker.','La secuencia llega al delantero.'],['Brooks finishes','Brooks marca','A goal at the end of the sequence.','Un gol al final de la secuencia.']],press:[['Silva closes down','Silva presiona','Pressure on the ball carrier.','Presión sobre el poseedor.'],['Cole intercepts','Cole intercepta','A pass becomes a recovery.','Un pase se convierte en recuperación.'],['Harbor find Brooks','Harbor encuentra a Brooks','A forward pass reaches the striker.','Un pase hacia delante llega al delantero.'],['The finish','La definición','Brooks scores from the move.','Brooks marca tras la jugada.']],counter:[['Cole wins it back','Cole recupera','Possession changes in midfield.','La posesión cambia en el centro.'],['Silva plays forward','Silva avanza','Harbor begin their transition.','Harbor inicia la transición.'],['Brooks gets in behind','Brooks rompe al espacio','The forward reaches the pass.','El delantero recibe el pase.'],['Berg makes the save','Berg realiza la parada','The attack ends without a goal.','El ataque termina sin gol.']]};
function renderScenes(){
 const key=state.index+state.lang;if(renderScenes.key===key)return;renderScenes.key=key;
 $('rundown').innerHTML=SCENES.map((sc,i)=>`<button data-scene="${i}" class="rundown-item ${i===state.index?'active':''}" aria-pressed="${i===state.index}"><span class="rundown-index">0${i+1}</span><span class="rundown-copy"><small>${i===0?txt('FEATURED FILM · 0:08','VÍDEO · 0:08'):txt('TACTICAL LAB · 0:36','LABORATORIO · 0:36')}</small><strong>${escape(state.lang==='es'?sc.esTitle:sc.title)}</strong></span><span class="rundown-play" aria-hidden="true">${i===state.index?'●':'▶'}</span></button>`).join('');
 $('sequences').innerHTML=SCENES.map((sc,i)=>`<button class="sequence ${i===state.index?'selected':''}" data-scene="${i}" aria-pressed="${i===state.index}"><div class="sequence-image"><img src="assets/${sc.id}${i===0?'-poster.jpg':'-cinema.png'}" alt="" loading="lazy"><span class="sequence-number">${i===0?txt('FEATURED FILM','VÍDEO DESTACADO'):txt('TACTICAL LAB','LABORATORIO')+' / 0'+i}</span><span class="chapter-play" aria-hidden="true">${i===state.index?'↗':'▶'}</span></div><div class="sequence-copy"><h3>${state.lang==='es'?sc.esTitle:sc.title}</h3><p>${i===0?txt('00:08 · AI-generated footage','00:08 · Vídeo generado con IA'):txt('00:36 · Synthetic simulation','00:36 · Simulación sintética')}</p></div></button>`).join('');
}
function localizeControls(){

 document.documentElement.lang=state.lang;
 document.querySelector('[data-mode="casual"]').textContent=txt('The fan view','Para el aficionado');
 document.querySelector('[data-mode="analyst"]').textContent=txt('The analyst','El analista');
 document.querySelector('[data-mode="player"]').textContent=isFeatured()?txt('Follow No. 8','Sigue al 8'):txt('Follow a player','Sigue a un jugador');
 $('story-tab').textContent=txt('The breakdown','El análisis');$('evidence-tab').textContent=txt('The evidence','La evidencia');
 $('match-nav').textContent=txt('Match center','Centro de partido');$('library-nav').textContent=txt('Explore','Explorar');$('recap-nav').textContent=txt('Your recap','Tu resumen');
 $('program-title').textContent=state.lang==='es'?getS().esTitle:getS().title;
 $('numbers-heading').textContent=isFeatured()?txt('THE MOMENT IN FOCUS','LA JUGADA EN DETALLE'):txt('THE NUMBERS BEHIND THE PLAY','LOS NÚMEROS DE LA JUGADA');
 $('numbers-source').textContent=isFeatured()?txt('REVIEWED FOOTAGE','VÍDEO REVISADO'):txt('SYNTHETIC TRACKING','DATOS SINTÉTICOS');
 $('moment-log-label').innerHTML=txt('The sequence <span>+</span>','La secuencia <span>+</span>');
 document.querySelector('.footnote-sub').textContent=isFeatured()?txt('AI-generated footage · reviewed observations','Vídeo IA · observaciones revisadas'):txt('Synthetic evidence. No invented certainty.','Evidencia sintética. Sin certezas inventadas.');
 $('show-evidence').textContent=txt('Show me why ↗','Muéstrame por qué ↗');
 $('export').textContent=txt('↓ Export timed overlay JSON','↓ Exportar superposición JSON');
 $('download-film').innerHTML=txt('<span>Save clip</span> ↓','<span>Guardar</span> ↓');$('download-film').title=txt('Download current clip','Descargar este vídeo');
 document.querySelector('.sequence-heading').innerHTML=`<span>${txt('HIGHLIGHTS & BREAKDOWNS','JUGADAS Y ANÁLISIS')}<span class="heading-dot">.</span></span><span>${txt('The moments that matter. The detail you missed.','Las jugadas que importan. Los detalles que no viste.')}</span>`;
}
function updateFeatured(){
 const n=clipStory(state.t,state.mode,state.lang),es=state.lang==='es';
 document.body.classList.add('view-featured','view-cinematic');document.body.classList.remove('view-tactical');
 document.body.classList.toggle('quiet-mode',state.quiet);$('quiet').setAttribute('aria-pressed',state.quiet);
 syncFilm(film,state,FEATURED_CLIP);
 film.setAttribute('aria-label',txt('AI-generated football highlight with manually reviewed story beats','Jugada de fútbol generada con IA, con momentos revisados manualmente'));
 $('cinematic-view').textContent=txt('Featured film','Vídeo destacado');$('cinematic-view').setAttribute('aria-pressed','true');
 $('tactical-view').textContent=txt('Data lab ↗','Laboratorio ↗');$('tactical-view').setAttribute('aria-pressed','false');
 $('download-film').href='assets/featured-film.mp4';
 $('film-origin').textContent=txt('AI-GENERATED FOOTBALL','FÚTBOL GENERADO CON IA');
 $('film-description').textContent=txt('8 seconds · five reviewed moments · sound available','8 segundos · cinco momentos revisados · con sonido');
 document.querySelector('.image-disclosure').textContent=txt('AI-GENERATED FOOTAGE · GOOGLE FLOW','VÍDEO GENERADO CON IA · GOOGLE FLOW');
 $('fixture-home').textContent=txt('Lime XI','Equipo verde');$('fixture-away').textContent=txt('Blue XI','Equipo azul');$('score').textContent='vs';
 $('fixture-meta').textContent=txt('FICTIONAL HIGHLIGHT · RESULT UNCONFIRMED','JUGADA FICTICIA · RESULTADO SIN CONFIRMAR');
 $('timeline').max=8;$('timeline').value=state.t;$('elapsed').textContent=clipTime(state.t);$('duration').textContent='00:08';
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause sequence':'Play sequence');$('speed').textContent=state.speed+'×';
 $('featured-play').hidden=state.playing||(state.t>0&&state.t<8);
 $('featured-play').textContent=state.t>=8?txt('↺ Watch again','↺ Ver de nuevo'):txt('▶ Watch the moment','▶ Ver la jugada');
 $('film-sound').hidden=false;$('film-sound').textContent=film.muted?txt('Sound off','Sin sonido'):txt('Sound on','Con sonido');$('film-sound').setAttribute('aria-pressed',!film.muted);
 $('story-title').textContent=n.title;$('story-description').textContent=n.body;$('story-time').textContent=clipTime(state.t);
 $('story-state').textContent=state.t>=8?txt('CLIP REVIEWED','VÍDEO REVISADO'):txt('FOLLOW THE MOMENT','SIGUE LA JUGADA');
 $('overlay').hidden=state.quiet;$('overlay-kicker').textContent=n.kicker;$('overlay-text').textContent=n.short;
 $('callout-player').textContent=txt('Lime No. 8','El 8 de verde');$('callout-role').textContent=txt('Visible shirt number · fictional player','Número visible · jugador ficticio');$('callout-number').textContent='8';
 $('player-art').style.backgroundImage='url(assets/featured-poster.jpg)';
 $('story-chain').innerHTML=n.evidence.length?n.evidence.map(e=>`<div class="chain-row done"><span class="chain-dot"></span><div><strong>${escape(e.title)} <small>${e.time}</small></strong><p>${escape(e.detail)}</p></div></div>`).join(''):`<p class="evidence-intro">${txt('Press play. The evidence trail grows with the action.','Pulsa reproducir. La evidencia aparece con la acción.')}</p>`;
 $('evidence-list').innerHTML=n.evidence.length?n.evidence.map(e=>`<article class="evidence-item"><span>${e.time} · ${txt('VISUALLY REVIEWED','REVISIÓN VISUAL')}</span><h4>${escape(e.title)}</h4><p>${escape(e.detail)}</p><button class="evidence-seek" data-seek="${e.sequence_time_ms/1000}">${txt('Watch this moment ↗','Ver este momento ↗')}</button></article>`).join(''):`<p class="evidence-intro">${txt('No reviewed moments reached yet. Play or scrub the clip.','Aún no has llegado a un momento revisado. Reproduce o avanza el vídeo.')}</p>`;
 document.querySelector('.model-note p').textContent=txt('AI-generated video. Approximate timestamps and observations were reviewed manually; stories are authored in English and Spanish. Tactical meaning is interpretation. No live AI analysis or measured tracking is connected.','Vídeo generado con IA. Las observaciones y los tiempos aproximados se revisaron manualmente; las historias están redactadas en inglés y español. El significado táctico es una interpretación. No hay análisis de IA en directo ni seguimiento medido.');
 $('pass-label').textContent=txt('CLIP LENGTH','DURACIÓN');$('pass-stat').textContent='8';$('pass-unit').textContent='s';$('pass-detail').textContent=txt('One short fictional football moment','Una breve jugada de fútbol ficticia');
 $('metric-two-label').textContent=txt('MOMENTS REVIEWED','MOMENTOS REVISADOS');$('space-stat').textContent=n.evidence.length;$('space-unit').textContent='/ 5';$('space-detail').textContent=txt('Revealed as the clip plays','Aparecen durante la reproducción');
 $('speed-label').textContent=txt('SHOT OUTCOME','RESULTADO DEL DISPARO');$('speed-stat').textContent=txt('Unclear','Incierto');$('speed-unit').textContent='';$('speed-detail').textContent=txt('No goal or save assigned','No se asigna gol ni parada');
 $('clip-note').hidden=false;$('clip-note').textContent=txt('Reviewed from the footage. Match score, player speed and pass accuracy are unverified.','Revisión del vídeo. El marcador, la velocidad y la precisión de pase no están verificados.');
 $('clip-beats').hidden=false;
 const beatKey=state.lang+':'+n.activeId;if(updateFeatured.beatKey!==beatKey){updateFeatured.beatKey=beatKey;$('clip-beats').innerHTML=CLIP_BEATS.map((b,i)=>`<button data-seek="${b.at}" class="${n.activeId===b.id?'active':''}" aria-pressed="${n.activeId===b.id}"><span>0${i+1}</span>${escape(b.title[es?1:0])}</button>`).join('');}
 $('player-wrap').hidden=true;document.querySelector('.alternative-box').hidden=true;$('alternative-banner').hidden=true;
 document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode)});
 $('story-content').hidden=state.tab!=='story';$('evidence-content').hidden=state.tab!=='evidence';for(const k of ['story','evidence']){$(k+'-tab').classList.toggle('active',state.tab===k);$(k+'-tab').setAttribute('aria-pressed',state.tab===k)}
 const previous=observed.get('featured');if(!previous||state.t>previous.t)observed.set('featured',{t:state.t,corrected:false});
 renderScenes();
}
function update(){
 localizeControls();
 if(isFeatured()){updateFeatured();return;}
 document.body.classList.remove('view-featured');
 $('tactical-view').textContent=txt('Tactical','Táctica');
 $('match-film').setAttribute('aria-label','Fictional football match rendered from synthetic tracking data');
 document.querySelector('.image-disclosure').textContent=txt('SYNTHETIC 3D MATCH · 720p','PARTIDO 3D SINTÉTICO · 720p');
 $('film-origin').textContent=txt('SYNTHETIC TRACKING REPLAY','REPETICIÓN DE DATOS SINTÉTICOS');
 $('film-description').textContent=txt('36 seconds · coordinates and events available','36 segundos · coordenadas y eventos disponibles');
 $('fixture-home').textContent='Harbor FC';$('fixture-away').textContent='Northbridge';
 $('fixture-meta').textContent=txt('SYNTHETIC MATCH · SECOND HALF','PARTIDO SINTÉTICO · SEGUNDA PARTE');
 $('pass-label').textContent=txt('PASS COMPLETION','PASES COMPLETADOS');$('pass-unit').textContent='%';
 $('speed-label').textContent=txt('BALL TRAVEL','VELOCIDAD DEL BALÓN');$('speed-unit').textContent='km/h';
 $('clip-note').hidden=true;$('clip-beats').hidden=true;$('film-sound').hidden=true;
 $('featured-play').hidden=true;
 document.querySelector('.model-note p').textContent=txt('Calculated metrics, transparent rules and authored English/Spanish narratives. This replay uses authored narratives; open Live AI Studio for Azure AI.','Métricas calculadas, reglas transparentes y narrativas redactadas en inglés y español. No hay un modelo de IA conectado.');
 const s=getS(),n=story(s,state.t,state.mode,state.lang,state.corrected,state.focus),es=state.lang==='es';
 document.body.classList.toggle('view-cinematic',state.view==='cinematic');document.body.classList.toggle('view-tactical',state.view==='tactical');
 $('cinematic-view').setAttribute('aria-pressed',state.view==='cinematic');$('tactical-view').setAttribute('aria-pressed',state.view==='tactical');
 $('replay-label-text').textContent=state.view==='cinematic'?txt('MATCH STORIES','HISTORIAS DEL PARTIDO'):txt('TACTICAL REPLAY','REPETICIÓN TÁCTICA');
 syncFilm(film,state,s);$('download-film').href=`assets/${s.id}-film.mp4`;
 $('cinematic-view').textContent=txt('Match film','Vídeo del partido');
 $('cinema-chapter').textContent=`0${state.index+1} / ${(es?s.esTitle:s.title).toUpperCase()}`;$('cinema-headline').innerHTML=cinemaCopy[s.id][es?1:0];$('cinema-subline').textContent=txt('Follow the story behind the moment.','Descubre la historia detrás del momento.');
 $('player-art').style.backgroundImage=`url(assets/${Number(state.focus)===8?'press':Number(state.focus)===9?'counter':'wide'}-cinema.png)`;
 const prev=observed.get(s.id);if(!prev||state.t>prev.t||prev.corrected!==state.corrected)observed.set(s.id,{t:Math.max(state.t,prev?.t||0),corrected:state.corrected});
 $('timeline').max=s.duration;$('timeline').value=state.t;$('clock').textContent=clock(s,state.t);$('elapsed').textContent='00:'+String(Math.floor(state.t)).padStart(2,'0');$('duration').textContent='00:'+s.duration;
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause sequence':'Play sequence');$('speed').textContent=state.speed+'×';
 $('score').textContent=`${n.metrics.goals} – 0`;$('pitch-score').textContent=`${n.metrics.goals} : 0`;
 $('story-title').textContent=n.title;$('story-description').textContent=n.body;$('overlay-text').textContent=state.alternative?txt('The winger stays. Compare the gap; this is a geometric illustration, not a predicted outcome.','El extremo se queda. Compara el espacio; es una ilustración geométrica, no una predicción.'):n.short;$('overlay-kicker').textContent=state.alternative?txt('SIMULATED ALTERNATIVE','ALTERNATIVA SIMULADA'):n.kicker;
 $('story-state').textContent=({watching:txt('WATCHING THE BUILD-UP','OBSERVANDO LA JUGADA'),emerging:txt('PATTERN EMERGING','PATRÓN EMERGENTE'),resolved:txt('SEQUENCE RESOLVED','SECUENCIA COMPLETA'),corrected:txt('CLAIM WITHDRAWN','AFIRMACIÓN RETIRADA')})[n.state];$('story-time').textContent=clock(s,state.t);
 const p=PLAYERS.find(p=>p.id===(state.mode==='player'?Number(state.focus):s.focus));$('callout-number').textContent=p.id;$('callout-player').textContent=p.name;$('callout-role').textContent=state.mode==='player'?txt('Your player. Every part of the play.','Tu jugador. Cada parte de la jugada.'):p.role;
 $('pitch-caption').innerHTML=`<span>${p.id}</span> ${escape(p.name.toUpperCase())} <small>${escape(es?s.esTitle.toUpperCase():s.title.toUpperCase())}</small>`;
 $('story-chain').innerHTML=s.observations.map((o,i)=>{const seen=o.t<=state.t,c=chains[s.id][i],corrected=state.corrected&&s.id==='wide'&&i===1;return `<div class="chain-row ${seen?'done':'pending'}"><span class="chain-dot"></span><div><strong>${seen?escape(corrected?txt('Defender movement withdrawn','Movimiento del defensor retirado'):c[es?1:0]):txt('Still unfolding…','Todavía en desarrollo…')}</strong><p>${seen?escape(corrected?txt('Revised tracking no longer supports the gap claim.','Los datos corregidos ya no respaldan la afirmación.'):c[es?3:2]):txt('Waiting for the next observed event.','Esperando el próximo evento observado.')}</p></div></div>`}).join('');
 $('pass-stat').textContent=n.metrics.completion??'—';$('pass-detail').textContent=txt(`${n.metrics.completed} of ${n.metrics.passes} Harbor passes completed`,`${n.metrics.completed} de ${n.metrics.passes} pases completados`);
 $('space-stat').textContent=s.id==='wide'?n.metrics.lateral.toFixed(1):n.metrics.regains;$('space-unit').textContent=s.id==='wide'?'m':'';$('metric-two-label').textContent=s.id==='wide'?txt('DEFENDER SHIFT','DESPLAZAMIENTO'):txt('POSSESSION REGAINS','RECUPERACIONES');$('space-detail').textContent=s.id==='wide'?txt('Lateral movement from sequence start','Movimiento lateral desde el inicio'):txt('Completed recoveries in this sequence','Recuperaciones en esta secuencia');
 $('speed-stat').textContent=n.metrics.speed?.toFixed(1)??'—';$('speed-detail').textContent=txt('Latest completed pass · average speed','Último pase completado · velocidad media');
 $('evidence-list').innerHTML=n.evidence.length?n.evidence.map(e=>`<article class="evidence-item"><span>${e.time} · ${e.status.toUpperCase()}</span><h4>${escape(e.title)}</h4><p>${escape(e.detail)}</p><code>${escape(e.id)}</code></article>`).join(''):`<p class="evidence-intro">${txt('No completed events yet. Play the sequence to collect evidence.','Aún no hay eventos completados. Reproduce la secuencia para recoger evidencia.')}</p>`;
 $('correct').disabled=s.id!=='wide';$('correct').textContent=state.corrected?txt('Restore original tracking ↻','Restaurar datos originales ↻'):txt('Test a tracking correction ↻','Probar una corrección ↻');$('correction-note').textContent=s.id!=='wide'?txt('The correction experiment is available in The unseen run.','La corrección está disponible en La carrera invisible.'):state.corrected?txt('Revision 2: defender holds position. The displacement claim is withdrawn.','Revisión 2: el defensor mantiene posición. Se retira la afirmación.'):txt('Remove the defender’s movement and see which claim no longer holds.','Elimina el movimiento del defensor y comprueba qué afirmación se retira.');
 document.querySelector('.alternative-box').hidden=s.id!=='wide';$('alternative').setAttribute('aria-pressed',state.alternative);$('alternative').innerHTML=state.alternative?txt('Return to observed sequence <span>↩</span>','Volver a la secuencia observada <span>↩</span>'):txt('Explore the alternative <span>⇄</span>','Explorar la alternativa <span>⇄</span>');$('alternative-banner').hidden=!state.alternative;
 $('simulation-label').textContent=state.corrected?'CORRECTED TRACKING · REVISION 2':'SYNTHETIC TRACKING · 25 Hz';
 $('overlay').hidden=state.quiet&&n.state==='watching';
 renderScenes();
 $('player-wrap').hidden=state.mode!=='player';$('player').value=state.focus;
 document.body.classList.toggle('quiet-mode',state.quiet);$('quiet').setAttribute('aria-pressed',state.quiet);
 document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b.dataset.mode===state.mode);b.setAttribute('aria-pressed',b.dataset.mode===state.mode)});
 $('story-content').hidden=state.tab!=='story';$('evidence-content').hidden=state.tab!=='evidence';for(const k of ['story','evidence']){$(k+'-tab').classList.toggle('active',state.tab===k);$(k+'-tab').setAttribute('aria-pressed',state.tab===k)}
}
function setTab(tab){state.tab=tab;update();}
function setView(view){if(isFeatured()&&view==='tactical'){state.view='tactical';selectScene(1);state.playing=false;update();draw();toast(txt('Data lab: a separate synthetic scenario with known coordinates.','Laboratorio: otro escenario sintético con coordenadas conocidas.'));return;}if(view==='cinematic'&&state.corrected){toast(txt('Restore original tracking before watching the original film.','Restaura los datos originales antes de ver el vídeo.'));return;}state.view=view;if(view==='cinematic')state.alternative=false;update();draw();}
function selectScene(index){state.index=index;state.t=0;state.playing=!state.quiet;state.corrected=false;state.alternative=false;state.focus=getS().focus;state.view=isFeatured()?'cinematic':'tactical';update();draw();}
function pause(){state.playing=false;update();}
function modal(label,content){pause();$('modal-label').textContent=label;$('modal-body').innerHTML=content;$('modal').showModal();}
function about(){
 modal(txt('INSIDE THE STUDIO','DENTRO DEL ESTUDIO'),`<h2>${txt('The game has layers.<br>Go one deeper.','El partido tiene capas.<br>Descubre una más.')}</h2><p class="modal-copy">${txt('Before the Roar brings the movement, decisions and uncertainty behind a football moment into focus. Choose your perspective. Follow the story. Inspect its evidence.','Before the Roar destaca los movimientos, las decisiones y la incertidumbre de una jugada. Elige tu perspectiva. Sigue la historia. Examina la evidencia.')}</p><div class="studio-grid"><article><span>01</span><h3>${txt('Watch','Mira')}</h3><p>${txt('An AI-generated highlight with five manually reviewed moments. Pause, replay or jump straight to the action.','Una jugada generada con IA y cinco momentos revisados manualmente. Pausa, repite o salta a la acción.')}</p></article><article><span>02</span><h3>${txt('Understand','Comprende')}</h3><p>${txt('Switch between a fan explanation, an analyst perspective and a focus on the attacker. Stories are available in English and Spanish.','Cambia entre la perspectiva del aficionado, el analista o el atacante. Las historias están disponibles en inglés y español.')}</p></article><article><span>03</span><h3>${txt('Question','Pregunta')}</h3><p>${txt('Open the evidence. In the tactical lab, revise a tracking sample and see an unsupported claim withdrawn.','Abre la evidencia. En el laboratorio táctico, revisa un dato de posición y observa cómo se retira una afirmación sin respaldo.')}</p></article></div><div class="modal-copy"><h3>${txt('A prototype with a clear source trail','Un prototipo con fuentes claras')}</h3><p>${txt('The featured video is fictional footage generated in Google Flow. Its annotations and localized narratives are authored, with no connected live analysis model. The three tactical lab scenes use separate synthetic coordinates and locally rendered 3D replays. Their measurements do not describe the featured film.','El vídeo destacado es ficticio y se generó en Google Flow. Sus anotaciones y narrativas están redactadas, sin un modelo de análisis conectado. Los tres escenarios tácticos usan coordenadas sintéticas independientes y vídeos 3D locales. Sus mediciones no describen el vídeo destacado.')}</p></div>`);
}
function methodology(){modal('SYNTHETIC DATA & METHODOLOGY',`<h2>A story you can<br>trace back.</h2><div class="modal-copy"><p>The featured clip is AI-generated footage supplied by the creator from Google Flow. Its five event timestamps are approximate manual annotations. Player names, pitch coordinates, ball speed and shot outcome have not been measured or confirmed. Its story and recap use only the annotations reached during playback. No video analysis model is connected. The separately labeled data lab uses fictional clubs, players and events. Each lab scene begins at 0–0; its score is local to that independent sequence. The lab plays three locally rendered 720p MP4 videos. Player and ball ground positions follow the same authored event packs as the tactical view. Body animation, ball loft, stadium and camera are illustrative; they are not measured evidence. Metrics come from synthetic coordinates, not computer vision. The player portrait art is AI-generated. There are no real match recordings. This replay uses authored narratives; the separate Live AI Studio uses Azure OpenAI. The featured video was generated externally.</p><h3>Ingest → interpret → explain → render → personalize</h3><p>The browser replays authored synthetic event packs and interpolated player trajectories on a 105 × 68 metre pitch. Tracking positions can be sampled at 25 Hz. Metrics use completed events at or before the playback cursor.</p><p>Pass distance is the straight-line distance between release and receipt. Average ball speed is distance divided by travel time. Defender shift is lateral displacement from sequence start. These are synthetic measurements, not validated real-world performance estimates.</p><h3>Honest explanations</h3><p>The current engine uses deterministic rules and authored English/Spanish story variants. <strong>This replay uses authored narratives. The separate Live AI Studio connects Azure OpenAI to an independent synthetic match stream.</strong> Claims about tactical purpose remain interpretations. The prototype does not calculate xG, calibrated pass difficulty, or infer events from video.</p><h3>Alternative and correction</h3><p>The alternative holds the winger and defender in place to illustrate the difference in geometry. It does not rerun player decisions or predict a different result; ball movement remains the observed sequence. A tracking correction changes the underlying evidence and withdraws the associated displacement claim.</p><h3>Production-shaped output</h3><p>Overlay JSON carries time, expiry, audience settings, revision, and evidence IDs. The featured clip uses clip-relative time, a null match clock and null metrics. It identifies the manual annotation method and unconfirmed outcome. This defines an integration contract; no broadcast rendering partner is connected. Recaps include only the portions of sequences you have explored.</p></div>`);}
function recap(){
 const es=state.lang==='es';const entries=[...observed].filter(([,r])=>r.t>0).map(([id,record])=>{const s=SCENES.find(s=>s.id===id),n=id==='featured'?clipStory(record.t,state.mode,state.lang):story(s,record.t,state.mode,state.lang,record.corrected,state.focus);return {s,n,t:record.t}});
 const stamp=(s,t)=>s.id==='featured'?clipTime(t):clock(s,t);
 const label=s=>s.id==='featured'?txt('AI FILM · MANUAL REVIEW','VÍDEO IA · REVISIÓN MANUAL'):txt('DATA LAB · SYNTHETIC EVENTS','LABORATORIO · EVENTOS SINTÉTICOS');
 modal(txt('YOUR MATCH RECAP','TU RESUMEN'),`<img class="recap-cover" src="assets/featured-poster.jpg" alt="Fictional football highlight"><h2>${txt('Your view.<br>Your match story.','Tu mirada.<br>Tu historia del partido.')}</h2><div class="recap-index"><span><strong>${entries.length}</strong>${txt('sequences explored','secuencias exploradas')}</span><span><strong>${entries.reduce((sum,e)=>sum+e.n.evidence.length,0)}</strong>${txt('supporting records','registros de apoyo')}</span></div><p class="modal-copy">${txt('Only the portions you have explored are included. The featured film and data lab scenarios are independent; this is not a full-match result.','Solo se incluyen las partes que has explorado. El vídeo y los escenarios del laboratorio son independientes; no es el resultado de un partido completo.')}</p>${entries.length?entries.map(({s,n,t})=>`<article class="recap-event"><span>${label(s)} · ${stamp(s,0)}–${stamp(s,t)}</span><h3>${escape(n.title)}</h3><p>${escape(n.body)}</p>${s.id==='featured'?`<ul>${n.evidence.map(e=>`<li>${escape(e.time)} · ${escape(e.detail)}</li>`).join('')}</ul>`:''}<span>${n.evidence.length} ${txt('supporting records','registros de apoyo')}</span></article>`).join(''):`<p class="modal-copy">${txt('Play a clip to build your recap.','Reproduce un vídeo para crear tu resumen.')}</p>`}<button class="modal-action" id="download-recap">${txt('↓ Download recap','↓ Descargar resumen')}</button>`);
 $('download-recap').onclick=()=>download('before-the-roar-recap.txt',entries.map(({s,n,t})=>`${label(s)}\n${stamp(s,0)}–${stamp(s,t)} ${n.title}\n${n.body}\n${n.evidence.map(e=>`${e.time} · ${e.detail} [${e.id}]`).join('\n')}`).join('\n\n')+'\n\nIndependent fictional scenes. Authored narratives; no live AI analysis. Featured clip outcome unconfirmed.','text/plain');
}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(txt('Download prepared.','Descarga preparada.'));}
$('play').onclick=()=>{if(state.t>=getS().duration)state.t=0;state.playing=!state.playing;update()};$('restart').onclick=()=>{state.t=0;state.playing=true;update();draw()};$('timeline').oninput=e=>{state.t=Number(e.target.value);state.playing=false;update();draw()};$('speed').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?.5:1;update()};
$('featured-play').onclick=$('play').onclick;
$('film-sound').onclick=()=>{film.muted=!film.muted;update();};
function seekEvidence(e){const b=e.target.closest('[data-seek]');if(!b||!isFeatured())return;state.t=Number(b.dataset.seek);state.playing=false;update();}
$('clip-beats').onclick=seekEvidence;$('evidence-list').onclick=seekEvidence;
$('modes').onclick=e=>{const b=e.target.closest('[data-mode]');if(!b)return;state.mode=b.dataset.mode;if(state.mode!=='casual'&&!isFeatured())state.view='tactical';update();draw()};$('rundown').onclick=$('sequences').onclick=e=>{const b=e.target.closest('[data-scene]');if(b){selectScene(Number(b.dataset.scene));setNavigation('match-nav');document.querySelector('.match-layout').scrollIntoView({behavior:state.quiet?'instant':'smooth',block:'start'});}};$('language').onchange=e=>{state.lang=e.target.value;update();draw();toast(txt('Stories now in English.','Las historias ahora están en español.'))};$('player').onchange=e=>{state.focus=Number(e.target.value);update();draw()};$('quiet').onclick=()=>{state.quiet=!state.quiet;if(state.quiet)state.playing=false;update();draw();toast(state.quiet?txt('Quiet view: paused motion and fewer overlays.','Vista tranquila: movimiento pausado y menos superposiciones.'):txt('Standard viewing restored.','Vista estándar restaurada.'))};
$('story-tab').onclick=()=>setTab('story');$('evidence-tab').onclick=$('show-evidence').onclick=$('overlay-evidence').onclick=()=>setTab('evidence');
$('alternative').onclick=()=>{state.alternative=!state.alternative;state.view='tactical';state.playing=false;update();draw();if(state.alternative)toast(txt('Geometric comparison only. Ball outcomes are unchanged.','Solo comparación geométrica. El resultado del balón no cambia.'))};
$('correct').onclick=()=>{state.corrected=!state.corrected;state.alternative=false;state.view='tactical';state.playing=false;update();draw();toast(state.corrected?txt('Tracking revised. Unsupported claim withdrawn.','Datos corregidos. Afirmación sin respaldo retirada.'):txt('Original synthetic tracking restored.','Datos sintéticos originales restaurados.'))};
$('cinematic-view').onclick=()=>setView('cinematic');$('tactical-view').onclick=$('tactical-jump').onclick=()=>setView('tactical');
$('export').onclick=()=>download('before-the-roar-overlay.json',JSON.stringify(isFeatured()?clipOverlayPacket(state.t,state.mode,state.lang):overlayPacket(getS(),state.t,state.mode,state.lang,state.corrected,state.focus),null,2),'application/json');
function setNavigation(id){for(const key of ['match-nav','library-nav']){$(key).classList.toggle('active',key===id);if(key===id)$(key).setAttribute('aria-current','page');else $(key).removeAttribute('aria-current');}}
$('library-nav').onclick=()=>{setNavigation('library-nav');document.querySelector('#story-library').scrollIntoView({behavior:state.quiet?'instant':'smooth',block:'start'});};
$('recap-nav').onclick=recap;$('about-nav').onclick=$('help').onclick=about;$('methodology').onclick=methodology;$('match-nav').onclick=()=>{setNavigation('match-nav');if($('modal').open)$('modal').close();document.querySelector('.match-layout').scrollIntoView({behavior:state.quiet?'instant':'smooth',block:'start'})};$('close-modal').onclick=()=>$('modal').close();$('modal').addEventListener('click',e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close()}});
$('expand').onclick=()=>{document.body.classList.toggle('expanded');$('expand').setAttribute('aria-label',document.body.classList.contains('expanded')?'Restore match layout':'Expand match view');requestAnimationFrame(resize)};
new ResizeObserver(resize).observe(canvas);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
film.addEventListener('loadedmetadata',()=>{film.currentTime=Math.min(state.t,film.duration);syncFilm(film,state,getS());});
film.addEventListener('ended',()=>{state.t=getS().duration;state.playing=false;update();});
film.addEventListener('error',()=>{if(state.view==='cinematic'){state.playing=false;if(!isFeatured())state.view='tactical';toast(isFeatured()?txt('Clip could not load. Reload the page or choose a data lab scene.','No se pudo cargar el vídeo. Recarga la página o elige un escenario del laboratorio.'):txt('Film unavailable. Tactical replay is ready.','Vídeo no disponible. Repetición táctica lista.'));update();draw();}});
function frame(now){const dt=last?Math.min((now-last)/1000,.15):0;last=now;if(state.playing){if(state.view==='cinematic'){if(film.readyState>=2&&!film.seeking)state.t=Math.min(getS().duration,film.currentTime);}else state.t=Math.min(getS().duration,state.t+dt*state.speed);if(state.t===getS().duration)state.playing=false;draw();if(now-uiTick>180||!state.playing){update();uiTick=now;}}requestAnimationFrame(frame)}
update();resize();requestAnimationFrame(frame);

