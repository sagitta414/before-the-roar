// A brief brand introduction, independent of media downloads and AI availability.
(()=>{
 const splash=document.createElement('dialog');splash.className='btr-splash';splash.setAttribute('aria-label','Welcome to Before the Roar');
 splash.innerHTML='<div class="btr-splash-top"><span>FOOTBALL. FROM EVERY ANGLE.</span><button type="button" autofocus>Skip intro ↗</button></div><div><div class="btr-splash-brand" aria-hidden="true">BTR<span>›</span></div><p class="btr-splash-name">BEFORE THE ROAR</p><h2>ONE MATCH.<br><em>EVERY PERSPECTIVE.</em></h2></div><div class="btr-splash-bottom"><div class="btr-splash-status"><span role="status">Opening your match room</span><small>WATCH · UNDERSTAND · CHALLENGE</small></div><div class="btr-splash-track" aria-hidden="true"><i></i></div></div>';
 document.body.append(splash);
 if(typeof splash.showModal!=='function'){splash.remove();return;}
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let closed=false;
 function dismiss(){if(closed)return;closed=true;clearTimeout(timer);splash.classList.add('leaving');setTimeout(()=>{splash.close();splash.remove();},reduce?0:350);}
 const timer=setTimeout(dismiss,reduce?250:1900);
 splash.querySelector('button').addEventListener('click',dismiss);
 splash.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
 try{splash.showModal();}catch{clearTimeout(timer);splash.remove();}
})();
