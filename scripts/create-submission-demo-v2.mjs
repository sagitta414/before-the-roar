import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require(process.env.BTR_SHARP_PATH || "C:/Users/Jeffl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const root = path.resolve(import.meta.dirname, "..");
const work = path.join(root, "tmp", "submission-demo-v2");
const demo = path.join(root, "demo");
const capture = path.join(root, "tmp", "live-demo-capture");
const output = path.join(demo, "before-the-roar-judge-demo-v2.mp4");
await mkdir(work, { recursive: true });
await mkdir(demo, { recursive: true });

const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
});

const shell = ({ kicker, title, subtitle = "", accent = "#ff315d", body = "" }) => Buffer.from(`
<svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
 <defs><radialGradient id="g"><stop stop-color="#172739"/><stop offset="1" stop-color="#05080d"/></radialGradient><filter id="s"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-opacity=".7"/></filter></defs>
 <rect width="1920" height="1080" fill="url(#g)"/><rect width="1920" height="7" fill="${accent}"/>
 <path d="M0 116H1920M0 1000H1920" stroke="#263545" stroke-width="2"/><path d="M1540 0L1920 380" stroke="${accent}" stroke-width="4" opacity=".5"/>
 <text x="72" y="76" fill="#fff" font-family="Arial" font-style="italic" font-weight="900" font-size="44">BTR›</text>
 <text x="215" y="46" fill="#f4f7fa" font-family="Arial" font-weight="800" font-size="13" letter-spacing="5">BEFORE THE ROAR</text>
 <text x="215" y="75" fill="#91a4b8" font-family="Arial" font-weight="700" font-size="13" letter-spacing="3">${esc(kicker.toUpperCase())}</text>
 <text x="72" y="166" fill="#fff" font-family="Arial" font-weight="900" font-size="58">${esc(title)}</text>
 <text x="74" y="211" fill="#aebccd" font-family="Arial" font-size="24">${esc(subtitle)}</text>
 ${body}
</svg>`);

async function appFrame(name, source, meta) {
  const shot = await sharp(source).resize(1760, 790, { fit: "contain", background: "#071019" }).jpeg({ quality: 95 }).toBuffer();
  const base = shell({ ...meta, body: `<rect x="72" y="238" width="1776" height="790" rx="12" fill="#09111a" stroke="#344557" stroke-width="2" filter="url(#s)"/><rect x="72" y="238" width="8" height="790" fill="${meta.accent || "#ff315d"}"/>` });
  const out = path.join(work, name);
  await sharp(base).composite([{ input: shot, left: 80, top: 238 }]).png().toFile(out);
  return out;
}

async function compareFrame(name) {
  const [before, after] = await Promise.all([
    sharp(path.join(capture, "correction-before.jpg")).resize(830, 650, { fit: "cover", position: "top" }).jpeg({ quality: 94 }).toBuffer(),
    sharp(path.join(capture, "correction-after.jpg")).resize(830, 650, { fit: "cover", position: "top" }).jpeg({ quality: 94 }).toBuffer(),
  ]);
  const base = shell({ kicker: "TRUTH LAB / CONTROLLED COUNTERFACTUAL", title: "Change one record. Force three corrections.", subtitle: "The pass calculation survives. The movement claim does not.", body: `
    <rect x="76" y="260" width="830" height="650" rx="10" fill="#0b131d" stroke="#455467" stroke-width="2"/><rect x="1014" y="260" width="830" height="650" rx="10" fill="#0b131d" stroke="#ff315d" stroke-width="3"/>
    <rect x="76" y="920" width="830" height="70" fill="#111c28"/><text x="104" y="964" fill="#fff" font-family="Arial" font-weight="800" font-size="25">ORIGINAL · 13.0 m · CLAIM QUALIFIED</text>
    <rect x="1014" y="920" width="830" height="70" fill="#26101a"/><text x="1042" y="964" fill="#fff" font-family="Arial" font-weight="800" font-size="25">CORRECTED · 0.0 m · CLAIM WITHDRAWN</text>` });
  const out = path.join(work, name);
  await sharp(base).composite([{ input: before, left: 76, top: 260 }, { input: after, left: 1014, top: 260 }]).png().toFile(out);
  return out;
}

