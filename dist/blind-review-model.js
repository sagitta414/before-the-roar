export const dimensions=['grounding','clarity','usefulness'];
export function completeRating(row){return ['A','B'].every(side=>dimensions.every(key=>Number.isInteger(row?.[side]?.[key])&&row[side][key]>=1&&row[side][key]<=5));}
export function validateReview(review,trial){
 if(review?.trial!==trial.id||review?.trial_hash!==trial.hash)throw Error('Wrong trial version');
 if(typeof review.reviewer!=='string'||!/^r-[a-zA-Z0-9-]{8,60}$/.test(review.reviewer))throw Error('Invalid anonymous reviewer ID');
 if(review.independent!==true)throw Error('Independent-review attestation is missing');
 if(!Array.isArray(review.ratings)||review.ratings.length!==trial.cases.length)throw Error('Incomplete review');
 const seen=new Set();for(const row of review.ratings){if(!trial.cases.some(c=>c.id===row.case)||seen.has(row.case)||!completeRating(row))throw Error('Missing, duplicate or invalid case rating');seen.add(row.case);}
 return review;
}
export function summarizeReviews(reviews,trial,key){
 const seen=new Set(),accepted=[],rejected=[];
 for(const r of reviews){try{validateReview(r,trial);if(seen.has(r.reviewer))throw Error('Duplicate reviewer');seen.add(r.reviewer);accepted.push(r);}catch(e){rejected.push({reviewer:r?.reviewer||null,reason:e.message});}}
 const reviewerDifferences=accepted.map(r=>Object.fromEntries(dimensions.map(d=>[d,r.ratings.reduce((sum,row)=>{const map=key[row.case];if(!map||!['A','B'].includes(map.crew)||!['A','B'].includes(map.baseline)||map.crew===map.baseline)throw Error('Invalid private arm key');return sum+row[map.crew][d]-row[map.baseline][d];},0)/r.ratings.length])));
 const mean=d=>reviewerDifferences.length?reviewerDifferences.reduce((n,r)=>n+r[d],0)/reviewerDifferences.length:null;
 return {reviewers:accepted.length,rejected,mean_crew_minus_baseline:Object.fromEntries(dimensions.map(d=>[d,mean(d)])),reviewer_differences:reviewerDifferences,independence:'Self-attested; organizer must verify participants are distinct and uninvolved in development.',conclusion:accepted.length<3?'Insufficient independent reviews; no superiority claim.':'Exploratory ratings only; inspect individual differences and correctness before selecting an approach. This sample does not establish general superiority.'};
}
