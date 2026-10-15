const $=id=>document.getElementById(id);
// Keep the existing controls and listeners, but give the discussion the space.
export function arrangeReadingRoom(){
 const source=document.createElement('details');source.className='source-details';
 const summary=document.createElement('summary');summary.textContent='About this footage';source.append(summary);
 const sourceBar=document.querySelector('.watch-source-bar');sourceBar.append(source);
 source.append($('watch-source-note'),sourceBar.querySelector('a'));
 const sourceLimit=document.createElement('p');sourceLimit.textContent='Generated kit markings do not identify real clubs or players. The realistic film and the synthetic data replay are separate studies.';source.append(sourceLimit);
 const settings=$('settings-dialog'),options=document.createElement('div');options.className='room-options';
 const languageLabel=document.createElement('label');languageLabel.textContent='Story language';languageLabel.append($('story-language'));options.append(languageLabel,$('voices'));
 settings.querySelector('h2').after(options);
 const statusDetail=document.createElement('details');statusDetail.className='response-details';
 const statusSummary=document.createElement('summary');statusSummary.textContent='Connection & response details';statusDetail.append(statusSummary,$('party-status'),$('connection-status'),$('response-timing'));settings.append(statusDetail);
 document.querySelector('.party-header').append($('settings'));
 $('settings').textContent='⚙';
 document.querySelector('.party-controls').hidden=true;
 const ask=$('request-panel');ask.textContent='Discuss this moment ↗';$('suggestions').prepend(ask);document.querySelector('.panel-request').remove();
 // A shared fixture and scenario selector already sit directly above each page.
 document.querySelector('#centre .sequence-score').hidden=true;
 const metrics=$('sequence-metrics');document.querySelector('#centre .formation-layout').after(metrics);
 document.querySelector('#truth .truth-case-bar').hidden=true;
}