async function proofCard(name) {
  const body = `
   <rect x="88" y="276" width="1744" height="642" rx="14" fill="#09121c" stroke="#34485c" stroke-width="2"/>
   <text x="132" y="342" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="19" letter-spacing="4">LIVE · FOUR AZURE REQUESTS COMPLETED</text>
   ${[["01","SCOUT","AZURE MODEL","0.95 s"],["02","GUIDE","AZURE MODEL","0.80 s"],["03","VECTOR","DETERMINISTIC","0 model calls"],["04","CHECK","AZURE MODEL","0.65 s"],["05","HOST","AZURE MODEL","0.64 s"]].map((r,i)=>`<rect x="132" y="${380+i*94}" width="1656" height="76" rx="7" fill="${i===2?'#101d18':'#101924'}" stroke="${i===2?'#5b8042':'#293b4e'}"/><text x="156" y="${427+i*94}" fill="#91a4b8" font-family="Arial" font-weight="800" font-size="18">${r[0]}</text><text x="226" y="${427+i*94}" fill="#fff" font-family="Arial" font-weight="900" font-size="24">${r[1]}</text><text x="520" y="${427+i*94}" fill="${i===2?'#b6ff2f':'#ff5b7b'}" font-family="Arial" font-weight="800" font-size="18">${r[2]}</text><text x="1738" y="${427+i*94}" text-anchor="end" fill="#cbd5df" font-family="Arial" font-size="20">${r[3]}</text>`).join("")}
   <text x="132" y="890" fill="#9eb0c3" font-family="Arial" font-size="20">Response IDs, evidence IDs, handoffs and sources remain inspectable in the live AI desk.</text>`;
  const out = path.join(work, name);
  await sharp(shell({ kicker:"INSIDE THE AI DESK", title:"Execution state you can verify.", subtitle:"Fresh public run · delivered in 3.2 seconds", body })).png().toFile(out);
  return out;
}

async function foundryCard(name) {
  const body = `
   <rect x="90" y="282" width="1060" height="610" rx="14" fill="#0b141e" stroke="#34485c" stroke-width="2"/>
   <text x="136" y="348" fill="#ff5575" font-family="Arial" font-weight="800" font-size="19" letter-spacing="4">RECORDED FOUNDRY EVIDENCE COURT</text>
   <text x="136" y="470" fill="#fff" font-family="Arial" font-weight="900" font-size="112">46</text><text x="330" y="470" fill="#647589" font-family="Arial" font-size="54">vs</text><text x="446" y="470" fill="#fff" font-family="Arial" font-weight="900" font-size="112">45</text>
   <text x="140" y="518" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="20">CREW</text><text x="454" y="518" fill="#9fb0c3" font-family="Arial" font-weight="800" font-size="20">SINGLE-MODEL BASELINE</text>
   <text x="136" y="616" fill="#fff" font-family="Arial" font-weight="800" font-size="28">Six preregistered synthetic cases</text>
   <text x="136" y="666" fill="#aebccd" font-family="Arial" font-size="22">Two blinded evaluator passes · reversed A/B order</text>
   <text x="136" y="712" fill="#aebccd" font-family="Arial" font-size="22">Grounding +2 · decision usefulness +2 · overall +1</text>
   <rect x="1200" y="282" width="632" height="610" rx="14" fill="#23131b" stroke="#ff315d" stroke-width="2"/>
   <text x="1246" y="354" fill="#ff6c88" font-family="Arial" font-weight="800" font-size="18" letter-spacing="3">EVIDENCE LIMIT</text>
   <text x="1246" y="438" fill="#fff" font-family="Arial" font-weight="800" font-size="31">A narrow model-scored result.</text>
   <text x="1246" y="496" fill="#c3ced9" font-family="Arial" font-size="23">It is not an independent human study</text><text x="1246" y="532" fill="#c3ced9" font-family="Arial" font-size="23">or proof across all commentary.</text>
   <text x="1246" y="626" fill="#fff" font-family="Arial" font-weight="800" font-size="27">Human blind review:</text><text x="1246" y="670" fill="#ffd166" font-family="Arial" font-weight="900" font-size="28">OPEN · RESULTS PENDING</text>
   <text x="1246" y="766" fill="#aebccd" font-family="Arial" font-size="21">The product shows the caveat</text><text x="1246" y="799" fill="#aebccd" font-family="Arial" font-size="21">beside the score.</text>`;
  const out = path.join(work, name);
  await sharp(shell({ kicker:"MICROSOFT FOUNDRY", title:"Measure the claim. Publish the limit.", subtitle:"Evaluation is evidence, not decoration.", body })).png().toFile(out);
  return out;
}

