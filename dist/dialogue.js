export class DialogueState{
 constructor(){this.reset();}
 reset(){this.cutoff=-1;this.drafts=new Map();this.finalized=new Set();this.pending=false;}
 begin(cutoff){if(cutoff<this.cutoff||this.finalized.has(cutoff))return false;if(cutoff>this.cutoff)this.drafts.clear();this.cutoff=cutoff;this.pending=true;return true;}
 update(data){if(this.finalized.has(data.cutoff)||data.cutoff<this.cutoff)return false;if(data.cutoff>this.cutoff)this.begin(data.cutoff);this.pending=true;this.drafts.set(data.mode,data);return true;}
 finish(cutoff){this.finalized.add(cutoff);if(cutoff===this.cutoff){this.pending=false;this.drafts.clear();}}
 get(mode){return this.pending?this.drafts.get(mode):null;}
}
