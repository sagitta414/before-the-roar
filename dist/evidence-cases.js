import {SCENARIOS,events,clock} from './engine.js';

export const EVIDENCE_CASES=[
 {id:'wide',name:'01 · Correct the tracking',before:16,after:16},
 {id:'press',name:'02 · Release the interception',before:9,after:10},
 {id:'counter',name:'03 · Reveal the shot result',before:27,after:28}
];

// Only completed source records enter the comparison. No model or inferred cause.
export function eventComparison(id,time){
 const config=EVIDENCE_CASES.find(c=>c.id===id),s=SCENARIOS.find(s=>s.id===id);
 if(!config||id==='wide')return null;
 const all=events(s),before=all.filter(e=>e.end<=config.before),current=all.filter(e=>e.end<=time);
 const arrived=current.some(e=>id==='press'?e.outcome==='intercepted':e.type==='shot');
 const source=current.find(e=>id==='press'?e.outcome==='intercepted':e.type==='shot');
 const unchanged=before.filter(e=>current.some(r=>r.id===e.id));
 return {config,arrived,source,clock:clock(s,time),beforeClock:clock(s,config.before),
 original:id==='press'?'At 72:09, the pass has not completed. A recovery cannot yet be claimed.':'At 78:27, the shot has started. Its outcome is not yet in the record.',
 current:id==='press'?(arrived?'Cole intercepted the pass. Pressure preceded the recovery; this does not prove it caused the error.':'The interception is still outside the cutoff. Describe the pressure, not a completed recovery.'):(arrived?'Berg saved Brooks’ shot. The forward passes remain valid; this attack produced no goal.':'The build-up is recorded. Wait for the completed shot before describing its result.'),
 change:id==='press'?'Move the evidence cutoff across the completed interception.':'Move the evidence cutoff across the completed shot.',
 metric:arrived?(id==='press'?'Pending → intercepted':'Pending → saved'):'Outcome not yet available',
 preserved:unchanged.length+' earlier event records remain unchanged.',
 evidence:{scenario:id,before_second:config.before,current_second:time,before_event_ids:before.map(e=>e.id),current_event_ids:current.map(e=>e.id),new_records:current.filter(e=>!before.some(b=>b.id===e.id)),limits:'Authored synthetic event-window test. Event order does not prove cause.'}};
}
