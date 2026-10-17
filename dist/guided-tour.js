import {mountViewerStudy} from './viewer-study.js';
import { createTourClock } from "./tour-clock.js";
import { GUIDE_STEPS, SOURCE_LABELS, guidedSnapshot } from "./guided-model.js";
import {openTruthDemo} from './truth-spotlight.js';
import { createMatchPitch } from "./match-pitch.js";
import { matchSession } from "./match-session.js";
import { SCENARIOS } from "./engine.js";
import { PRESENTER_PROFILES } from "./presenter-profiles.js?v=103";
import { ROLE_LABELS } from "./editorial-roles.js";
import {judgeProof} from './judge-mode-model.js';
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const button = (text, action, cls = "outline-button") => {
  const b = el("button", cls, text);
  b.type = "button";
  b.onclick = action;
  return b;
};
const save = (filename, data) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = el("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
const watch = document.getElementById("watch");
if(['1'].includes(new URLSearchParams(location.search).get('demo'))||new URLSearchParams(location.search).get('judge')==='1')document.body.classList.add('demo-presentation');
let active = false,
  step = 0,
  options = { time: 16, corrected: false, language: "en", mode: "analyst" },
  pack = null,
  playing = false,
  lastFrame = 0;
let judgeRun=judgeProof(),pocketState={connected:false};
let recovery={state:'ready',message:'Interrupt a real editorial worker, preserve its checkpoint, then resume it here.',logs:[]};
const judgeApi=fetch('api-config.json').then(r=>r.json()).then(c=>['127.0.0.1','localhost'].includes(location.hostname)?'':c.baseUrl||'').catch(()=>'');
async function judgeCall(path,body,token){const base=await judgeApi,r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error((await r.json().catch(()=>({}))).error||'Judge proof unavailable');return r;}
async function injectJudgeEvent(){try{const event=await judgeCall('/api/judge-event',{},null).then(r=>r.json());judgeRun={...judgeRun,event:{...judgeRun.event,...event,id:event.evidence_id}};source.textContent='SERVER EVENT RECEIVED · THE UNSEEN RUN';}catch(error){judgeRun={...judgeRun,event:{...judgeRun.event,source:'Local authored fallback · Azure event endpoint unavailable',error:error.message}};source.textContent='LOCAL FALLBACK · THE UNSEEN RUN';}if(active&&step===0)render();}
async function streamRecovery(session){const response=await judgeCall(`/api/production/${session.id}/run`,{},session.token),reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',paused=false;while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});let split;while((split=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,split);buffer=buffer.slice(split+2);const kind=block.split('\n').find(x=>x.startsWith('event:'))?.slice(6).trim();let data={};try{data=JSON.parse(block.split('\n').filter(x=>x.startsWith('data:')).map(x=>x.slice(5)).join(''));}catch{}if(kind==='trace'){recovery.logs=[...recovery.logs,{action:data.action||'tool receipt',status:data.status||data.engine||'saved'}].slice(-8);if(active&&step===3)render();}if(kind==='paused')paused=true;if(kind==='error')throw Error(data.message||'Recovery worker failed');}}return paused;}
async function runJudgeRecovery(){if(recovery.state==='running')return;recovery={state:'running',message:'Creating an interruptible production session…',logs:[]};render();try{const session=await judgeCall('/api/production',{source:'match',scenario:'wide',time:16,corrected:false,focus:7,team:'harbor',language:'en',mode:'analyst',interrupt:true},null).then(r=>r.json());recovery.message='Worker running. Completed receipts are saved before interruption.';render();const paused=await streamRecovery(session);if(!paused)throw Error('The worker completed before the injected interruption');recovery.logs=[...recovery.logs,{action:'worker interrupted',status:'checkpoint preserved'}];recovery.message='Interruption detected. Starting a fresh worker from the saved checkpoint…';render();await streamRecovery(session);const state=await judgeCall(`/api/production/${session.id}/state`,undefined,session.token).then(r=>r.json());recovery={state:'complete',message:'Recovered without hiding the failure. Saved specialist work was reused and the final output passed through the evidence gate.',logs:[...recovery.logs,{action:'fresh worker resumed',status:state.workflow?.status||'complete'},{action:'audit ledger retained',status:`generation ${state.generation}`}].slice(-8)};}catch(error){recovery={...recovery,state:'failed',message:error.message+' The deterministic correction remains available.'};}render();document.dispatchEvent(new Event('btr-ai-finished'));}
document.addEventListener('btr-pocket-status',event=>{pocketState=event.detail||{connected:false};if(active&&step===4)render();});
const tourClock = createTourClock();
const launcher = el("section", "guided-launch"),
  intro = el("div");
intro.append(
  el("span", "eyebrow", "JUDGE MODE / THE DEFINING BTR MOMENT"),
  el("strong", "", "One event. Five specialists. One correction every screen can trust."),
  el(
    "p",
    "",
    "Inject a new synthetic observation, watch the crew challenge it, revise the evidence and publish the corrected explanation.",
  ),
);
const open = button("Run the defining moment →", () => enter(), "red-button"),
  filmButton = button("Watch the 60-second film", () => leave("pitchside"));
launcher.append(intro, open, filmButton);
launcher.append(button('Change the evidence →',()=>{leave('match');openTruthDemo();}));
watch.prepend(launcher);
const tour = el("section", "guided-tour");
tour.id = "guided-match";
tour.hidden = true;
tour.setAttribute("aria-label", "Guided match demonstration");
launcher.after(tour);
const top = el("div", "guided-top"),
  badge = el("b", "", "LIVE SESSION PROOF · NO AI REQUESTS"),
  source = el("span", "", "NEW SESSION EVENT · THE UNSEEN RUN"),
  auto = button("Play the 60-second judge cut", () => {
    const state = tourClock.read();
    playing = false;
    if (state.status === "running") tourClock.pause();
    else if (state.status === "paused") tourClock.resume();
    else tourClock.start();
    tickTour();
    render();
  }),
  exit = button("Explore the app ↗", () => leave("match"));
top.append(badge, source, auto, exit);
tour.append(top);
const progress = el("output", "tour-progress", "Ready · 0 / 60 seconds");
progress.setAttribute("aria-label", "Tour progress");
tour.append(progress);
function renderTourProgress() {
  const t = tourClock.read();
  auto.textContent = {
    running: "Pause tour",
    paused: "Resume tour",
    complete: "Replay the 60-second judge cut",
    idle: "Play the 60-second judge cut",
  }[t.status];
  progress.dataset.status = t.status;
  progress.textContent =
    {
      running: "Playing",
      paused: "Paused · press Resume tour to continue",
      complete: "Tour complete",
      idle: "Ready",
    }[t.status] +
    " · " +
    Math.floor(t.seconds) +
    " / 60 seconds";
}
const topFilm = button("Watch the film", () => leave("pitchside"));
top.insertBefore(topFilm, exit);
const steps = el("nav", "guided-steps");
steps.setAttribute("aria-label", "Guided match stages");
for (const [index, s] of GUIDE_STEPS.entries())
  steps.append(
    button(
      `${index + 1} · ${s.label}`,
      () => {
        stopTour();
        setStep(index);
      },
      "",
    ),
  );
tour.append(steps);
const grid = el("div", "guided-grid"),
  screen = el("section", "guided-screen"),
  score = el("div", "guided-score");
score.append(
  el("b", "", "HARBOR"),
  el("strong", "", "0 : 0"),
  el("b", "", "NORTHBRIDGE"),
);
const clock = el("span", "", "67:16 · R1");
score.append(clock);
screen.append(score);
const pitchNode = el("div", "guided-pitch");
screen.append(pitchNode);
const pitch = createMatchPitch(pitchNode, () => {});
const caption = el("div", "guided-caption"),
  captionMeta = el("small", "", "ON SCREEN · SYNTHETIC EVIDENCE"),
  captionTitle = el("h3"),
  captionCopy = el("p");
caption.append(captionMeta, captionTitle, captionCopy);
screen.append(caption);
const controls = el("div", "guided-controls"),
  play = button("▶ Replay the play", () => {
    stopTour();
    playing = !playing;
    if (playing && options.time >= 16) options.time = 0;
    lastFrame = 0;
    render();
  }),
  scrub = el("input");
scrub.type = "range";
scrub.min = "0";
scrub.max = "16";
scrub.step = ".1";
scrub.value = "16";
scrub.setAttribute("aria-label", "Guided match time");
scrub.oninput = () => {
  stopTour();
  playing = false;
  options.time = Number(scrub.value);
  render();
};
controls.append(play, scrub);
screen.append(controls);
grid.append(screen);
const copy = el("article", "guided-copy"),
  kicker = el("span", "eyebrow"),
  heading = el("h2"),
  description = el("p"),
  content = el("div", "guided-content");
heading.tabIndex = -1;
copy.append(kicker, heading, description, content);
grid.append(copy);
tour.append(grid);
const nextRow = el("div", "guided-next"),
  stateLabel = el("span", "guided-note"),
  back = button("← Back", () => {
    stopTour();
    setStep(step - 1);
  }),
  next = button(
    "Next →",
    () => {
      stopTour();
      if (step === 4) leave("match");
      else setStep(step + 1);
    },
    "red-button",
  );
nextRow.append(back, stateLabel, next);
copy.append(nextRow);
const provenance = el("p", "guided-source");
tour.append(provenance);
function openLiveDiscussion(){
  leave('match');
  document.getElementById('watch-nav').click();
  matchSession.set({scenario:'wide'},'live-demo');
  matchSession.set({source:'match',time:16,corrected:false,language:'en',mode:'analyst',focus:7,team:'harbor'},'live-demo');
  document.dispatchEvent(new Event('btr-open-live-discussion'));
}
const downloadRow = el("div", "guided-downloads");
downloadRow.append(
  button("Try the live two-round discussion →", openLiveDiscussion),
  button("Download story + evidence ↓", () =>
    save("btr-guided-story.json", guidedSnapshot(options, pack).export),
  ),
  button("Compare agent results ↗", () => {
    leave("match");
    document.getElementById("inside-nav").click();
    document.dispatchEvent(new Event("btr-open-evidence"));
  }),
);
tour.append(downloadRow);
tour.append(el('p','guided-note','Live discussion: ask for the opening reading, then choose “Did the run cause it?” to challenge the crew. Each fresh synthetic round uses four sequential AI requests—Scout, Guide, Check and Host—while Vector calculates in code. Public wording remains source-rendered. Opening this view makes no AI request.'));
const map = el("details", "source-map");
const sourceSummary=el("summary"); map.append(sourceSummary); matchSession.subscribe(state=>{const label=SOURCE_LABELS[state.section==='lab'?'lab':state.source];sourceSummary.textContent=label.title+" · source & scope";}); sourceSummary.textContent=SOURCE_LABELS[matchSession.get().source].title+" · source & scope";
for (const entry of Object.values(SOURCE_LABELS)) {
  const row = el("article");
  row.append(el("strong", "", entry.title), el("p", "", entry.scope));
  map.append(row);
}
document.querySelector(".watch-source-bar").after(map);
const proof = el("details", "judge-evidence");
proof.append(el("summary", "", "Evaluation, source code and judging evidence"));
proof.id = "judge-evidence";
proof.setAttribute("aria-label", "Measured agent evaluation");
proof.append(
  el("h2", "", "The evidence behind the experience"),
  el(
    "p",
    "",
    "The guided match always works with reviewed notes and calculated facts. Saved model contributions, when available, are labeled with their recording date. Live generation remains a separate action.",
  ),
);
const evaluation = el("div");
evaluation.append(
  el(
    "p",
    "",
    "Evaluation results are loading. The downloadable verification summary remains available.",
  ),
);
proof.append(evaluation);
const links = el("p");
for (const [href, label] of [
  ["assets/btr-agent-evaluation.json", "Published v42.2 comparison + raw contributions"],
  ["assets/btr-evaluation-plan-v44.json", "v44 paired conversation comparison · plan, not results"],
  ["assets/btr-agent-evaluation-v41.json", "Earlier comparison (v41)"],
  ["assets/btr-agent-evaluation-v42-first.json", "First v42 attempt · incomplete"],
  ["assets/btr-agent-evaluation-v42-interrupted.json", "Interrupted v42 attempt · run notes"],
  ["assets/btr-recovery-v42.json", "v42 recovery receipt · editorial flaw disclosed"],
  ["assets/btr-verification-summary.json", "Recovery verification"],
  ["assets/btr-recording-guide.txt", "105-second demonstration script"],
]) {
  const a = el("a", "", label);
  a.href = href;
  a.download = "";
  links.append(a, document.createTextNode(" · "));
}
proof.append(links);
document.querySelector("#inside .extension-heading").after(proof);
const walkthrough = el(
  "a",
  "proof-output",
  "Watch the earlier 105-second app demo ↗",
);
walkthrough.href = "assets/btr-app-demo-v43.mp4";
walkthrough.target = "_blank";
walkthrough.rel = "noopener";
proof.append(
  walkthrough,
  el(
    "p",
    "guided-note",
    "Earlier demonstration: edited screen captures using saved v42 contributions. It does not demonstrate the current follow-up behavior. The current source-composition demonstration is available in Inside BTR. The v44 study remains historical and incomplete. No continuous recording or audio is claimed.",
  ),
);
const repository = el("a", "proof-output", "Inspect the public source on GitHub ↗");
repository.href = "https://github.com/sagitta414/before-the-roar";
repository.target = "_blank";
repository.rel = "noopener";
proof.append(repository);
proof.append(button('Try the current live conversation →',openLiveDiscussion));
const studyLink=el('a','proof-output','Take the five-minute viewer study ↗');studyLink.href='study.html';proof.append(studyLink);
function stopTour() {
  tourClock.reset();
  renderTourProgress();
}
function sync() {
  matchSession.set(
    { ...options, source: "match", scenario: "wide", focus: 7, team: "harbor" },
    "guided",
  );
}
function enter() {
  document.getElementById("film").pause();
  active = true;
  const startedAt=Date.now();
  judgeRun=judgeProof({runId:`judge-${startedAt.toString(36)}`,startedAt});
  recovery={state:'ready',message:'Interrupt a real editorial worker, preserve its checkpoint, then resume it here.',logs:[]};
  document.body.classList.add("guided-active");
  tour.hidden = false;
  open.textContent = "Restart defining moment ↺";
  document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: true }));
  matchSession.set({ scenario: "wide", source: "match" }, "guided");
  options.time = 16;
  step = 0;
  options.corrected = false;
  document.dispatchEvent(new CustomEvent('btr-judge-publish',{detail:{stage:'ingest',revision:1,runId:judgeRun.run_id}}));
  injectJudgeEvent();
  render();
}
function leave(source) {
  stopTour();
  playing = false;
  active = false;
  tour.hidden = true;
  document.body.classList.remove("guided-active");
  open.textContent = "Run the defining moment →";
  document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: false }));
  matchSession.set({ source }, "guided-exit");
  try {
    sessionStorage.setItem("btr-guided-dismissed", "1");
  } catch {}
}
function setStep(index) {
  step = Math.max(0, Math.min(4, index));
  playing = false;
  options.time = 16;
  render();
  heading.focus({ preventScroll: true });
}
function renderPitch(snapshot) {
  pitch.update(SCENARIOS[0], snapshot.story.brief.state, 7, options.corrected);
  clock.textContent = snapshot.story.clock + " · R" + snapshot.story.revision;
  scrub.value = String(options.time);
  captionTitle.textContent = snapshot.story.title;
  captionCopy.textContent = snapshot.story.body;
  captionMeta.textContent = `ON SCREEN · R${snapshot.story.revision} · ${options.language.toUpperCase()} · ${snapshot.story.words[options.mode]}`;
  play.textContent = playing ? "❚❚ Pause" : "▶ Replay the play";
}
function render() {
  if (!active) return;
  sync();
  const snapshot = guidedSnapshot(options, pack);
  renderPitch(snapshot);
  const s = GUIDE_STEPS[step];
  kicker.textContent = `${String(step + 1).padStart(2, "0")} / ${s.label.toUpperCase()}`;
  heading.textContent = s.title;
  description.textContent = s.copy;
  renderTourProgress();
  for (const [i, b] of [...steps.children].entries()) {
    if (i === step) b.setAttribute("aria-current", "step");
    else b.removeAttribute("aria-current");
  }
  back.disabled = step === 0;
  next.textContent =
    step === 4 ? "Continue exploring →" : `Next: ${GUIDE_STEPS[step + 1].label} →`;
  stateLabel.textContent = `${step + 1} of 5 · ${snapshot.story.clock} · Source R${snapshot.story.revision}`;
  provenance.textContent = snapshot.saved
    ? `Saved Azure run · ${new Date(snapshot.recordedAt).toLocaleDateString()} · Replayed instantly, with no new AI generation. Each contribution identifies its engine.`
    : "Reviewed demonstration · authored explanations and calculations run in your browser. No fresh AI generation or model requests. Live AI is available in Watch and the production desk.";
  content.replaceChildren();
  if (step === 0) {
    if (options.time < 16)
      description.textContent =
        "Follow the ball, winger and defender as the recorded play arrives. The caption uses only evidence through the current playhead.";
    const receipt=el('div','judge-ingest');
    receipt.append(el('span','','● EVENT RECEIVED'),el('strong','',judgeRun.event.envelope_id||judgeRun.event.id),el('code','',new Date(judgeRun.event.received_at).toISOString()),el('small','',judgeRun.event.source+' · evidence '+judgeRun.event.id+' · '+judgeRun.event.match_clock+' · SOURCE R1'));
    const fact = el("div", "guided-verdict");
    fact.append(
      el("strong", "", "WATCH THE WIDE CHANNEL"),
      el(
        "span",
        "",
        options.time < 16
          ? "Follow the space beside the winger. Wait for the reached tracking samples before drawing a conclusion about the defender’s movement."
          : "The winger moves toward the touchline as the defender shifts toward the same side. The timing suggests a tactical relationship; it does not establish why the defender moved.",
      ),
    );
    content.append(
      receipt,fact,
      el(
        "p",
        "guided-note",
        "This event is newly injected into this browser session. It is authored synthetic data, not a claim of a live stadium feed.",
      ),
    );
  } else if (step === 1) {
    const ids={Scout:'analyst',Guide:'guide',Vector:'math',Check:'reviewer',Host:'presenter'};
    for (const p of judgeRun.handoffs.slice(0,5)) {
      const profile = PRESENTER_PROFILES.find((r) => r.id === ids[p.role]),
        row = el("article", "guided-role"),
        img = el("img");
      img.src = `assets/${profile.image}-portrait.webp`;
      img.alt = "";
      const text = el("div"),
        meta = el("div");
      meta.append(
        el("b", "", profile.name + " / " + p.action),
        el(
          "small",
          "",
          p.role==='Vector'?'CALCULATED':p.role==='Check'?'EVIDENCE GATE':'SOURCE-BOUND',
        ),
      );
      text.append(meta, el("p", "", p.summary));
      const detail = el("details");
      detail.append(
        el("summary", "", "Evidence + limits"),
        el("code", "", p.evidence.join(" · ")),
      );
      if(p.role==='Check')detail.append(el('p','guided-disagreement','CHALLENGE ACCEPTED · Host must preserve this limit.'));
      text.append(detail);
      row.append(img, text);
      content.append(row);
    }
  } else if (step === 2) {
    const metric = snapshot.story.analysis.calculations[0],
      card = el("div", "guided-metric"),
      text = el("div");
    text.append(el("b", "", metric.label), el("p", "", metric.text));
    card.append(el("strong", "", metric.value), text);
    content.append(card);
    const details = el("details");
    details.open = true;
    details.append(
      el("summary", "", "Recalculate from the recorded passes"),
      el("code", "", metric.equation),
    );
    for (const e of snapshot.story.analysis.passes)
      details.append(
        el(
          "p",
          "guided-note",
          `${e.id}: x ${e.start[0].toFixed(2)} → ${e.endPosition[0].toFixed(2)} m · completed`,
        ),
      );
    content.append(
      details,
      el(
        "p",
        "guided-note",
        "Football meaning: the passes advance the ball toward goal. This is one short sequence, not a team average or a measure of chance quality.",
      ),
    );
  } else if (step === 3) {
    const verdict = el("div", "guided-verdict");
    verdict.dataset.corrected = String(options.corrected);
    verdict.append(
      el("strong", "", options.corrected ? "WITHDRAWN · R2" : "QUALIFIED · R1"),
      el("span", "", snapshot.story.review.reason),
    );
    const comparison=el('div','judge-comparison');
    for(const [label,item] of [['ORIGINAL · R1',judgeRun.original],['CORRECTED · R2',judgeRun.corrected]]){const card=el('article');card.append(el('small','',label),el('strong','',item.measurement),el('p','',item.narrative),el('code','',item.evidence_id));comparison.append(card);}
    const consequences=el('div','judge-consequences');
    for(const [ok,label] of [[judgeRun.outcomes.calculation_updated,'CALCULATION UPDATED'],[judgeRun.outcomes.claim_withdrawn,'CLAIM WITHDRAWN'],[judgeRun.outcomes.narrative_changed,'NARRATIVE CHANGED'],[judgeRun.outcomes.unaffected_facts_preserved,'2 PASSES PRESERVED']])consequences.append(el('span',ok?'pass':'fail',(ok?'✓ ':'× ')+label));
    const coverage=el('details','judge-coverage');coverage.append(el('summary','','What else the evidence gate handles'));for(const item of judgeRun.coverage){const row=el('p');row.append(el('b','',item.label),document.createTextNode(' · '+item.result),el('small','',item.status.toUpperCase()));coverage.append(row);}
    const recoveryPanel=el('section','judge-recovery');recoveryPanel.dataset.state=recovery.state;recoveryPanel.append(el('small','','FAILURE RECOVERY / LIVE AZURE PROOF'),el('h3','',recovery.state==='complete'?'INTERRUPTED. SAVED. RECOVERED.':'SHOW THE FAILURE. KEEP THE PROOF.'),el('p','',recovery.message));if(recovery.logs.length){const log=el('ol');for(const item of recovery.logs){const li=el('li');li.append(el('span','',item.action),el('b','',item.status));log.append(li);}recoveryPanel.append(log);}recoveryPanel.append(button(recovery.state==='running'?'Recovery running…':recovery.state==='complete'?'Run another recovery rehearsal':'Run live interruption + recovery',runJudgeRecovery,recovery.state==='complete'?'outline-button':'red-button'));recoveryPanel.querySelector('button').disabled=recovery.state==='running';
    content.append(
      comparison,consequences,coverage,verdict,
      button(
        options.corrected ? "Restore original record" : "Apply corrected tracking",
        () => {
          options.corrected = !options.corrected;
          document.dispatchEvent(new CustomEvent('btr-judge-publish',{detail:{stage:'correction',revision:options.corrected?2:1,runId:judgeRun.run_id}}));
          render();
        },
        "red-button",
      ),
      el(
        "p",
        "guided-note",
        `${snapshot.story.stats} The pass records do not change. The caption and defender position update together.`,
      ),
      recoveryPanel,
    );
  } else {
    const preferences = el("div", "guided-preferences");
    for (const [key, title, items] of [
      [
        "mode",
        "YOUR PERSPECTIVE",
        [
          ["beginner", "New to football"],
          ["math", "Show the math"],
          ["analyst", "Tactical view"],
        ],
      ],
      [
        "language",
        "YOUR LANGUAGE",
        [
          ["en", "English"],
          ["es", "Español"],
          ["pt", "Português"],
        ],
      ],
    ]) {
      const label = el("label", "", title),
        select = el("select");
      select.setAttribute("aria-label", "Guided " + title.toLowerCase());
      for (const [value, text] of items) {
        const opt = el("option", "", text);
        opt.value = value;
        select.append(opt);
      }
      select.value = options[key];
      select.onchange = () => {
        stopTour();
        options[key] = select.value;
        render();
      };
      label.append(select);
      preferences.append(label);
    }
    const delivery=el('div','judge-delivery');
    delivery.append(el('article','',`WATCH PARTY\nR${snapshot.story.revision} · ${snapshot.story.clock}\nREADY NOW`),el('article','',pocketState.connected?`POCKET DIRECTOR\nSYNCED · R${pocketState.revision||snapshot.story.revision}\nROOM ${String(pocketState.room||'').slice(0,6).toUpperCase()}`:'POCKET DIRECTOR\nPAIR A PHONE TO PROVE LIVE SYNC\nREAD-ONLY LINK · AUTO UPDATE'));
    const publish=button('Publish corrected story to both screens →',()=>{options.corrected=true;sync();document.dispatchEvent(new CustomEvent('btr-judge-publish',{detail:{stage:'publish',revision:2,runId:judgeRun.run_id}}));render();},'red-button');
    content.append(
      delivery,publish,
      preferences,
      el(
        "p",
        "guided-note",
        "These captions are localized from the same evidence. Changing a language or perspective never changes the facts.",
      ),
    );
    mountViewerStudy(content,save);
  }
}
// Timed stages must advance even when the browser suspends animation frames.
function tickTour() {
  if (!active) return;
  const t = tourClock.read();
  if (!["running", "complete"].includes(t.status)) return;
  const changed =
    step !== t.step ||
    options.corrected !== t.corrected ||
    options.mode !== t.mode ||
    options.language !== t.language;
  step = t.step;
  options = {
    ...options,
    time: t.time,
    corrected: t.corrected,
    mode: t.mode,
    language: t.language,
  };
  if (changed) render();
  else {
    sync();
    renderPitch(guidedSnapshot(options, pack));
  }
  renderTourProgress();
}
const tourTimer = window.setInterval(() => {
  if (
    ["running", "complete"].includes(tourClock.read().status) &&
    progress.dataset.status !== "complete"
  )
    tickTour();
}, 250);
window.addEventListener("pagehide", () => window.clearInterval(tourTimer), {
  once: true,
});
let lastPaint = 0;
function frame(now) {
  if (active && playing) {
    if (lastFrame) options.time = Math.min(16, options.time + (now - lastFrame) / 1000);
    if (options.time >= 16) {
      playing = false;
      render();
    }
    if (now - lastPaint > 100) {
      lastPaint = now;
      sync();
      renderPitch(guidedSnapshot(options, pack));
    }
    lastFrame = now;
  } else lastFrame = 0;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    tourClock.pause();
    playing = false;
    renderTourProgress();
  }
});
document.addEventListener("btr-section", (e) => {
  if (e.detail !== "watch") {
    stopTour();
    playing = false;
    active = false;
    tour.hidden = true;
    document.body.classList.remove("guided-active");
    open.textContent = "Explore the guided match →";
    document.dispatchEvent(new CustomEvent("btr-guided-activity", { detail: false }));
  }
});
document.addEventListener("btr-open-guided", () => {
  document.getElementById("watch-nav").click();
  enter();
});
fetch("assets/commentary-comparison.json")
  .then((r) => {
    if (!r.ok) throw Error("No measured evaluation yet");
    return r.json();
  })
  .then((data) => {
    pack = data;
    evaluation.replaceChildren();
    if(data.version?.includes('bounded-regression')){
      const rows=data.cases||[],teamCalls=rows.reduce((sum,row)=>sum+(row.crew?.calls?.length||0),0),baselineCalls=rows.reduce((sum,row)=>sum+(row.baseline?.calls?.length||0),0),teamCitations=rows.reduce((sum,row)=>sum+(row.crew?.valid_citations||0),0),baselineCitations=rows.reduce((sum,row)=>sum+(row.baseline?.valid_citations||0),0);
      const current=el('div','current-quality-proof');
      current.innerHTML=`<div><span>CURRENT BOUNDED REGRESSION</span><strong>${rows.length} FIXED CASES</strong><small>Same evidence catalog · no retries</small></div><div><span>GROUNDING</span><strong>${teamCitations}/${rows.length*3} · ${baselineCitations}/${rows.length*3}</strong><small>Crew · single-call baseline</small></div><div><span>MODEL REQUESTS</span><strong>${teamCalls} · ${baselineCalls}</strong><small>Crew · single-call baseline</small></div><div><span>HUMAN PREFERENCE</span><strong>NOT MEASURED</strong><small>No superiority claim</small></div>`;
      evaluation.append(el('p','',`${data.method}`),current,el('p','guided-note','Both approaches stayed inside the verified wording catalog. The multi-agent design earns its place through visible role boundaries, disagreement, checkpoint recovery and per-stage receipts—not a claim that additional calls automatically improve prose.'));
      if(active)render();
      return;
    }
    const table = el("table");
    const head = el("tr");
    for (const t of ["Measured check", "Agent team", "Single model"])
      head.append(el("th", "", t));
    table.append(head);
    for (const [label, key] of [
      ["Accepted editorial outputs", "accepted"],
      ["Guard-rejected outputs", "rejected"],
      ["Model requests", "requests"],
      ["Wall time (seconds)", "seconds"],
    ]) {
      const row = el("tr");
      row.append(el("th", "", label));
      for (const arm of ["team", "baseline"])
        row.append(el("td", "", String(data.summary?.[arm]?.[key] ?? "Not measured")));
      table.append(row);
    }
    evaluation.append(
      el(
        "p",
        "",
        `${data.policy || 'Archived policy'} · ${data.cases.length} fixed cases · ${data.model} · recorded ${new Date(data.recorded_at).toLocaleString()}`,
      ),
      table,
      el("p", "", data.conclusion),
      el(
        "p",
        "guided-note",
        "These are older-policy guard checks, not a measurement of the current conversation. A preregistered v44 comparison covers eleven opening pairs plus one paired follow-up, up to sixty model requests. Execution and blind human ratings are pending. Guard acceptance does not establish semantic accuracy, superiority or audience satisfaction.",
      ),
    );
    if (active) render();
  })
  .catch(() => {
    evaluation.replaceChildren(
      el(
        "p",
        "",
        "No completed live comparison is published yet. The evaluation harness and its fixed cases are available in the project source. No superiority claim is made.",
      ),
    );
  });
let dismissed = false;
try {
  dismissed = sessionStorage.getItem("btr-guided-dismissed") === "1";
} catch {}
if (
  new URLSearchParams(location.search).has("tour") || new URLSearchParams(location.search).get('judge')==='1' ||
  (!dismissed && (!location.hash || location.hash === "#watch"))
)
  enter();
fetch("media-availability.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((media) => {
    if (media?.pitchside !== false) return;
    for (const b of [filmButton, topFilm]) {
      b.disabled = true;
      b.textContent = "Optional film not included";
    }
    document.querySelector('#watch-source option[value="pitchside"]').disabled = true;
    document.querySelector(".source-details a")?.setAttribute("hidden", "");
    if (matchSession.get().source === "pitchside") matchSession.set({ source: "match" });
  })
  .catch(() => {});
