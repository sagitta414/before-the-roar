import { readFile, writeFile } from 'node:fs/promises';

const proof = JSON.parse(await readFile('demo/showcase-v186/live-sequence.json', 'utf8'));
const origin = proof.origin;
const health = async () => fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(30000) }).then(r => r.json());
const before = await health();
const input = proof.rounds[0].input;
const response = await fetch(`${origin}/api/match-desk`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(90000)
});
if (!response.ok) throw Error(`Replay failed: HTTP ${response.status}`);
let buffer = '';
const events = [], decoder = new TextDecoder();
for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let end;
  while ((end = buffer.indexOf('\n\n')) >= 0) {
    const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
    const type = frame.match(/^event: (.+)$/m)?.[1], raw = frame.match(/^data: (.+)$/m)?.[1];
    if (type && raw) events.push({ type, data: JSON.parse(raw) });
  }
}
const after = await health();
const posts = events.filter(e => e.type === 'post').map(e => e.data);
const result = {
  schema: 'btr.judge-replay-check.v1', at: new Date().toISOString(), release: proof.release,
  status: response.status, complete: events.some(e => e.type === 'complete') && !events.some(e => e.type === 'error'),
  posts: posts.length, replayed: posts.every(p => p.cached === true || p.resumed === true),
  allowance_before: before.usage, allowance_after: after.usage,
  no_new_model_requests: before.usage.used === after.usage.used,
  purpose: 'Confirm the saved discussion can be restored without consuming the public AI allowance.'
};
await writeFile('demo/showcase-v186/replay-check.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (!result.complete || posts.length !== 5 || !result.no_new_model_requests) process.exitCode = 1;
