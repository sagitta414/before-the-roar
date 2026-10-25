import {PLAYERS,position,ball,clock} from './engine.js';

const NS='http://www.w3.org/2000/svg';
function node(tag,attrs={},text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
const palette={harbor:'var(--btr-home)',north:'var(--btr-away)'};

// Artwork is decorative. Every ground anchor and trail comes from the existing
// scenario coordinates; neither the artwork nor the view changes the evidence.
export function createMatchPitch(container,onSelect){
 const stage=node('svg',{viewBox:'-7 -7 119 82',class:'stadium-svg',role:'group','aria-label':'Interactive synthetic match replay'});
 const defs=node('defs');
 const shadow=node('filter',{id:'pitch-shadow',x:'-60%',y:'-60%',width:'220%',height:'220%'});
 shadow.append(node('feGaussianBlur',{stdDeviation:'.45'}));defs.append(shadow);
 const net=node('pattern',{id:'pitch-net',width:'.6',height:'.6',patternUnits:'userSpaceOnUse'});
 net.append(node('path',{d:'M.6 0H0V.6',stroke:'#d5dede88','stroke-width':'.09',fill:'none'}));defs.append(net);
 const turf=node('radialGradient',{id:'pitch-light',cx:'50%',cy:'35%',r:'75%'});turf.append(node('stop',{offset:0,'stop-color':'#d3efbe','stop-opacity':'.12'}),node('stop',{offset:1,'stop-color':'#061c10','stop-opacity':'.38'}));defs.append(turf);
 stage.append(defs,node('rect',{x:-7,y:-7,width:119,height:82,rx:1.5,fill:'#101a20'}));
 stage.append(node('rect',{x:-3,y:-3,width:111,height:74,fill:'#2b522f'}),node('image',{x:-3,y:-3,width:111,height:74,href:'assets/match-turf.png',preserveAspectRatio:'none'}),node('rect',{x:-3,y:-3,width:111,height:74,fill:'url(#pitch-light)'}));
 // Regulation geometry in metres, including penalty arcs and goal mouths.
 const lines=node('g',{stroke:'#f0f4e5','stroke-opacity':'.78','stroke-width':'.22',fill:'none'});
 lines.append(node('rect',{x:0,y:0,width:105,height:68}),node('path',{d:'M52.5 0v68M0 13.84h16.5v40.32H0M105 13.84H88.5v40.32H105M0 24.84h5.5v18.32H0M105 24.84h-5.5v18.32H105'}),node('circle',{cx:52.5,cy:34,r:9.15}),node('path',{d:'M16.5 26.69a9.15 9.15 0 0 1 0 14.62M88.5 26.69a9.15 9.15 0 0 0 0 14.62M0 1a1 1 0 0 0 1-1M104 0a1 1 0 0 0 1 1M0 67a1 1 0 0 1 1 1M104 68a1 1 0 0 1 1-1'}));
 for(const x of [11,52.5,94])lines.append(node('circle',{cx:x,cy:34,r:.18,fill:'#f0f4e5'}));stage.append(lines);
 for(const x of [-2.3,105])stage.append(node('rect',{x,y:30.34,width:2.3,height:7.32,fill:'url(#pitch-net)',stroke:'#e9efee','stroke-width':'.25'}));
 for(const [x,t]of [[8,'BEFORE THE ROAR'],[41,'SYNTHETIC MATCH REPLAY'],[82,'BTR / ANALYSIS']])stage.append(node('rect',{x:x-1,y:-5.8,width:22,height:1.6,fill:'#202e35'}),node('text',{x,y:-4.65,fill:'#c0cbd0','font-size':'.9','font-family':'Barlow, sans-serif','letter-spacing':'.12'},t));
 const trail=node('polyline',{class:'player-trail',fill:'none','stroke-width':'.55','stroke-linecap':'round','stroke-dasharray':'1.2 .9'}),passLine=node('line',{class:'recorded-pass',stroke:'#f4f5e2','stroke-width':'.3','stroke-dasharray':'1.1 1',opacity:'.7'});
 stage.append(passLine,trail);
 const players=node('g',{class:'pitch-players'}),actors=new Map();
 for(const p of PLAYERS){
  const number=p.number||p.id,keeper=number===1,color=palette[p.team],actor=node('g',{class:'pitch-player','data-player':p.id,'data-team':p.team});
  const title=node('title',{},`${p.name} · ${p.team==='harbor'?'Harbor FC':'Northbridge'}`);
  const focus=node('ellipse',{class:'player-focus-ring',cx:0,cy:0,rx:3.3,ry:1.4,fill:color,'fill-opacity':'.12',stroke:color,'stroke-width':'.3'});
  const shade=node('ellipse',{cx:.65,cy:.25,rx:1.9,ry:.65,fill:'#000','fill-opacity':'.48',filter:'url(#pitch-shadow)'});
  const slot=(keeper?2:0)+(p.team==='north'?1:0),portrait=node('svg',{class:'player-cutout',x:-3.2,y:-7,width:6.4,height:7.4,viewBox:`${slot%2*512} ${Math.floor(slot/2)*512} 512 512`,preserveAspectRatio:'xMidYMax meet','aria-hidden':true});
  const art=node('image',{x:0,y:0,width:1024,height:1024,href:'assets/match-players.png',preserveAspectRatio:'none'});art.addEventListener('error',()=>container.classList.add('no-player-art'));portrait.append(art);
  const kit=node('g',{class:'player-kit','aria-hidden':true});kit.append(node('path',{d:'M-1.2-3.5l-1.6 1.2 .8 1.1 1-.5v2h2v-2l1 .5 .8-1.1-1.6-1.2-.5.5h-1.4Z',fill:keeper?(p.team==='harbor'?'#ec9b36':'#b98be3'):color,stroke:'#ffffffaa','stroke-width':'.15'}));
  const label=node('g',{class:'player-number','aria-hidden':true});label.append(node('rect',{x:-1.2,y:.5,width:2.4,height:2.1,rx:.4,fill:p.team==='harbor'?'#303815':'#102d46',stroke:color,'stroke-width':'.1'}),node('text',{x:0,y:2.08,'text-anchor':'middle',fill:'#fff','font-size':'1.5','font-weight':700},number));
  // Transparent hit target and keyboard access preserve player selection.
  const hit=node('rect',{class:'pitch-player-hit',x:-2.5,y:-6,width:5,height:8.8,fill:'transparent',role:'button',tabindex:0,'aria-label':`Follow ${p.name}`,'data-player':p.id});
  actor.append(title,shade,focus,portrait,kit,label,hit);
  hit.addEventListener('click',()=>onSelect(p.id));hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p.id);}});
  players.append(actor);actors.set(p.id,{actor,focus,hit});
 }
 stage.append(players);
 const football=node('g',{class:'match-ball','aria-label':'Ball position'});football.append(node('ellipse',{cx:.3,cy:.3,rx:.65,ry:.35,fill:'#0008'}),node('circle',{r:.62,fill:'#fcfcf3',stroke:'#23313a','stroke-width':'.16'}),node('path',{d:'M-.22-.13L.08-.3.32-.08.18.22-.15.21Z',fill:'#273541'}));stage.append(football);
 const nameTag=node('g',{class:'pitch-focus-label','aria-hidden':true});nameTag.append(node('rect',{x:-7,y:3.1,width:14,height:2.7,rx:.4,fill:'#0b1019',stroke:'#cfd99c','stroke-width':'.15'}),node('text',{x:0,y:4.95,'text-anchor':'middle',fill:'#f5f6ed','font-size':'1.5','font-weight':600}));stage.append(nameTag);
 stage.append(node('text',{x:0,y:73,fill:'#b8c6c8','font-size':1,'letter-spacing':'.12'},'GENERATED PLAYER ART · SYNTHETIC TRACKING'));
 container.replaceChildren(stage);
 return {update(s,state,focusId,corrected=false){
  for(const p of state.players){const {actor,focus,hit}=actors.get(p.id);actor.setAttribute('transform',`translate(${p.position[0]} ${p.position[1]})`);hit.setAttribute('aria-pressed',String(p.id===focusId));focus.style.display=p.id===focusId?'':'none';}
  const selected=state.players.find(p=>p.id===focusId);if(!selected)return;
  const points=[];for(let t=Math.max(0,state.time-8);t<state.time;t+=.5)points.push(position(s,focusId,t,corrected));points.push(selected.position);trail.setAttribute('points',points.map(p=>p.join(',')).join(' '));trail.setAttribute('stroke',palette[selected.team]);
  const last=state.seen.filter(e=>e.type==='pass').at(-1);passLine.style.display=last?'':'none';if(last){for(const [k,v]of Object.entries({x1:last.start[0],y1:last.start[1],x2:last.endPosition[0],y2:last.endPosition[1]}))passLine.setAttribute(k,v);}
  const b=ball(s,state.time);football.setAttribute('transform',`translate(${b[0]} ${b[1]})`);
  const [x,y]=selected.position;nameTag.setAttribute('transform',`translate(${Math.max(7,Math.min(98,x))} ${y>60?y-14:y})`);nameTag.querySelector('text').textContent=selected.name.split(' ').at(-1).toUpperCase();
  container.dataset.clock=clock(s,state.time);
 },setView(view){container.dataset.view=view;}};
}
