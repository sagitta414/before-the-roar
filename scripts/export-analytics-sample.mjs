import {writeFile} from 'node:fs/promises';
import {generateMatch,initialState,ingest,snapshot} from '../api/match.mjs';
const match=generateMatch(7),state=initialState(),cutoff=1800;
for(const event of match.events.filter(e=>e.second<=cutoff))ingest(state,event);
await writeFile('dist/assets/analytics-sample.json',JSON.stringify({source:'Sample fixture 07 · first 30 minutes · synthetic',fixture:match.id,cutoff,stats:snapshot(state,cutoff)},null,2)+'\n');