async function phoneFrame(name) {
  const phone = await sharp(path.join(capture, "mobile-current.jpg")).resize({ height: 780 }).jpeg({ quality: 95 }).toBuffer();
  const body = `<text x="94" y="330" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="20" letter-spacing="4">REVISION R2 · SYNCED LIVE</text><text x="94" y="410" fill="#fff" font-family="Arial" font-weight="900" font-size="49">The correction reaches</text><text x="94" y="470" fill="#fff" font-family="Arial" font-weight="900" font-size="49">every fan at once.</text><text x="94" y="552" fill="#afbdcc" font-family="Arial" font-size="27">New to football · Show the math</text><text x="94" y="592" fill="#afbdcc" font-family="Arial" font-size="27">Tactical view · Player focus</text><rect x="94" y="682" width="810" height="170" rx="10" fill="#101925" stroke="#34485c" stroke-width="2"/><text x="132" y="742" fill="#ff5575" font-family="Arial" font-weight="800" font-size="18" letter-spacing="3">CURRENT AUDIENCE STORY</text><text x="132" y="800" fill="#fff" font-family="Arial" font-weight="800" font-size="28">Movement claim withdrawn.</text><text x="132" y="837" fill="#aebccd" font-family="Arial" font-size="21">Pass evidence retained.</text><rect x="1265" y="246" width="472" height="812" rx="52" fill="#020407" stroke="#53657a" stroke-width="5"/>`;
  const out = path.join(work, name);
  await sharp(shell({ kicker:"POCKET DIRECTOR", title:"One truth. Four ways to understand it.", subtitle:"The live match stays visible while the explanation adapts.", body })).composite([{input:phone,left:1306,top:270}]).png().toFile(out);
  return out;
}

const frames = {
  title: await sharp(shell({ kicker:"INSIDE THE GAME", title:"Did the run create the space?", subtitle:"One live football moment. Five specialists. A story forced to prove itself.", body:`<text x="76" y="410" fill="#fff" font-family="Arial" font-weight="900" font-size="92">WATCH. QUESTION. CORRECT.</text><rect x="76" y="482" width="860" height="7" fill="#ff315d"/><text x="76" y="552" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="22" letter-spacing="4">SYNTHETIC FOOTBALL · EXPLAINABLE AI · MICROSOFT AZURE</text>` })).png().toFile(path.join(work,"00-title.png")).then(()=>path.join(work,"00-title.png")),
  inject: await appFrame("01-inject.png", path.join(root,"tmp","demo-r111-stage-1.jpg"), {kicker:"LIVE SYNTHETIC EVENT",title:"A run. A shift. A central passing route.",subtitle:"The apparent explanation enters BTR as a claim to test."}),
  running: await appFrame("02-running.png", path.join(capture,"frame-004.jpg"), {kicker:"FRESH PUBLIC EXECUTION",title:"Four model specialists run in sequence.",subtitle:"Scout → Guide → Check → Host · Vector calculates in code",accent:"#b6ff2f"}),
  receipts: await appFrame("03-receipts.png", path.join(capture,"live-receipts.jpg"), {kicker:"LIVE AI DESK",title:"The handoffs leave receipts.",subtitle:"Request IDs · evidence IDs · latency · delivery state",accent:"#b6ff2f"}),
  proof: await proofCard("04-proof-card.png"),
  compare: await compareFrame("05-compare.png"),
  watch: await appFrame("06-watch.png", path.join(capture,"corrected-watch.jpg"), {kicker:"CORRECTED BROADCAST",title:"Publish what survives.",subtitle:"The live action remains the star; the explanation changes around it."}),
  phone: await phoneFrame("07-phone.png"),
  foundry: await foundryCard("08-foundry.png"),
  secure: await appFrame("09-secure.png", path.join(root,"tmp","demo-r111-secure.jpg"), {kicker:"AZURE PRODUCTION PATH",title:"Built to survive the demo.",subtitle:"Container Apps · Entra ID · RBAC · Blob proof · explicit recovery states"}),
  close: await sharp(shell({ kicker:"BEFORE THE ROAR", title:"Every claim earned.", subtitle:"Reason. Verify. Correct. Communicate.", body:`<text x="76" y="405" fill="#fff" font-family="Arial" font-weight="900" font-size="67">TRY THE DEFINING MOMENT</text><text x="76" y="478" fill="#ff5575" font-family="Arial" font-weight="800" font-size="30">before-the-roar.sagitta107.chatgpt.site/?judge=1#watch</text><text x="76" y="582" fill="#b6ff2f" font-family="Arial" font-weight="800" font-size="21" letter-spacing="4">LIVE APP · JUDGE ROUTE · BLIND REVIEW AVAILABLE</text>` })).png().toFile(path.join(work,"10-close.png")).then(()=>path.join(work,"10-close.png")),
};

