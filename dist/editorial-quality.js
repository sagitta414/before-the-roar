// Narrow editorial checks, not a semantic truth detector.
export function editorialIssues(role,text,previous=[]){
 const issues=[];
 if(/\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:[-\s]+\w+){0,3}\s+(?:pass(?:es)?|met(?:er|re)s?|seconds?|percent|goals?|shots?)\b/i.test(text))issues.push('Quantities belong in the calculated contribution');
 if(/\b(?:effective(?:ly)?|precise(?:ly)?|superior|excellent)\b/i.test(text))issues.push('Unmeasured quality rating');
 if(role==='guide'&&/\b(?:distance|metres?|meters?|seconds?|percentage|how many)\b/i.test(text))issues.push('Guide should teach a viewing decision, not repeat Vector’s calculation');
 if(role==='presenter'){
  const tokens=s=>(s.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]),mine=tokens(text);
  if(previous.some(p=>p.role==='analyst'&&mine.length>=4&&tokens(p.summary||'').slice(0,4).join(' ')===mine.slice(0,4).join(' ')))issues.push('Host repeats Scout’s opening observation');
 }
 return issues;
}
