export function executionProfile(source) {
 if(source==='upload')return {heading:'LOCAL DETECTION · OPTIONAL AI REVIEW',roles:'No model request is required for local tracking.',detail:'Detection and measurements run on device. Optional AI review is separate; its actual calls appear in the run receipt.'};
 if(source==='pitchside')return {heading:'3 MODEL ROLES · 2 CODE ROLES',roles:'Scout · Guide · Host',detail:'Scout, Guide and Host use Azure sequentially. Vector calculates and Check applies evidence rules. A fresh film round uses 3 requests, with up to 3 editorial retries. Exact saved rounds use 0 new calls. Foundry review is separate.'};
 return {heading:'4 MODEL ROLES · VECTOR IN CODE',roles:'Scout · Guide · Check · Host',detail:'A fresh synthetic-match round uses 4 sequential Azure specialist requests. Vector calculates in code; the deterministic claim gate stays final. Exact saved rounds use 0 new calls. Foundry review is separate.'};
}