const segments = [
  {key:"title",duration:4},
  {video:path.join(root,"dist","assets","pitchside-minute.mp4"),start:0,duration:9,label:"AI-GENERATED CINEMATIC COMPANION"},
  {key:"inject",duration:7}, {key:"running",duration:7}, {key:"receipts",duration:10}, {key:"proof",duration:9},
  {key:"compare",duration:14},
  {video:path.join(root,"dist","assets","pitchside-minute.mp4"),start:31,duration:6,label:"AI-GENERATED CINEMATIC COMPANION"},
  {key:"watch",duration:7}, {key:"phone",duration:9}, {key:"foundry",duration:10}, {key:"secure",duration:7}, {key:"close",duration:6},
];

let elapsed=0; const manifest=[];
for (let i=0;i<segments.length;i++) {
  const s=segments[i], target=path.join(work,`segment-${String(i).padStart(2,"0")}.mp4`), fade=Math.max(0,s.duration-.3);
  if (s.video) await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-ss",String(s.start||0),"-i",s.video,"-t",String(s.duration),"-vf",`scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,drawbox=x=0:y=0:w=iw:h=72:color=0x05080d@0.82:t=fill,drawbox=x=0:y=0:w=iw:h=7:color=0xff315d@1:t=fill,drawtext=text='BTR  /  ${s.label}':x=58:y=25:fontsize=25:fontcolor=white:fontfile='C\\:/Windows/Fonts/arialbd.ttf',fade=t=in:st=0:d=0.25,fade=t=out:st=${fade}:d=0.3,fps=30`,"-an","-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",target]);
  else await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-loop","1","-i",frames[s.key],"-t",String(s.duration),"-vf",`scale=1920:1080,zoompan=z='min(zoom+0.00012,1.018)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1920x1080:fps=30,fade=t=in:st=0:d=0.25,fade=t=out:st=${fade}:d=0.3`,"-an","-c:v","libx264","-preset","fast","-crf","18","-pix_fmt","yuv420p",target]);
  manifest.push(`file '${target.replaceAll("'","'\\''")}'`); elapsed+=s.duration;
}
await writeFile(path.join(work,"segments.txt"),manifest.join("\n")+"\n");
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",path.join(work,"segments.txt"),"-c","copy",path.join(work,"silent.mp4")]);

