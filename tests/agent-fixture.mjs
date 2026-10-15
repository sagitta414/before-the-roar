import {AgentState} from '../api/agent-state.mjs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
export const testState=store=>new AgentState(store,{directory:join(tmpdir(),'btr-test-'+randomBytes(10).toString('hex'))});
export function toolResponse(body){if(!body.tools)return null;return new Response(JSON.stringify({usage:{prompt_tokens:40,completion_tokens:8},choices:[{message:{role:'assistant',content:null,tool_calls:[{id:'call-evidence',type:'function',function:{name:body.messages[0].content.includes('Host:')?'review_public_claims':'read_evidence',arguments:'{}'}}]}}]}));}
