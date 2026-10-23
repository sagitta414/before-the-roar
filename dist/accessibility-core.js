export const ACCESSIBILITY_PROFILES = Object.freeze({
  standard:{label:'Standard',description:'Broadcast presentation with optional assistive tools.',settings:{}},
  vision:{label:'Blind / low vision',description:'Spoken play, high contrast, larger text and a persistent transcript.',settings:{narration:true,transcript:true,largeText:true,highContrast:true}},
  hearing:{label:'Deaf / hard of hearing',description:'Rich captions, visible match signals and a persistent transcript.',settings:{captions:true,transcript:true,visualSignals:true}},
  cognitive:{label:'Clear & calm',description:'Plain language, one update at a time and reduced visual competition.',settings:{plainLanguage:true,quiet:true,reducedMotion:true,transcript:true}},
  motor:{label:'Hands-free / motor',description:'Large controls, visible focus and optional voice commands.',settings:{largeTargets:true,voice:true,transcript:true}},
  sensory:{label:'Sensory safe',description:'No flashes, reduced motion, quieter sound and fewer interruptions.',settings:{quiet:true,reducedMotion:true,lowAudio:true}}
});

export const ACCESSIBILITY_MOMENTS = Object.freeze([
  {at:0,clock:'67:00',kind:'scene',title:'The duel begins',plain:'A Harbor attacker controls the ball near the right touchline while a Northbridge defender closes the space.',detail:'Wide stadium view. Harbor attacks from left to right. The ball is near the right touchline and the nearest defender is goal-side.'},
  {at:8,clock:'67:08',kind:'movement',title:'The runner starts',plain:'A teammate runs inside without the ball, giving the defender another movement to watch.',detail:'An off-ball Harbor runner accelerates through the inside channel. The on-ball attacker continues along the touchline.'},
  {at:16,clock:'67:16',kind:'evidence',title:'The evidence cutoff',plain:'The pass and run are recorded. Whether the run caused the defender to move still needs checking.',detail:'Two completed Harbor passes have reached the cutoff. Tracking records the runner and defender, but the records alone do not prove causation.'},
  {at:24,clock:'67:24',kind:'pressure',title:'Pressure narrows the lane',plain:'The defender stays close enough to make the next touch harder.',detail:'The nearest defender closes the available lane. The tactical effect is an interpretation and remains qualified.'},
  {at:32,clock:'67:32',kind:'possession',title:'Harbor keeps the ball',plain:'The next pass reaches a teammate, so Harbor keeps possession.',detail:'A completed pass transfers the ball to the intended Harbor receiver. The event record supports possession continuing.'},
  {at:40,clock:'67:40',kind:'shot',title:'The attack reaches a shot',plain:'Harbor releases a shot after the passing move.',detail:'A shot event reaches the evidence cutoff. Direction and outcome remain tied to the synthetic event record.'},
  {at:48,clock:'67:48',kind:'review',title:'Check challenges the story',plain:'The attack is real, but the evidence may not prove why the defender moved.',detail:'The independent review separates recorded progression from the unsupported causal claim about the defender.'},
  {at:52,clock:'67:52',kind:'correction',title:'A narrower story is published',plain:'The attack progressed. BTR removes the claim that the run caused the defender to move.',detail:'Truth Lab can hold the defender in place. The pass calculation survives; the movement claim is withdrawn and the broadcast line changes.'}
]);

export const defaultAccessibilitySettings=()=>({profile:'standard',captions:false,narration:false,transcript:false,visualSignals:false,plainLanguage:false,quiet:false,reducedMotion:false,largeText:false,highContrast:false,largeTargets:false,voice:false,lowAudio:false});

export function settingsForProfile(profile,previous={}){
  const base=defaultAccessibilitySettings(),preset=ACCESSIBILITY_PROFILES[profile]||ACCESSIBILITY_PROFILES.standard;
  return {...base,...previous,...preset.settings,profile};
}

export function momentAt(second=0){const time=Math.max(0,Number(second)||0);return [...ACCESSIBILITY_MOMENTS].reverse().find(moment=>time>=moment.at)||ACCESSIBILITY_MOMENTS[0];}

export function descriptiveLine(moment,{plainLanguage=false,correction=false}={}){
  const current=moment||ACCESSIBILITY_MOMENTS[0];
  if(correction)return 'Evidence correction. The defender is held in place. The pass remains recorded, the causal movement claim is withdrawn, and the public explanation is revised.';
  return `${current.clock}. ${plainLanguage?current.plain:current.detail}`;
}

export function accessibleStatus(settings){const active=Object.entries(settings||{}).filter(([key,value])=>key!=='profile'&&value).map(([key])=>key);return active.length?`${active.length} accessibility tools active`:'Standard broadcast presentation';}
