// Keep the evidence replay inside the studio, without nested scrolling.
const button=document.getElementById('open-evidence-room');
let frame;
const heading=document.querySelector("#inside>.extension-heading");if(heading&&button)heading.after(button.closest(".extra-studies"));
function open(){
 document.dispatchEvent(new CustomEvent('btr-section',{detail:'inside'}));
 if(!frame){frame=document.createElement('iframe');frame.title='Two-round evidence room';frame.src='quality-demo.html?embedded=1';frame.style.cssText='width:100%;height:1700px;border:1px solid #33465f;border-radius:10px;margin:16px 0;background:#0a1019';button.closest('.extra-studies').after(frame);}
 frame.scrollIntoView({behavior:'instant',block:'start'});
}
button?.addEventListener('click',open);
document.addEventListener('btr-open-evidence',open);
addEventListener('message',e=>{if(frame&&e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='btr-proof-size'&&Number.isFinite(e.data.height))frame.style.height=Math.max(500,Math.min(12000,e.data.height+16))+'px';});

const production=document.querySelector('[aria-label="Production proof desk"]');if(production){const disclosure=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Advanced production controls, recovery and archived receipts';disclosure.className='packet-inspector';production.before(disclosure);disclosure.append(summary,production);}
