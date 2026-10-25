// One bounded public-path execution for the submission film. Preserve all SSE receipts.
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.argv[2];
if (!origin?.startsWith('https://')) throw Error('Pass the public HTTPS origin');
const output = 'demo/showcase-v186/live-sequence.json';
await mkdir('demo/showcase-v186', { recursive: true });
const health = async () => fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(30000) }).then(r => r.json());
const before = await health();
if (before.usage.limit - before.usage.used < 15) throw Error('Need at least 15 available requests for a bounded three-round capture');
const report = {
  schema: 'btr.judge-live-sequence.v1',
  created_at: new Date().toISOString(),
  origin,
  release: { version: before.version, git_revision: before.git_revision, image_tag: before.image_tag },
  allowance_before: before.usage,
  rounds: [],
  scope: 'Fictional wide-run match at a single evidence cutoff. Round 1 and the viewer challenge use R1. Round 3 uses corrected R2; it begins a new conversation because the source revision changed. The film is a separate cinematic source.',
  limitations: 'Developer-run demonstration, not independent commentary evaluation or general broadcast-video validation.'
};
const save = () => writeFile(output, JSON.stringify(report, null, 2) + '\n');
await save();
const cases = [
  { name: 'opening', corrected: false, question: 'What does the wide run change about the defender and the passing? Answer from the reached evidence only.' },
  { name: 'viewer_challenge', corrected: false, question: 'Did the runner cause the defender to move, or do we only know both movements were recorded?' },
  { name: 'corrected_evidence', corrected: true, question: 'The defender displacement is corrected from 13 metres to zero. Which claim must be withdrawn and what valid passing facts survive?' }
];
for (const item of cases) {
  const prior = report.rounds.at(-1);
  const parentKey = item.name === 'viewer_challenge' ? prior.events.find(e => e.type === 'conversation')?.data.id : undefined;
  if (item.name === 'viewer_challenge' && !parentKey) throw Error('Opening did not produce a conversation receipt');
  const input = { scenario: 'wide', time: 16, corrected: item.corrected, language: 'en', mode: 'fan', focus: 7, team: 'harbor', question: item.question, ...(parentKey ? { parentKey } : {}) };
  const round = { name: item.name, input, started_at: new Date().toISOString(), events: [] };
  report.rounds.push(round);
  await save();
  try {
    const response = await fetch(`${origin}/api/match-desk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: AbortSignal.timeout(120000) });
    round.http_status = response.status;
    if (!response.ok) throw Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 250)}`);
    let buffer = '';
    const decoder = new TextDecoder();
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n\n')) >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const type = frame.match(/^event: (.+)$/m)?.[1];
        const raw = frame.match(/^data: (.+)$/m)?.[1];
        if (type && raw) {
          round.events.push({ type, data: JSON.parse(raw), at: new Date().toISOString() });
          if (type !== 'draft') await save();
        }
      }
    }
    round.complete = round.events.some(e => e.type === 'complete') && !round.events.some(e => e.type === 'error');
  } catch (error) {
    round.error = error.message;
  }
  round.finished_at = new Date().toISOString();
  await save();
  const posts = round.events.filter(e => e.type === 'post').map(e => e.data);
  console.log(JSON.stringify({ name: item.name, status: round.http_status, complete: round.complete, posts: posts.map(p => ({ role: p.role, engine: p.engine, summary: p.summary })) }));
  if (!round.complete) throw Error(`${item.name} did not complete; partial receipts preserved`);
}
report.allowance_after = (await health()).usage;
report.complete = true;
report.requests_used = report.allowance_after.used - report.allowance_before.used;
await save();
console.log(JSON.stringify({ output, requests_used: report.requests_used, revision: report.release.git_revision }));
