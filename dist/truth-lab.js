import {matchSession} from './match-session.js';
import {position} from './engine.js';
import {truthStory,truthStoryPacket} from './truth-story-model.js';
const $=id=>document.getElementById(id),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svg=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;};
function text(id,value){if($(id).textContent!==value)$(id).textContent=value;}
function save(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function createTruthLab({seek,toggleCorrection,pause}){
 document.querySelector('#truth .truth-story-grid').after($('truth-chapters'));
 let scenario,time=0,corrected=false,language='en',audience='fan',narrative,signature='',speaking=false,spokenKey='',selectedClaim='movement';
 const canSpeak=typeof speechSynthesis!=='undefined'&&typeof SpeechSynthesisUtterance!=='undefined',claimNodes=new Map();
 function silence(){if(speaking&&canSpeak)speechSynthesis.cancel();speaking=false;text('truth-listen','Listen to the story');$('truth-listen').setAttribute('aria-pressed','false');}
 $('truth-listen').disabled=!canSpeak;
 if(!canSpeak)text('truth-voice-note','Read-aloud is unavailable in this browser.');
 $('truth-listen').addEventListener('click',()=>{
  if(speaking){silence();return;}if(!narrative)return;pause();
  const utterance=new SpeechSynthesisUtterance(`${narrative.headline} ${narrative.observation} ${narrative.outcome} ${narrative.review}`);utterance.lang={en:'en-US',es:'es-ES',pt:'pt-BR'}[language];utterance.rate=1;
  utterance.onend=utterance.onerror=silence;speaking=true;spokenKey=signature;text('truth-listen','Stop narration');$('truth-listen').setAttribute('aria-pressed','true');speechSynthesis.speak(utterance);
 });
 document.addEventListener('btr-section',e=>{if(e.detail!=='truth')silence();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});
 $('truth-audience').addEventListener('change',()=>{audience=$('truth-audience').value;matchSession.set({mode:audience});render(scenario,time,corrected,language,audience);});
 $('reveal-truth').addEventListener('click',()=>{silence();toggleCorrection();});
 $('export-audit').addEventListener('click',()=>save(`btr-truth-${scenario.id}-r${narrative.revision}.json`,truthStoryPacket(scenario,time,corrected,audience,language)));
 $('truth-open-centre').addEventListener('click',()=>$('centre-nav').click());

 function drawLens(root,s,n,revision){
  root.replaceChildren();root.setAttribute('viewBox','40 -3 68 60');
  root.append(svg('rect',{x:40,y:-3,width:68,height:60,fill:'#143c31'}),svg('image',{x:0,y:0,width:105,height:68,href:'assets/match-turf.png',preserveAspectRatio:'none',opacity:'.46'}));
  root.append(svg('path',{d:'M52.5 0v68M40 0H105V68M105 13.84H88.5v40.32H105M105 24.84h-5.5v18.32h5.5',stroke:'#c2d6bc','stroke-width':'.25','fill':'none','stroke-opacity':'.65'}),svg('circle',{cx:52.5,cy:34,r:9.15,fill:'none',stroke:'#c2d6bc','stroke-width':'.25','stroke-opacity':'.65'}));
  for(const [id,name,color]of [[n.context.partner,n.context.partnerName,'#d6e971'],[n.context.subject,n.context.subjectName,'#91cfff']]){
   const points=[];for(let t=0;t<n.time;t+=.5)points.push(position(s,id,t,revision===2));points.push(position(s,id,n.time,revision===2));
   root.append(svg('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:color,'stroke-width':'.65','stroke-dasharray':'1.2 .8'}));
   const [x,y]=points.at(-1),origin=position(s,id,0,revision===2);
   root.append(svg('circle',{cx:origin[0],cy:origin[1],r:1,fill:'none',stroke:color,'stroke-width':'.3'}),svg('circle',{cx:x,cy:y,r:1.45,fill:color,stroke:'#fff','stroke-width':'.2'}));
   const labelX=Math.max(49,Math.min(97,x)),offset=id===n.context.subject?6:-4;
   root.append(svg('rect',{x:labelX-8,y:y+offset-2,width:16,height:3.8,rx:.5,fill:'#09131ee8'}),svg('text',{x:labelX,y:y+offset+.5,'text-anchor':'middle',fill:color,'font-family':'Barlow,sans-serif','font-size':'2.3','font-weight':600},name.split(' ').at(-1)));
  }
 }
 function drawTrace(s,n){
  const chart=$('truth-trace');chart.replaceChildren();
  for(const y of [0,10,20,30]){const yp=160-y*4;chart.append(svg('line',{x1:35,y1:yp,x2:570,y2:yp,stroke:'#303e4d','stroke-width':1}),svg('text',{x:3,y:yp+4,fill:'#a6b8cd','font-size':11},y+'m'));}
  for(const t of [0,9,18,27,36])chart.append(svg('text',{x:35+t/36*535,y:187,fill:'#9eb1c9','font-size':11,'text-anchor':'middle'},t+'s'));
  for(const [revision,color]of [[1,'#8ecbff'],[n.revision,n.changed?'#ff9aac':'#d4e77d']]){
   const points=[],origin=position(s,n.context.subject,0,revision===2);
   for(let t=0;t<n.time;t+=.25)points.push(`${35+t/36*535},${160-Math.abs(position(s,n.context.subject,t,revision===2)[1]-origin[1])*4}`);
   points.push(`${35+n.time/36*535},${160-Math.abs(position(s,n.context.subject,n.time,revision===2)[1]-origin[1])*4}`);
   chart.append(svg('polyline',{points:points.join(' '),fill:'none',stroke:color,'stroke-width':revision===2?3:2,'stroke-dasharray':revision===1?'5 4':'none'}));
  }
  chart.append(svg('line',{x1:35+n.time/36*535,y1:17,x2:35+n.time/36*535,y2:165,stroke:'#fff6','stroke-dasharray':'2 4'}));
 }
 function inspect(packet){
  const row=packet.checks.find(r=>r.id===selectedClaim)||packet.checks[0],ids=[...new Set([...row.source,...row.current_source])];
  text('truth-source-title',row.claim);text('truth-source-status',row.status==='withdrawn'?'The original claim no longer matches the current record.':row.status==='pending'?'No claim is asserted at this cutoff.':'This check agrees with the current synthetic records.');
  const list=$('truth-source-list');list.replaceChildren();
  for(const id of ids){const record=packet.evidence.find(e=>e.id===id),item=el('div','source-record');item.append(el('code','',id));
   const detail=record?.record_type==='tracking'?`Player ${record.player_id} · ${record.second.toFixed(1)}s · [${record.position_m.map(v=>v.toFixed(2)).join(', ')}] m · revision ${record.revision}`:record?.record_type==='coverage'?`All completed events from 0 to ${record.through_second.toFixed(1)}s. ${record.event_ids.length} events in the window.`:`${record?.type||'Event'} · ${record?.end?.toFixed(1)}s · ${record?.outcome||'recorded'}`;
   item.append(el('p','',detail));list.append(item);
  }
  for(const b of document.querySelectorAll('[data-truth-claim]'))b.setAttribute('aria-pressed',String(b.dataset.truthClaim===row.id));
 }
 function render(s,t,reveal,lang=language,mode=audience){
  language=lang;audience=['analyst','math'].includes(mode)?'analyst':'fan';$('truth-audience').value=audience;
  scenario=s;time=t;corrected=reveal;narrative=truthStory(s,t,reveal,audience,language);const n=narrative,packet=truthStoryPacket(s,t,reveal,audience,language),key=[s.id,n.time.toFixed(1),n.revision,audience,language].join(':');
  if(speaking&&spokenKey!==key)silence();signature=key;
  $('truth').dataset.revised=String(n.changed);
  text('truth-case-number','CASE '+n.context.number);text('truth-case-title',s.title);text('truth-question',n.context.question);text('truth-phase',n.phase);text('truth-version','R'+n.revision+' · '+n.clock);
  text('truth-headline',n.headline);text('truth-copy',n.observation);text('truth-outcome',n.outcome);text('truth-interpretation',n.interpretation);text('truth-check-note',n.review);
  $('truth-diff').hidden=!n.changed;text('truth-old-line',n.originalLine);text('truth-new-line',n.currentLine);
  text('truth-current-label',n.revision===2?'R2 / CORRECTED RECORD':'R1 / CURRENT RECORD');text('truth-lens-caption',n.changed?'The run remains. The defender’s movement does not.':n.context.subjectName+' and '+n.context.partnerName+' · tracks stop at '+n.clock);
  const button=$('reveal-truth');button.disabled=!n.audit.correctionAvailable;button.setAttribute('aria-pressed',String(n.audit.revealed));button.textContent=!n.audit.correctionAvailable?'No alternate record in this case':n.audit.revealed?'Restore the original record ↺':'Challenge the tracking ↗';
  text('truth-change-note',n.audit.correctionAvailable?'Hold Laurent at his starting position. All recorded passes and shots stay intact.':'Use the chapter buttons to explore what the evidence can—and cannot—support.');
  const chapters=$('truth-chapters');
  if(chapters.dataset.scenario!==s.id+language){chapters.dataset.scenario=s.id+language;chapters.replaceChildren();for(const chapter of n.chapters){const b=el('button','truth-chapter');b.append(el('span','chapter-index',String(chapter.index+1).padStart(2,'0')),el('strong','',chapter.label),el('small','',chapter.clock));b.dataset.chapter=chapter.index;b.addEventListener('click',()=>{silence();seek(chapter.second,chapter.corrected);});chapters.append(b);}}
  for(const b of chapters.children){b.setAttribute('aria-pressed',String(Number(b.dataset.chapter)===n.chapterIndex));}
  drawLens($('truth-original-pitch'),s,n,1);drawLens($('truth-current-pitch'),s,n,n.revision);drawTrace(s,n);
  const origin=position(s,n.context.subject,0),value=Math.abs(position(s,n.context.subject,n.time)[1]-origin[1]),current=Math.abs(position(s,n.context.subject,n.time,n.revision===2)[1]-origin[1]);
  text('truth-measure-name',n.context.subjectName+' · lateral displacement');text('truth-original-measure',value.toFixed(1)+' m');text('truth-current-measure',current.toFixed(1)+' m');
  text('truth-node-source',n.changed?'TRACKING REVISED':'CURRENT RECORD');text('truth-node-claim',n.changed?'MOVEMENT CLAIM WITHDRAWN':n.ready?'CLAIM CHECKED':'CLAIM PENDING');text('truth-node-story',n.changed?'NARRATIVE REWRITTEN':'NARRATIVE BOUNDED');
  text('truth-fact-line',n.factLine);text('truth-supported',n.audit.supported+'/'+n.audit.checked);text('truth-withdrawn',String(n.audit.withdrawn));text('truth-cutoff',n.time.toFixed(1)+'s');
  text('truth-trace-title',n.context.subjectName+' · lateral movement');
  const rows=$('claim-rows');for(const row of packet.checks){let nodes=claimNodes.get(row.id);if(!nodes){const tr=el('tr'),action=el('button','claim-source-button','Inspect ↗'),before=el('td'),after=el('td'),status=el('td');action.dataset.truthClaim=row.id;action.setAttribute('aria-label','Inspect sources for '+row.claim);action.addEventListener('click',()=>{selectedClaim=row.id;inspect(truthStoryPacket(scenario,time,corrected,audience,language));});const td=el('td');td.append(action);const heading=el('th','',row.claim);heading.scope='row';tr.append(heading,before,after,status,td);rows.append(tr);nodes={before,after,status};claimNodes.set(row.id,nodes);}nodes.before.textContent=row.reading;nodes.after.textContent=row.reference;nodes.status.textContent=row.status==='supported'?'Supported':row.status==='withdrawn'?'Withdrawn':'Pending';nodes.status.className='audit-'+row.status;}inspect(packet);
 }
 return {render};
}
