// Retain a real, unedited two-round film conversation, including failures.
import { mkdir, writeFile } from 'node:fs/promises';
import { PITCHSIDE } from '../dist/pitchside-story.js';

const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw Error('Pass the deployed HTTPS API origin');
const path = 'docs/proof/live-film-two-round-v79.json';
const health = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(30000) }).then(r => r.json());
if (health.usage.limit - health.usage.used < 12) throw Error('Twelve available requests required; no allowance change will be made');
const report = { schema: 'btr.live-film-conversation.v1', recorded_at: new Date().toISOString(), origin, source: 'manually reviewed AI film at 00:12', before: { version: health.version, usage: health.usage }, rounds: [], complete: false, all_ai: false, limits: 'One live demonstration with a fixed evidence cutoff. Not a comparison or accuracy score. All fallbacks and drafts are retained.' };
await mkdir('docs/proof', { recursive: true });
const save = () => writeFile(path, JSON.stringify(report, null, 2) + '\n');
for (const question of ['At this receiving touch, what can the nearby outlet actually establish, and what should we watch next?', 'If we saw the following touch, how could it change this interpretation?']) {
  const parentKey = report.rounds.at(-1)?.events.find(e => e.type === 'conversation')?.data.id;
  const input = { clip_id: PITCHSIDE.id, time: 12, language: 'en', mode: 'analyst', question, ...(parentKey ? { parentKey } : {}) };
  const round = { input, events: [], started_at: new Date().toISOString() }; report.rounds.push(round); await save();
  const response = await fetch(origin + '/api/clip-desk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw Error('Film discussion HTTP ' + response.status);
  let buffer = ''; const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true }); let end;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
      const type = frame.match(/^event: (.+)$/m)?.[1], data = frame.match(/^data: (.+)$/m)?.[1];
      if (type && data) { round.events.push({ type, data: JSON.parse(data), at: new Date().toISOString() }); if (type !== 'draft') await save(); }
    }
  }
  round.finished_at = new Date().toISOString(); await save();
  if (!round.events.some(e => e.type === 'complete') || round.events.some(e => e.type === 'error')) throw Error('Incomplete live round; partial receipt retained');
}
const after = await fetch(origin + '/api/health', { signal: AbortSignal.timeout(30000) }).then(r => r.json());
report.after = { version: after.version, usage: after.usage };
report.complete = report.rounds.length === 2 && report.rounds.every(r => new Set(r.events.filter(e => e.type === 'post').map(e => e.data.role)).size === 5);
report.all_ai = report.complete && report.rounds.every(r => r.events.filter(e => e.type === 'post' && ['analyst','guide','presenter'].includes(e.data.role)).every(e => e.data.engine === 'azure_openai'));
await save();
console.log(JSON.stringify({ path, complete: report.complete, all_ai: report.all_ai, requests_used: after.usage.used - health.usage.used, rounds: report.rounds.map(r => r.events.filter(e => e.type === 'post').map(e => ({ role: e.data.role, engine: e.data.engine, summary: e.data.summary }))) }));

