const $=id=>document.getElementById(id);
// Keep the existing controls and listeners, but give the discussion the space.
export function arrangeReadingRoom(){
 const source=document.createElement('details');source.className='source-details';
 const summary=document.createElement('summary');summary.textContent='About this footage';source.append(summary);
 const sourceBar=document.querySelector('.watch-source-bar');sourceBar.append(source);document.querySelector('.match-session-bar').after(sourceBar);
 source.append($('watch-source-note'),sourceBar.querySelector('a'));
 const sourceLimit=document.createElement('p');sourceLimit.textContent='The selected source follows you across every page. Change the source here to explore the coordinate-based synthetic match. Film observations do not become calibrated match statistics.';source.append(sourceLimit);
 const settings=$('settings-dialog'),options=document.createElement('div');options.className='room-options';
 const languageLabel=document.createElement('label');languageLabel.textContent='Story language';languageLabel.append($('story-language'));options.append(languageLabel,$('voices'));
 settings.querySelector('h2').after(options);
 const statusDetail=document.createElement('details');statusDetail.className='response-details';
 const statusSummary=document.createElement('summary');statusSummary.textContent='Connection & response details';statusDetail.append(statusSummary,$('party-status'),$('connection-status'),$('response-timing'));settings.append(statusDetail);
 const expand=document.createElement('button');
 expand.id='reading-space-toggle';expand.type='button';expand.className='room-expand';expand.textContent='More reading space';
 expand.setAttribute('aria-controls','party');expand.setAttribute('aria-expanded','false');expand.setAttribute('aria-pressed','false');
 const setReadingSpace=on=>{
  document.body.classList.toggle('party-expanded',on);
  expand.setAttribute('aria-expanded',String(on));expand.setAttribute('aria-pressed',String(on));
  expand.textContent=on?'Back to match':'More reading space';
  expand.title=on?'Restore the match-first layout':'Widen the conversation and evidence';
  if(on&&window.matchMedia('(max-width:999px)').matches)document.querySelector('.party')?.scrollIntoView({block:'start',behavior:'smooth'});
 };
 expand.addEventListener('click',event=>{event.preventDefault();setReadingSpace(!document.body.classList.contains('party-expanded'));});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('party-expanded')){setReadingSpace(false);expand.focus();}});
 document.querySelector('.party-header').append(expand,$('settings'));
 $('settings').textContent='⚙';
 document.querySelector('.party-controls').hidden=true;
 const ask=$('request-panel');ask.textContent='Discuss this moment ↗';$('suggestions').prepend(ask);document.querySelector('.panel-request').remove();
 // A shared fixture and scenario selector already sit directly above each page.
 document.querySelector('#centre .sequence-score').hidden=true;
 const metrics=$('sequence-metrics');document.querySelector('#centre .formation-layout').after(metrics);
 document.querySelector('#truth .truth-case-bar').hidden=true;
}
