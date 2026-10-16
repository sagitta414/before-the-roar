// Keep the content above the fold without removing any match preferences.
function install(){
 const media=matchMedia('(max-width:760px)'),panel=document.createElement('details');panel.className='mobile-context';
 const summary=document.createElement('summary');summary.textContent='Match, language & viewing options';panel.append(summary);
 const entries=['.match-session-bar','.watch-source-bar','.source-map'].map(s=>document.querySelector(s)).filter(Boolean).map(node=>{const marker=document.createComment('match preference position');node.before(marker);return{node,marker};});
 const update=()=>{if(media.matches){document.querySelector('.masthead').after(panel);for(const {node}of entries)panel.append(node);}else{for(const {node,marker}of entries)marker.after(node);panel.remove();}};
 media.addEventListener('change',update);update();
}
if(document.readyState==='complete')install();else addEventListener('load',install,{once:true});
