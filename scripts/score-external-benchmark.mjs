import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
export function scoreClips(clips){
 let matched=0,expected=0,predicted=0,minutes=0,rejected=0,identityCorrect=0,identityTotal=0;const speedErrors=[];
 for(const clip of clips){if(clip.annotation_status!=='human-reviewed'||clip.used_for_tuning!==false||!Array.isArray(clip.truth)||!Array.isArray(clip.detected)||!Number.isFinite(clip.duration_seconds)||clip.duration_seconds<=0)throw Error('Every clip needs reviewed labels, duration and an unseen attestation.');
  if(typeof clip.rejected!=='boolean')throw Error('Compatibility outcome is required.');
  if(clip.rejected&&clip.detected.length)throw Error('Rejected clips cannot publish detected events.');
  for(const event of [...clip.truth,...clip.detected])if(!['pass','shot','tackle','possession-change'].includes(event.type)||!Number.isFinite(event.second)||event.second<0||event.second>clip.duration_seconds)throw Error('Invalid event type or timestamp.');
  const used=new Set();expected+=clip.truth.length;predicted+=clip.detected.length;minutes+=clip.duration_seconds/60;rejected+=Number(clip.rejected);
  for(const event of [...clip.detected].sort((a,b)=>a.second-b.second)){if(!Number.isFinite(event.second)||event.second<0||event.second>clip.duration_seconds)throw Error('Invalid detected timestamp.');let best=-1,delta=.500001;clip.truth.forEach((target,index)=>{if(!Number.isFinite(target.second)||target.second<0||target.second>clip.duration_seconds)throw Error('Invalid annotated timestamp.');const difference=Math.abs(event.second-target.second);if(!used.has(index)&&event.type===target.type&&difference<delta){best=index;delta=difference;}});if(best>=0){used.add(best);matched++;}}
  for(const row of clip.identities||[]){if(typeof row.correct!=='boolean'||!row.labelled_by_human)throw Error('Identity comparisons need human labels.');identityTotal++;identityCorrect+=Number(row.correct);}
  for(const row of clip.speeds||[]){if(!['calibrated-reference','synthetic-ground-truth'].includes(row.reference_method)||![row.reference_kmh,row.detected_kmh].every(Number.isFinite))throw Error('Speed error requires an independently established reference.');speedErrors.push(Math.abs(row.reference_kmh-row.detected_kmh));}
 }
 return {clips:clips.length,events:{matched,expected,predicted,precision:predicted?matched/predicted:null,recall:expected?matched/expected:null,false_positives:predicted-matched,false_positives_per_minute:minutes?(predicted-matched)/minutes:null},identity:{correct:identityCorrect,total:identityTotal,accuracy:identityTotal?identityCorrect/identityTotal:null},speed:{samples:speedErrors.length,mae_kmh:speedErrors.length?speedErrors.reduce((a,b)=>a+b,0)/speedErrors.length:null},compatibility:{rejected,total:clips.length,rejection_rate:clips.length?rejected/clips.length:null}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node scripts/score-external-benchmark.mjs manifest.json new-report.json');
 const study=JSON.parse(await readFile(input,'utf8'));if(!study.clips?.length)throw Error('No clips supplied. No validation result can be published.');
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');if(hash(await readFile(study.detector_source))!==study.detector_sha256)throw Error('Detector source freeze mismatch.');
 for(const clip of study.clips){if(hash(await readFile(clip.file))!==clip.sha256)throw Error('Clip bytes differ from frozen manifest.');}
 const conditions={};for(const field of ['lighting','camera_angle','occlusion']){conditions[field]={};for(const value of new Set(study.clips.map(c=>c[field]||'unspecified')))conditions[field][value]=scoreClips(study.clips.filter(c=>(c[field]||'unspecified')===value));}
 await writeFile(output,JSON.stringify({schema:'btr.external-benchmark.v1',created_at:new Date().toISOString(),detector_sha256:study.detector_sha256,manifest_sha256:hash(await readFile(input)),overall:scoreClips(study.clips),conditions,limitations:['Human labels and independence require curator verification.','Null means not measured, not zero error.','Event matching uses type and a fixed 0.5-second window.','Precision among accepted clips is not general broadcast accuracy.']},null,2),{flag:'wx'});
}
