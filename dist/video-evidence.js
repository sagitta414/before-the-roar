import {workspace,withdrawWorkspaceEvent} from './source-workspace.js';
const metric=value=>Number.isFinite(value)?value.toFixed(1):'unavailable';
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
export function clearVideoEvidence(){for(const id of ['centre','truth']){const root=document.getElementById(id);root.removeAttribute('data-measured-video');root.querySelector('.measured-evidence')?.remove();}}
export function openVideoEvidence(packet,target){
 const saved=structuredClone(packet),event=saved.snapshot.events.at(-1);if(!event)return;
 for(const id of ['centre','truth']){
  const root=document.getElementById(id);root.querySelector('.measured-evidence')?.remove();root.dataset.measuredVideo='true';
  const view=el('section',undefined,'measured-evidence');view.setAttribute('aria-label','Measured minute evidence');
  const top=el('div',undefined,'measured-top');top.append(el('span','SAME VIDEO / SAME OBSERVED EVENT','eyebrow'),el('h1',id==='centre'?'Inside this measured moment.':'Change the evidence. Test the story.'),el('p',`${saved.snapshot.t.toFixed(1)} s · ${event.id} · decoded frames ${event.evidence.firstFrame}–${event.evidence.lastFrame}. Playback is paused at this shared cutoff.`));
  const back=el('button','← Return to this video','red-button');back.onclick=()=>document.getElementById('lab-nav').click();const exit=el('button','Switch back to the other source','outline-button');exit.onclick=()=>{clearVideoEvidence();if(workspace.source)document.dispatchEvent(new CustomEvent('btr-upload-clear'));};top.append(back,exit);view.append(top);
  const grid=el('div',undefined,'measured-grid'),picture=el('img');picture.src=saved.frame;picture.alt='Decoded frame at the measured video cutoff';grid.append(picture);const detail=el('article',undefined,'measured-detail');
  if(id==='centre'){
   detail.append(el('h2','The observed event'),el('p',`${event.type==='shot'?'Shot candidate':'Completed pass'} · ${metric(event.distance)} m · ${metric(event.speed)} km/h ground-plane estimate.`));
   if(event.quality)detail.append(el('p',`Synthetic difficulty ${event.quality.difficulty}/100, based on release-time geometry. This is not a real-world calibrated success probability.`));
   for(const p of saved.posts){const row=el('div',undefined,'measured-post');row.append(el('strong',p.role),el('p',p.text),el('small',p.engine));detail.append(row);}
  }else{
   detail.append(el('h2','Would the claim survive without its detection?'),el('p','Preview the consequence of removing this detection. For an active local clip, this applies a new shared revision to Publish and your paired phone. Original frames and detector records are preserved.'));
   const verdict=el('div',undefined,'measured-verdict'),toggle=el('button','Withdraw this event’s detection','red-button');let withdrawn=workspace.withdrawn.includes(event.id);
   const paint=()=>{const retained=saved.snapshot.events.filter(e=>!withdrawn||e.id!==event.id);verdict.replaceChildren(el('strong',withdrawn?'WITHDRAWN FROM THE REVIEW':'SUPPORTED BY THE CURRENT DETECTION'),el('p',withdrawn?'The named transfer/shot and its speed/difficulty claims must leave the explanation. A convincing frame alone cannot replace the withdrawn event record.':'The measured event supports a transfer or shot candidate. It still does not establish intention, tactical causation or a goal.'),el('p',`${retained.length} event records retained in this review; ${saved.snapshot.events.length} in the original. Earlier event records are unchanged.`));toggle.textContent=withdrawn?'Restore the original detection':'Withdraw this event’s detection';};toggle.onclick=()=>{withdrawn=!withdrawn;if(workspace.source)withdrawWorkspaceEvent(event.id,withdrawn);paint();};paint();detail.append(toggle,verdict);if(workspace.source){const publish=el('button','Inspect corrected Publish →','outline-button');publish.onclick=()=>document.getElementById('inside-nav').click();detail.append(publish);}
   const exportButton=el('button','Export this review','outline-button');exportButton.onclick=()=>{const blob=new Blob([JSON.stringify({source:'controlled measured video',cutoff:saved.snapshot.t,original_events:saved.snapshot.events,review:{kind:workspace.source?'applied local-source correction':'explicit what-if',withdrawn_event_ids:withdrawn?[event.id]:[],retained_events:saved.snapshot.events.filter(e=>!withdrawn||e.id!==event.id)}},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='btr-measured-evidence-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};detail.append(exportButton);
  }
  grid.append(detail);view.append(grid);root.append(view);
 }
 document.getElementById(target+'-nav').click();const summary=document.querySelector('.source-map summary');if(summary)summary.textContent='Measured stadium minute · source & scope';
}
