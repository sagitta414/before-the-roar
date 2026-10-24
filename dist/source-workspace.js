// One revision owner for a local clip. A later detector tick cannot resurrect a withdrawal.
export const workspace = {source:null,cues:[],events:[],players:[],detectorHealth:null,corrected:false,revision:1,withdrawn:[]};
const listeners=new Set();
const activeId=()=>workspace.events.at(-1)?.id||workspace.cues.at(-1)?.id;
function notify(){workspace.corrected=workspace.withdrawn.includes(activeId());for(const listener of listeners)listener(workspace);}
export function subscribeWorkspace(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function setWorkspaceSource(source){Object.assign(workspace,{source,cues:[],events:[],players:[],detectorHealth:null,corrected:false,revision:1,withdrawn:[]});notify();}
export function updateWorkspace(records){Object.assign(workspace,records);workspace.revision++;notify();}
export function withdrawWorkspaceEvent(id,withdraw=true){if(!workspace.source||![...workspace.events,...workspace.cues].some(e=>e.id===id))return false;const ids=new Set(workspace.withdrawn);withdraw?ids.add(id):ids.delete(id);workspace.withdrawn=[...ids];workspace.revision++;notify();return true;}
