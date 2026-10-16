// An inspectable baseline, not a trained or calibrated football forecasting model.
export function passEstimate(completed, attempts) {
 if(!Number.isInteger(attempts)||!Number.isInteger(completed)||attempts<1||completed<0||completed>attempts)return null;
 const rate=completed/attempts,z=1.96,den=1+z*z/attempts,centre=(rate+z*z/(2*attempts))/den,spread=z*Math.sqrt(rate*(1-rate)/attempts+z*z/(4*attempts*attempts))/den;
 return {probability:(completed+1)/(attempts+2),observed:rate,low:Math.max(0,centre-spread),high:Math.min(1,centre+spread),completed,attempts};
}
export function analyticsSnapshot(stats){
 return {second:stats.second,events:stats.events,teams:['home','away'].map(team=>({team,passes:passEstimate(stats.completed?.[team],stats.passes?.[team]),shots:stats.shots?.[team]??0,pressures:stats.pressures?.[team]??0,possession:stats.possession?.[team]??0}))};
}
