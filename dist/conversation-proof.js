const $=id=>document.getElementById(id);
const label={analyst:'Scout · observation',guide:'Guide · football concept',math:'Vector · calculation',reviewer:'Check · challenge',presenter:'Host · synthesis'};
const node=(tag,text,className)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
function render(report,index){
 const round=report.rounds[index],posts=new Map();
 for(const event of round.events)if(event.type==='post'&&event.data?.role)posts.set(event.data.role,event.data);
 const clock=`67:${String(round.input.time).padStart(2,'0')}`;
 $('round-label').textContent=`ROUND ${index+1} / ${report.rounds.length} · ${clock} · ${posts.get('analyst')?.editorial_angle||'SOURCE-BOUND REVIEW'}`;
 $('round-question').textContent=round.input.question;
 $('round-context').textContent=index===0?'The following pass and shot are outside this evidence cutoff.':index===1?'A new pass is now recorded; the shot remains outside this cutoff.':'The completed shot adds an outcome to the earlier passing sequence.';
 $('rounds').querySelectorAll('button').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
 $('roles').replaceChildren();
 for(const role of ['analyst','guide','math','reviewer','presenter']){
  const post=posts.get(role),card=node('article','',`role-card ${role==='presenter'?'host':''}`);
  card.append(node('h3',label[role]),node('p',post?.summary||'No completed contribution in this receipt.'));
  if(post?.working)card.append(node('code',post.working));
  card.append(node('small',`Evidence: ${post?.evidence_ids?.join(' · ')||'none'}`));
  $('roles').append(card);
 }
}
try{
 const response=await fetch('assets/tracking/live-conversation-v89.json');
 if(!response.ok)throw Error('Recorded conversation unavailable');
 const report=await response.json();
 if(!report.complete||report.rounds?.length!==3)throw Error('Recorded conversation is incomplete');
 const requests=report.after?.usage?.used-report.before?.usage?.used;
 $('receipt').textContent=`Recorded ${new Date(report.recorded_at).toLocaleDateString()}. ${requests} Azure model request${requests===1?'':'s'} across three rounds. This is a retained receipt; opening this page makes no model request.`;
 for(const [index,round]of report.rounds.entries()){
  const button=node('button','');button.type='button';button.append(node('span',`0${index+1} / 67:${String(round.input.time).padStart(2,'0')}`),node('strong',['The run','The pass','The shot'][index]));button.addEventListener('click',()=>render(report,index));$('rounds').append(button);
 }
 render(report,0);
}catch(error){$('round-question').textContent=error.message;$('round-context').textContent='The unedited live receipt must be published before this proof can be displayed.';}