const captions=`1\n00:00:00,000 --> 00:00:04,000\nDid the run create the space?\n\n2\n00:00:04,000 --> 00:00:13,000\nThe movement looks convincing. BTR asks whether the evidence proves the story.\n\n3\n00:00:13,000 --> 00:00:27,000\nA fresh investigation sends four separate Azure model requests through the specialist chain.\n\n4\n00:00:27,000 --> 00:00:46,000\nThe AI desk exposes sources, response IDs, handoffs, latency and delivery state. Vector remains deterministic.\n\n5\n00:00:46,000 --> 00:01:00,000\nTruth Lab changes one tracking observation: 13.0 metres becomes 0.0.\n\n6\n00:01:00,000 --> 00:01:13,000\nThe pass calculation survives. The movement claim is withdrawn. The story is revised.\n\n7\n00:01:13,000 --> 00:01:22,000\nThe corrected explanation reaches Pocket Director with four personalized views.\n\n8\n00:01:22,000 --> 00:01:32,000\nFoundry records a narrow model-scored result—and the product publishes its limit.\n\n9\n00:01:32,000 --> 00:01:39,000\nAzure secures the service and preserves the proof.\n\n10\n00:01:39,000 --> 00:01:45,000\nEvery claim earned.\n`;
const captionsPath=path.join(demo,"before-the-roar-judge-demo-v2.srt");
await writeFile(captionsPath,captions);
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",path.join(work,"silent.mp4"),"-i",path.join(root,"tmp","btr-demo-narration-v2.wav"),"-filter_complex",`[0:v]subtitles=demo/before-the-roar-judge-demo-v2.srt:force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&HCC000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=34'[v];[1:a]highpass=f=70,lowpass=f=15000,loudnorm=I=-16:TP=-1.5:LRA=7,apad=pad_dur=20[a]`,"-map","[v]","-map","[a]","-t",String(elapsed),"-c:v","libx264","-preset","medium","-crf","18","-c:a","aac","-b:a","192k","-pix_fmt","yuv420p","-movflags","+faststart",output]);
await run("ffmpeg",["-hide_banner","-loglevel","error","-y","-i",output,"-vf","scale=-2:720","-c:v","libx264","-preset","medium","-crf","25","-c:a","aac","-b:a","128k","-movflags","+faststart",path.join(demo,"before-the-roar-judge-demo-v2-share.mp4")]);

const transcript=`BEFORE THE ROAR — JUDGE DEMO V2\n\nWatch the run. The defender moves, and the ball travels through the centre. It looks like an easy story: the run created the space. But did it?\n\nThis is a fresh BTR investigation. Scout finds the angle. Guide makes it understandable. Vector calculates 23.7 metres of forward passing gain. Check challenges the causal claim. Host publishes only what survives.\n\nFour specialists make separate Azure model requests. Vector stays deterministic. The live desk exposes response IDs, sources, handoffs, latency, and delivery time. This run finished in 3.2 seconds.\n\nNow comes the defining test. Truth Lab changes one synthetic tracking observation. The defender's measured shift falls from 13 metres to zero. The pass calculation remains. The movement claim is withdrawn. And the audience story is revised.\n\nThe corrected explanation reaches the match screen and Pocket Director together. A newcomer gets the football concept. An analyst gets the positional limit. A numbers fan gets the equation. Every answer cites the same evidence revision.\n\nMicrosoft Foundry provides a recorded evidence court for the crew-versus-baseline comparison. The current model-scored result is narrow: 46 to 45, with its limits shown. Human blind review remains open; BTR does not turn a test into a marketing claim.\n\nAzure Container Apps runs the service. Entra ID and role-based access protect resources. Blob Storage preserves the proof. Before the Roar turns live football data into a story that can be questioned, corrected, and trusted.\n`;
await writeFile(path.join(demo,"before-the-roar-judge-demo-v2-transcript.txt"),transcript);
await writeFile(path.join(demo,"before-the-roar-judge-demo-v2-provenance.json"),JSON.stringify({schema:"btr.submission-demo.v2",created_at:new Date().toISOString(),duration_seconds:elapsed,judge_entry:"https://before-the-roar.sagitta107.chatgpt.site/?judge=1#watch",fresh_execution:{azure_model_requests:4,deterministic_roles:["Vector"],delivery_seconds:3.2,receipt_capture:"tmp/live-demo-capture/live-receipts.jpg"},correction:{original_revision:"R1",corrected_revision:"R2",defender_shift_m:[13,0],surviving_evidence:"2 completed passes / 23.7m forward gain",withdrawn_claim:"defender movement"},evaluation:{kind:"recorded model-scored comparison",cases:6,crew_points:46,baseline_points:45,independent_human_review:"pending"},visual_sources:{application:"Fresh public application captures",cinematic:"AI-generated fictional companion footage, labelled in-video",mobile:"Fresh paired Pocket Director capture on corrected revision R2"},narration:{provider:"Azure AI Speech",voice:"en-US-GuyNeural",style:"newscast-casual",burned_captions:true},claims:{real_match_data:false,cinematic_is_measurement_source:false,independent_human_superiority_proven:false}},null,2));
console.log(`Created ${output}`); console.log(`Duration: ${elapsed} seconds`);
