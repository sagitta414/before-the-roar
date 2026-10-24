// A user-controlled welcome experience, independent of AI availability.
(()=>{
 const query=new URLSearchParams(location.search);
 if(query.get('judge')==='1'||query.get('demo')==='1')return;
 if(new URLSearchParams(location.search).get('intro')==='enter'){const url=new URL(location.href);url.searchParams.delete('intro');history.replaceState(null,'',url);return;}
 const splash=document.createElement('dialog');splash.className='btr-splash';splash.setAttribute('aria-label','Welcome to Before the Roar');
 splash.innerHTML='<div class="btr-splash-top"><span>FOOTBALL. FROM EVERY ANGLE.</span><button type="button" autofocus>Skip intro ↗</button></div><div><div class="btr-splash-brand" aria-hidden="true">BTR<span>›</span></div><p class="btr-splash-name">BEFORE THE ROAR</p><h2>ONE MATCH.<br><em>EVERY PERSPECTIVE.</em></h2></div><div class="btr-splash-bottom"><div class="btr-splash-status"><span role="status">Opening your match room</span><small>WATCH · UNDERSTAND · CHALLENGE</small></div><div class="btr-splash-track" aria-hidden="true"><i></i></div></div>';
 const stage=document.createElement('div');stage.className='btr-splash-stage';stage.setAttribute('aria-hidden','true');
 stage.innerHTML='<div class="btr-light btr-light-one"></div><div class="btr-light btr-light-two"></div><div class="btr-speed-lines"><i></i><i></i><i></i></div><div class="btr-pitch-orbit"><svg viewBox="0 0 600 440" fill="none"><g class="btr-field-lines" stroke="currentColor" stroke-width="1.4"><rect x="50" y="35" width="500" height="370" rx="3"/><path d="M300 35V405M50 135H130V305H50M550 135H470V305H550"/><circle cx="300" cy="220" r="62"/><circle cx="300" cy="220" r="3"/></g><path class="btr-play-path" d="M125 295L230 220L350 275L450 145" stroke="#fa2748" stroke-width="3" stroke-dasharray="600"/><g class="btr-field-nodes" fill="#fff"><circle cx="125" cy="295" r="6"/><circle cx="230" cy="220" r="6"/><circle cx="350" cy="275" r="6"/><circle cx="450" cy="145" r="8"/></g><circle class="btr-target" cx="450" cy="145" r="22" stroke="#fa2748" stroke-width="2"/><g stroke="#fa2748" opacity=".6"><path d="M440 145H460M450 135V155"/></g></svg><span>THE GAME HAS MORE TO SAY.</span></div></div>';
 splash.prepend(stage);
 const signal=document.createElement('div');signal.className='btr-signal-board';signal.setAttribute('aria-hidden','true');
 signal.innerHTML='<div class="btr-signal-heading"><span>BTR / THE INTELLIGENCE LAYER</span><b>ILLUSTRATIVE SEQUENCE</b></div><div class="btr-signal-steps"><span>01 <strong>THE PLAY</strong></span><span>02 <strong>THE EVIDENCE</strong></span><span>03 <strong>THE STORY</strong></span></div><div class="btr-signal-line"><i></i></div><p>Every angle. Connected.</p>';
 stage.append(signal);
 const ball=document.createElementNS('http://www.w3.org/2000/svg','circle');ball.setAttribute('r','5');ball.setAttribute('fill','#fff');ball.setAttribute('class','btr-travelling-ball');stage.querySelector('svg').append(ball);
 const hero=splash.querySelector('.btr-splash-brand').parentElement;hero.classList.add('btr-splash-hero');
 const kicker=document.createElement('p');kicker.className='btr-splash-kicker';kicker.textContent='THE MATCH IS ONLY THE BEGINNING';hero.prepend(kicker);
 splash.querySelector('.btr-splash-top button').remove();
 const motion=document.createElement('button');motion.type='button';motion.className='btr-motion';motion.textContent='Pause motion';splash.querySelector('.btr-splash-top').append(motion);
 const entry=document.createElement('div');entry.className='btr-entry';entry.innerHTML='<p>Watch the play. Hear every angle.<br>Find the story behind the moment.</p><button class="btr-enter" type="button" autofocus data-loading="true" aria-busy="true"><span>Start the cinematic minute</span><b aria-hidden="true">↗</b></button><small>FILM PREPARES IN THE BACKGROUND · ENTER NOW · SOUND OPTIONAL</small>';hero.append(entry);
 splash.querySelector('.btr-splash-bottom').innerHTML='<div class="btr-welcome-footer"><span role="status"><i></i> PREPARING YOUR CINEMATIC MINUTE</span><small>HIGH-QUALITY FILM / AI FOOTBALL STUDIO</small></div><div class="btr-crew-preview"><div class="btr-crew-faces">'+['scout','guide','vector','check','host'].map(name=>'<img src="assets/'+name+'-portrait.webp" alt="" width="38" height="38">').join('')+'</div><div><strong>FIVE VOICES. ONE WATCH PARTY.</strong><span>Observation · explanation · calculation · challenge · synthesis</span></div></div>';
 const paths=document.createElement('div');paths.className='btr-entry-paths';paths.setAttribute('role','group');paths.setAttribute('aria-label','Choose your starting experience');
 for(const [id,label,description]of [['centre','Understand','Read the play'],['truth','Truth Lab','Challenge the claim']]){const button=document.createElement('button');button.type='button';button.setAttribute('aria-label','Enter '+label);const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=label;detail.textContent=description;button.append(title,detail);button.addEventListener('click',()=>{location.hash=id;dismiss();});paths.append(button);}entry.append(paths);
 const demo=document.createElement('button');demo.type='button';demo.className='btr-demo-entry';demo.setAttribute('aria-label','Watch the two-minute Before the Roar demo');demo.innerHTML='<strong>2-minute demo</strong><span>See the full story</span>';demo.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('btr-open-demo',{detail:{cut:'short'}})));paths.append(demo);
 document.body.append(splash);
 const help=document.createElement('button');help.type='button';help.textContent='New here?';help.addEventListener('click',()=>document.dispatchEvent(new Event('btr-open-guide')));splash.querySelector('.btr-splash-top').insertBefore(help,motion);
 if(typeof splash.showModal!=='function'){splash.remove();return;}
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let closed=false,paused=reduce||!!navigator.connection?.saveData,premiereReady=false;
 const enter=splash.querySelector('.btr-enter'),enterLabel=enter.querySelector('span'),status=splash.querySelector('[role="status"]');
 function setMotion(){splash.classList.toggle('motion-paused',paused);motion.textContent=paused?'Play motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));}
 motion.addEventListener('click',()=>{paused=!paused;setMotion();});setMotion();
 const ready=event=>{if(closed||premiereReady)return;premiereReady=true;enter.dataset.loading='false';enter.setAttribute('aria-busy','false');enterLabel.textContent=event.detail?.fallback?'Enter the match room':'Watch the cinematic minute';status.textContent=event.detail?.fallback?'The film can be retried inside':'Your cinematic minute is ready';splash.classList.add('premiere-ready');};
 document.addEventListener('btr-premiere-ready',ready);
 function dismiss({premiere=false}={}){if(closed)return;closed=true;document.removeEventListener('btr-premiere-ready',ready);splash.classList.add('leaving');if(premiere){location.hash='watch';sessionStorage.setItem('btr-premiere-play','1');document.dispatchEvent(new CustomEvent('btr-premiere-play'));}setTimeout(()=>{splash.close();splash.remove();},reduce?0:350);}
 enter.addEventListener('click',()=>dismiss({premiere:true}));
 splash.addEventListener('cancel',e=>{e.preventDefault();splash.querySelector('.btr-enter').focus();});
 try{splash.showModal();enter.focus();}catch{splash.remove();}
})();

