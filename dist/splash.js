// A user-controlled welcome experience, independent of AI availability.
(()=>{
 const splash=document.createElement('dialog');splash.className='btr-splash';splash.setAttribute('aria-label','Welcome to Before the Roar');
 splash.innerHTML='<div class="btr-splash-top"><span>FOOTBALL. FROM EVERY ANGLE.</span><button type="button" autofocus>Skip intro ↗</button></div><div><div class="btr-splash-brand" aria-hidden="true">BTR<span>›</span></div><p class="btr-splash-name">BEFORE THE ROAR</p><h2>ONE MATCH.<br><em>EVERY PERSPECTIVE.</em></h2></div><div class="btr-splash-bottom"><div class="btr-splash-status"><span role="status">Opening your match room</span><small>WATCH · UNDERSTAND · CHALLENGE</small></div><div class="btr-splash-track" aria-hidden="true"><i></i></div></div>';
 const stage=document.createElement('div');stage.className='btr-splash-stage';stage.setAttribute('aria-hidden','true');
 stage.innerHTML='<div class="btr-light btr-light-one"></div><div class="btr-light btr-light-two"></div><div class="btr-speed-lines"><i></i><i></i><i></i></div><div class="btr-pitch-orbit"><svg viewBox="0 0 600 440" fill="none"><g class="btr-field-lines" stroke="currentColor" stroke-width="1.4"><rect x="50" y="35" width="500" height="370" rx="3"/><path d="M300 35V405M50 135H130V305H50M550 135H470V305H550"/><circle cx="300" cy="220" r="62"/><circle cx="300" cy="220" r="3"/></g><path class="btr-play-path" d="M125 295L230 220L350 275L450 145" stroke="#fa2748" stroke-width="3" stroke-dasharray="600"/><g class="btr-field-nodes" fill="#fff"><circle cx="125" cy="295" r="6"/><circle cx="230" cy="220" r="6"/><circle cx="350" cy="275" r="6"/><circle cx="450" cy="145" r="8"/></g><circle class="btr-target" cx="450" cy="145" r="22" stroke="#fa2748" stroke-width="2"/><g stroke="#fa2748" opacity=".6"><path d="M440 145H460M450 135V155"/></g></svg><span>THE GAME HAS MORE TO SAY.</span></div></div>';
 splash.prepend(stage);
 const hero=splash.querySelector('.btr-splash-brand').parentElement;hero.classList.add('btr-splash-hero');
 const kicker=document.createElement('p');kicker.className='btr-splash-kicker';kicker.textContent='THE MATCH IS ONLY THE BEGINNING';hero.prepend(kicker);
 splash.querySelector('.btr-splash-top button').remove();
 const motion=document.createElement('button');motion.type='button';motion.className='btr-motion';motion.textContent='Pause motion';splash.querySelector('.btr-splash-top').append(motion);
 const entry=document.createElement('div');entry.className='btr-entry';entry.innerHTML='<p>Watch the play. Hear every angle.<br>Find the story behind the moment.</p><button class="btr-enter" type="button" autofocus><span>Enter the match room</span><b aria-hidden="true">↗</b></button><small>YOUR GAME. YOUR PERSPECTIVE.</small>';hero.append(entry);
 splash.querySelector('.btr-splash-bottom').innerHTML='<div class="btr-welcome-footer"><span><i></i> YOUR FRONT ROW STARTS HERE</span><small>AI FOOTBALL STUDIO / SYNTHETIC MATCH EXPERIENCES</small></div><div class="btr-crew-preview"><div class="btr-crew-faces">'+['scout','guide','vector','check','host'].map(name=>'<img src="assets/'+name+'-portrait.webp" alt="" width="38" height="38">').join('')+'</div><div><strong>FIVE VOICES. ONE WATCH PARTY.</strong><span>Observation · explanation · calculation · challenge · synthesis</span></div></div>';
 document.body.append(splash);
 if(typeof splash.showModal!=='function'){splash.remove();return;}
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let closed=false,paused=reduce;
 const film=document.createElement('video');film.className='btr-welcome-film';film.muted=true;film.loop=true;film.playsInline=true;film.preload='none';film.setAttribute('aria-hidden','true');film.tabIndex=-1;film.poster='assets/pitchside-minute-poster.jpg';stage.prepend(film);
 function setMotion(){splash.classList.toggle('motion-paused',paused);motion.textContent=paused?'Play motion':'Pause motion';motion.setAttribute('aria-pressed',String(paused));if(paused)film.pause();else{if(!film.getAttribute('src'))film.src='assets/pitchside-scene-0.mp4';film.play().catch(()=>{paused=true;splash.classList.add('motion-paused');motion.textContent='Play motion';motion.setAttribute('aria-pressed','true');});}}
 film.addEventListener('playing',()=>splash.classList.add('film-ready'));
 motion.addEventListener('click',()=>{paused=!paused;setMotion();});setMotion();
 function dismiss(){if(closed)return;closed=true;film.pause();splash.classList.add('leaving');setTimeout(()=>{splash.close();film.removeAttribute('src');film.load();splash.remove();},reduce?0:350);}
 splash.querySelector('.btr-enter').addEventListener('click',dismiss);
 splash.addEventListener('cancel',e=>{e.preventDefault();splash.querySelector('.btr-enter').focus();});
 try{splash.showModal();splash.querySelector('.btr-enter').focus();}catch{film.pause();splash.remove();}
})();
