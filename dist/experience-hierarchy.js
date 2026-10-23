// Late composition pass. Film workspaces intentionally collect legacy nodes;
// this keeps the defining Truth Lab correction in the audience-facing layer.
const truth=document.getElementById('truth');
function placeCorrectionFirst(){
  if(!truth)return;
  const path=truth.querySelector('.truth-primary-path'),impact=truth.querySelector('.truth-verdict-impact');
  const entry=truth.querySelector(':scope > .truth-demo-entry');
  if(!path||!impact||!entry)return;
  const alreadyFirst=entry.previousElementSibling===impact&&impact.previousElementSibling===path&&path.parentElement===truth;
  if(alreadyFirst)return;
  truth.insertBefore(path,entry);
  truth.insertBefore(impact,entry);
}
placeCorrectionFirst();
setTimeout(placeCorrectionFirst,0);
window.addEventListener('load',placeCorrectionFirst,{once:true});
document.addEventListener('btr-section',event=>{if(event.detail==='truth')placeCorrectionFirst();});
new MutationObserver(placeCorrectionFirst).observe(truth,{childList:true,subtree:true});
