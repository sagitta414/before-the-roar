const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));

export function summarizeHoldout(study){
 const cases=study?.cases||[];
 const totals=cases.reduce((sum,item)=>({expected:sum.expected+(item.expectedEvents||0),detected:sum.detected+(item.detectedEvents||0),matched:sum.matched+(item.matchedEvents||0)}),{expected:0,detected:0,matched:0});
 const weighted=(key,weight='matchedEvents')=>{const denominator=cases.reduce((sum,item)=>sum+(item[weight]||0),0);return denominator?cases.reduce((sum,item)=>sum+(item[key]||0)*(item[weight]||0),0)/denominator:null;};
 return {...totals,precision:totals.detected?totals.matched/totals.detected:0,recall:totals.expected?totals.matched/totals.expected:0,playerDetectionRate:weighted('playerDetectionRate','frames'),speedMeanAbsoluteErrorKmh:weighted('speedMeanAbsoluteErrorKmh'),sourceHash:study?.detector_sha256||null,version:study?.version||'unavailable'};
}

export function passAssurance(quality,model){
 if(!quality||!model)return null;
 const probability=clamp(quality.completion||0);
 const bin=(model.bins||[]).find(item=>probability>=item.range[0]&&probability<=(item.range[1]===1?1:item.range[1]))||null;
 const gap=bin?Math.abs(bin.predicted-bin.observed):null;
 const reliability=!bin?'unavailable':bin.n>=100&&gap<=.05?'strong':bin.n>=50&&gap<=.08?'moderate':'limited';
 const [,distanceWeight=0,pressureWeight=0,laneWeight=0]=model.weights||[];
 const components=[{label:'Distance',value:Math.abs(distanceWeight*clamp(quality.distance/40,0,1.5))},{label:'Pressure',value:Math.abs(pressureWeight*clamp(quality.pressure/10))},{label:'Lane',value:Math.abs(laneWeight*clamp(quality.clearance/8))}];
 const total=components.reduce((sum,item)=>sum+item.value,0)||1;
 components.forEach(item=>{item.share=item.value/total;});
 return {probability,difficulty:quality.difficulty,label:quality.label,bin,gap,reliability,components};
}

export class IdentityLedger{
 constructor(roster=[]){this.roster=roster;this.reset();}
 reset(){this.frames=0;this.firstTime=null;this.lastTime=null;this.records=new Map(this.roster.map(player=>[player.id,{id:player.id,observedFrames:0,lastSeen:null,missingSince:null,reacquisitions:0,confidenceTotal:0,status:'waiting'}]));}
 update(players=[],time=0){this.frames++;if(this.firstTime===null)this.firstTime=time;this.lastTime=time;const seen=new Map(players.map(player=>[player.id,player]));for(const record of this.records.values()){const player=seen.get(record.id);if(player){if(record.missingSince!==null&&time-record.missingSince>.25)record.reacquisitions++;record.observedFrames++;record.lastSeen=time;record.missingSince=null;record.confidenceTotal+=player.confidence||0;record.status=record.reacquisitions?'reacquired':'locked';}else{if(record.missingSince===null)record.missingSince=time;record.status=record.lastSeen===null?'unseen':'missing';}}}
 snapshot(){const players=[...this.records.values()].map(record=>({...record,coverage:this.frames?record.observedFrames/this.frames:0,meanConfidence:record.observedFrames?record.confidenceTotal/record.observedFrames:0,missingSeconds:record.missingSince===null?0:Math.max(0,(this.lastTime||0)-record.missingSince)}));return {frames:this.frames,locked:players.filter(player=>player.status==='locked'||player.status==='reacquired').length,meanCoverage:players.length?players.reduce((sum,player)=>sum+player.coverage,0)/players.length:0,reacquisitions:players.reduce((sum,player)=>sum+player.reacquisitions,0),players,method:'enrolled colour marker; identity is withheld while absent'};}
}

export function eventAssurance(event,model,holdoutSummary,identitySnapshot){
 if(!event)return null;
 const from=identitySnapshot?.players?.find(player=>player.id===event.from),to=identitySnapshot?.players?.find(player=>player.id===event.to),identities=[from,to].filter(Boolean);
 return {pass:event.quality?passAssurance(event.quality,model):null,speed:{value:event.speed,method:'ground-plane linear fit',controlledHoldoutMaeKmh:holdoutSummary?.speedMeanAbsoluteErrorKmh??null,aerialSupported:false},identity:{method:'enrolled colour markers',minimumCoverage:identities.length?Math.min(...identities.map(player=>player.coverage)):null,inferredThroughAbsence:false},detection:{frames:event.evidence,precision:holdoutSummary?.precision??null,recall:holdoutSummary?.recall??null,domain:'controlled fixed-camera synthetic holdout'}};
}
