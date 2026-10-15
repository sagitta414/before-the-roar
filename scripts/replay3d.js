import * as THREE from '/vendor/three.module.js';
import {PLAYERS,position,ball,events} from '/engine.js';

// Authored 3D choreography follows the exact synthetic event pack. No external footage.
export function createReplay(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
 renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#101c29');scene.fog=new THREE.Fog('#182c32',130,260);
 const camera=new THREE.PerspectiveCamera(38,1280/720,.1,400);
 scene.add(new THREE.HemisphereLight('#d8ecff','#274124',2.1));
 const sun=new THREE.DirectionalLight('#fff4dc',3.5);sun.position.set(-15,75,28);sun.castShadow=true;
 Object.assign(sun.shadow.camera,{left:-75,right:75,top:65,bottom:-65,near:1,far:180});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;scene.add(sun);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.86});
 function box(w,h,d,color,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='object'?color:mat(color));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 box(160,.3,115,'#132e23',0,-.3,0);
 for(let i=0;i<20;i++)box(5.25,.08,68,i%2?'#337b3c':'#2a6c35',-52.5+2.625+i*5.25,-.04,0);
 const chalk=new THREE.LineBasicMaterial({color:'#e1f1d0'});
 const v=(x,y,z)=>new THREE.Vector3(x,y,z);
 function line(points,material=chalk){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>v(...p)));const l=new THREE.Line(g,material);scene.add(l);return l;}
 function field(points){line(points.map(([x,z])=>[x-52.5,.04,z-34]));}
 field([[0,0],[105,0],[105,68],[0,68],[0,0]]);field([[52.5,0],[52.5,68]]);
 function circle(x,z,r){field(Array.from({length:97},(_,i)=>[x+Math.sin(i/96*Math.PI*2)*r,z+Math.cos(i/96*Math.PI*2)*r]));}
 circle(52.5,34,9.15);
 for(const end of [0,105]){const sign=end===0?1:-1;field([[end,13.84],[end+sign*16.5,13.84],[end+sign*16.5,54.16],[end,54.16]]);field([[end,24.84],[end+sign*5.5,24.84],[end+sign*5.5,43.16],[end,43.16]]);circle(end+sign*11,34,.15);
  const gx=end-52.5,back=gx-sign*2.5;const net=new THREE.LineBasicMaterial({color:'#cbd8dc',transparent:true,opacity:.43});
  for(const z of [-3.66,3.66]){box(.13,2.44,.13,'#fafbff',gx,1.22,z);line([[gx,2.44,z],[back,2.44,z],[back,0,z]],net);}
  box(.13,.13,7.45,'#fafbff',gx,2.44,0);
  for(let z=-3.66;z<=3.67;z+=.3){line([[gx,2.44,z],[back,2.44,z],[back,.05,z]],net);}
  for(let y=.15;y<2.5;y+=.3){line([[gx,y,-3.66],[back,y,-3.66],[back,y,3.66],[gx,y,3.66]],net);}
 }
 // Bowl, crowd and repeating LED boards create a broadcast setting without branded assets.
 const seats=new THREE.InstancedMesh(new THREE.BoxGeometry(.42,.65,.35),mat('#82929a'),5200);let n=0;const dummy=new THREE.Object3D();
 for(const side of [-1,1])for(let row=0;row<13;row++){
  const z=side*(42+row*.95),y=2.4+row*.73;box(135,.55,.95,row%2?'#233d4c':'#294657',0,y-.7,z);
  for(let col=0;col<190;col++){dummy.position.set(-66+col*.7,y,z);dummy.updateMatrix();seats.setMatrixAt(n,dummy.matrix);seats.setColorAt(n,new THREE.Color(['#748395','#315674','#e0d9bc','#1c3b44','#b8c997'][((col*17+row*7)%29)%5]));n++;}
 }
 seats.count=n;scene.add(seats);
 for(const side of [-1,1]){box(132,1.25,.2,'#0d2835',0,.75,side*39);for(let i=0;i<14;i++){
  const c=document.createElement('canvas');c.width=512;c.height=64;const cx=c.getContext('2d');cx.fillStyle=i%2?'#b7e861':'#152a27';cx.fillRect(0,0,512,64);cx.fillStyle=i%2?'#152a27':'#c9f28b';cx.font='bold 26px Arial';cx.textAlign='center';cx.fillText(i%2?'BEFORE THE ROAR':'SEE THE UNSEEN GAME',256,42);
  const board=new THREE.Mesh(new THREE.PlaneGeometry(8.7,1.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));board.position.set(-60+i*9.2,.85,side*38.85);scene.add(board);
 }}
 const skin=['#b27a56','#633e2c','#d7a47b','#916042'];const bodies=new Map();
 function person(p){const root=new THREE.Group();scene.add(root);const rig=new THREE.Group();root.add(rig);const keeper=p.id===1||p.id===101;
  const shirt=mat(keeper?'#f094b0':p.team==='harbor'?'#c1ef54':'#a9d5f4'),shorts=mat(p.team==='harbor'?'#163d27':'#1b3052'),flesh=mat(skin[p.id%4]),socks=shirt;
  const torso=box(.54,.64,.3,shirt,0,1.18,0,rig);torso.castShadow=true;box(.5,.23,.32,shorts,0,.79,0,rig);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),flesh);head.position.y=1.72;head.castShadow=true;rig.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.173,12,8,0,Math.PI*2,0,Math.PI*.5),mat('#211b17'));hair.position.y=1.75;rig.add(hair);
  const limbs=[];for(const sign of [-1,1]){const leg=new THREE.Group();leg.position.set(sign*.15,.76,0);rig.add(leg);box(.16,.33,.18,flesh,0,-.16,0,leg);box(.155,.3,.17,socks,0,-.46,0,leg);const boot=box(.18,.12,.3,'#f3e8d2',0,-.66,.08,leg);boot.castShadow=true;limbs.push(leg);
   const arm=new THREE.Group();arm.position.set(sign*.34,1.4,0);arm.rotation.z=sign*.13;rig.add(arm);box(.16,.22,.18,shirt,0,-.1,0,arm);box(.12,.36,.13,flesh,0,-.37,.02,arm);limbs.push(arm);
  }
  const cv=document.createElement('canvas');cv.width=64;cv.height=64;const cx=cv.getContext('2d');cx.fillStyle=p.team==='harbor'?'#193c25':'#183957';cx.font='bold 49px Arial';cx.textAlign='center';cx.fillText(String(p.number||p.id),32,50);
  const num=new THREE.Mesh(new THREE.PlaneGeometry(.31,.31),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),transparent:true,side:THREE.DoubleSide}));num.position.set(0,1.25,-.157);num.rotation.y=Math.PI;rig.add(num);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.53,20),new THREE.MeshBasicMaterial({color:'#062a16',transparent:true,opacity:.25}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;root.add(shadow);
  bodies.set(p.id,{root,rig,limbs});
 }
 PLAYERS.forEach(person);
 const football=new THREE.Mesh(new THREE.IcosahedronGeometry(.23,2),mat('#fff9e8'));football.castShadow=true;scene.add(football);
 const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(.232,0)),new THREE.LineBasicMaterial({color:'#3d4541'}));football.add(edges);
 const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.32,18),new THREE.MeshBasicMaterial({color:'#102e18',transparent:true,opacity:.4}));ballShadow.rotation.x=-Math.PI/2;scene.add(ballShadow);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.72,.82,40),new THREE.MeshBasicMaterial({color:'#e2ff98',side:THREE.DoubleSide,transparent:true,opacity:.75}));ring.rotation.x=-Math.PI/2;scene.add(ring);
 function render(s,t){const b=ball(s,t),all=events(s),shot=all.find(e=>e.type==='shot');
  for(const p of PLAYERS){const {root,rig,limbs}=bodies.get(p.id),a=position(s,p.id,t),prev=position(s,p.id,Math.max(0,t-.1)),next=position(s,p.id,Math.min(s.duration,t+.1));const dx=next[0]-prev[0],dz=next[1]-prev[1],speed=Math.hypot(dx,dz)*5;
   root.position.set(a[0]-52.5,0,a[1]-34);root.rotation.y=speed>.12?Math.atan2(dx,dz):Math.atan2(b[0]-a[0],b[1]-a[1]);
   const gait=Math.sin(t*(7+Math.min(speed,3))+p.id)*Math.min(.78,speed*.35);limbs[0].rotation.x=gait;limbs[2].rotation.x=-gait;limbs[1].rotation.x=-gait*.75-.2;limbs[3].rotation.x=gait*.75-.2;rig.position.y=Math.abs(Math.sin(t*10+p.id))*.04*Math.min(1,speed);rig.rotation.z=0;
   const kick=all.find(e=>e.from===p.id&&t>=e.t-.25&&t<=e.t+.35);if(kick)limbs[2].rotation.x=-Math.sin((t-kick.t+.25)/.6*Math.PI)*1.25;
   if(p.id===101&&shot&&t>shot.t){const u=Math.max(0,Math.min(1,(t-shot.t)/1));rig.rotation.z=(shot.outcome==='saved'?.45:1.12)*Math.sin(Math.min(1,u)*Math.PI/2);rig.position.y=-.28*u;limbs[1].rotation.x=-1.4*u;limbs[3].rotation.x=-1.4*u;}
   if(shot?.outcome==='goal'&&t>shot.end+1&&p.team==='harbor'){limbs[1].rotation.z=-1.9;limbs[3].rotation.z=1.9;}else {limbs[1].rotation.z=-.13;limbs[3].rotation.z=.13;}
  }
  const moving=all.find(e=>t>=e.t&&t<=e.end&&e.end>e.t);let loft=.23;if(moving)loft+=Math.sin((t-moving.t)/(moving.end-moving.t)*Math.PI)*(moving.type==='shot'?.8:.35);
  football.position.set(b[0]-52.5,loft,b[1]-34);football.rotation.set(t*6,0,t*4);ballShadow.position.set(b[0]-52.5,.045,b[1]-34);
  const focus=position(s,s.focus,t);ring.position.set(focus[0]-52.5,.045,focus[1]-34);
  const center=THREE.MathUtils.clamp(b[0]*.55+focus[0]*.2+70*.25,43,87)-52.5;
  camera.position.set(center-10,34,52);camera.lookAt(center,0,-3);renderer.render(scene,camera);
 }
 return {render,renderer};
}
