// Evidence-bound specialist tools, persisted contributions and resumable editorial handoffs.
import { createHash } from "node:crypto";
import { accessToken } from "./azure.mjs";
import { AgentState, DeskInterrupted } from "./agent-state.mjs";
import { TOOL_DEFINITIONS, executeAgentTool, claimRecord } from "./agent-tools.mjs";
import { readCompletion, draftInterpretations } from "./streaming.mjs";
import { matchStory, localPanel, editorialKey } from "../dist/match-story.js";
import { PLAYERS } from "../dist/engine.js";
import {
  PITCHSIDE,
  pitchsideStory,
  pitchsidePanel,
  pitchsideKey,
} from "../dist/pitchside-story.js";
import { editorialIssues } from "../dist/editorial-quality.js";
import { ROLE_TASKS, editorialPolicy } from "./editorial-policy.mjs";
import { conversationContext, followUpMetric } from "./conversation.mjs";
import { claimBoundaryIssues } from "./claim-boundary.mjs";
import { groundedRound } from "./grounded-desk.mjs";
export const roleTasks = ROLE_TASKS;
// Catch obvious repeated copy without an extra model call or claiming semantic verification.
export function repeatsContribution(summary, previous = []) {
  const words = (s) => s.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const tokens = words(summary),
    grams = (t) => new Set(t.slice(0, -3).map((_, i) => t.slice(i, i + 4).join(" ")));
  return previous.some((p) => {
    const other = words(p.summary || "");
    if (tokens.join(" ") === other.join(" ")) return true;
    const a = grams(tokens),
      b = grams(other);
    return a.size >= 5 && [...a].filter((g) => b.has(g)).length / a.size > 0.7;
  });
}
export function repeatsInsight(summary, previous = []) {
  const stop = new Set('the a an to is and or while from this that yet overall be been of its however single alone can cannot does not in on for with as at by it their'.split(' '));
  const words = s => new Set((s.toLocaleLowerCase().match(/[\p{L}]+/gu)||[]).filter(w=>w.length>2&&!stop.has(w)));
  const mine=words(summary);
  return previous.some(p=>{
    const other=words(p.summary||'');
    if(mine.size<5||other.size<5)return false;
    const shared=[...mine].filter(w=>other.has(w)).length;
    return shared/mine.size>=.55&&mine.size-shared<5;
  });
}
export function repeatsFilmUncertainty(summary, previous=[]) {
  return /pass|connection/i.test(summary) && /defender/i.test(summary) && /(?:unverified|unknown|not (?:known|confirmed|established)|remains unclear)/i.test(summary) && !/(?:next touch|next pass|turn|release|exit|wider line|continuous|unbroken)/i.test(summary) && previous.some(p=>p.role==='analyst'&&/pass|passes|connection/i.test(p.summary)&&/defender/i.test(p.summary));
}
export function filmHostSkipsCheck(summary, packet) {
  if(!['01-pass','07-blue'].includes(packet.evidence.at(-1)?.shot_id))return false;
  const boundary=/(?:line|defen|beyond|outside|unverified|unknown|cannot confirm|not establish|línea|defens|fuera|desconoc|não confirm|fora|linha)/i.test(summary);
  const nextTest=/(?:next|following|touch|turn|release|exit|siguiente|próxim|toque|salida|saída|soltar)/i.test(summary);
  return !boundary||!nextTest;
}
function reviewedClipChallenge(packet,role){
  const pass=['01-pass','07-blue'].includes(packet.evidence.at(-1)?.shot_id),l=['en','es','pt'].indexOf(packet.language);
  const lines=pass?{
    analyst:['The reviewed shot shows a nearby defender and a received pass. It does not track the defender’s complete route.','La toma revisada muestra un defensor cercano y un pase recibido. No sigue toda la trayectoria del defensor.','A tomada revisada mostra um defensor próximo e um passe recebido. Não acompanha todo o trajeto do defensor.'],
    guide:['Which continuous angle would show the defender’s route during the pass and the receiver’s next touch?','¿Qué toma continua mostraría la trayectoria del defensor durante el pase y el siguiente toque del receptor?','Qual tomada contínua mostraria o trajeto do defensor durante o passe e o próximo toque de quem recebeu?'],
    presenter:['A continuous view of the defender through the pass could change the defensive reading. This shot confirms the outlet, not a break in the wider line.','Una toma continua del defensor durante el pase podría cambiar la lectura defensiva. Esta toma confirma la salida, no una ruptura de la línea.','Uma tomada contínua do defensor durante o passe poderia mudar a leitura defensiva. Esta tomada confirma a saída, não a ruptura da linha.']
  }:{
    analyst:['The reviewed notes describe the visible action in this shot. They do not establish what changed beyond the frame.','Las notas revisadas describen la acción visible en esta toma. No establecen qué cambió fuera del encuadre.','As notas revisadas descrevem a ação visível nesta tomada. Não estabelecem o que mudou fora do quadro.'],
    guide:['Which continuous angle would let us compare this action with the next visible touch?','¿Qué toma continua permitiría comparar esta acción con el siguiente toque visible?','Qual tomada contínua permitiria comparar esta ação com o próximo toque visível?'],
    presenter:['An unbroken view of the next action could change this reading. The current shot supports only the reached observation.','Una toma sin cortes de la siguiente acción podría cambiar esta lectura. La toma actual solo respalda la observación alcanzada.','Uma tomada sem cortes da próxima ação poderia mudar esta leitura. A tomada atual só sustenta a observação alcançada.']
  };
  return lines[role]?.[Math.max(0,l)];
}
export function validateMatchPost(raw, packet, role, context={}) {
  const p = {
      ...raw?.post,
      interpretation:
        role === "guide"
          ? raw?.post?.viewing_question || raw?.post?.interpretation
          : role === "presenter"
            ? raw?.post?.takeaway || raw?.post?.interpretation
            : raw?.post?.interpretation,
    },
    ids = new Set(packet.evidence.map((e) => e.id));
  for (const k of ["interpretation", "headline", "caution"])
    if (
      typeof p?.[k] !== "string" ||
      !p[k].trim() ||
      p[k].length > 850 ||
      /\d/.test(p[k])
    )
      throw Error("Invalid editorial text");
  const evidence_ids = [p.evidence_ids?.primary, p.evidence_ids?.secondary].filter(
    Boolean,
  );
  if (!evidence_ids.length || evidence_ids.some((id) => !ids.has(id)))
    throw Error("Citation outside the evidence cutoff");
  const quality = editorialIssues(role, p.interpretation);
  if (quality.length) throw Error(quality.join("; "));
  if (
    packet.synthetic &&
    /\b(distraction|decoy|distracci[oó]n|distra[cç][aã]o)\b|\b(draws|pulls|forces) the defender/i.test(
      p.interpretation,
    )
  )
    throw Error("Defender attention and causal influence are not recorded");
  if (
    /(?:does|did|do)(?: not|n't) (?:directly |actually |significantly |clearly )?(?:influence|affect)|no (?:direct |significant |clear )?(?:effect|influence|defensive reaction)|did not cause|no (?:influye|influy[oó]|afecta|afect[oó])|sin (?:efecto|reacci[oó]n defensiva)|n[aã]o (?:influencia|influenciou|afeta|afetou)|n[aã]o (?:tem|teve) (?:efeito|influ[eê]ncia)|sem (?:efeito|rea[cç][aã]o defensiva)/i.test(
      p.interpretation,
    )
  )
    throw Error("Unproven causation cannot become proof of no influence");
  if (/movement strategies|separation in.*strategies/i.test(p.interpretation))
    throw Error("Describe the observed route, not an inferred strategy");
  if (
    packet.review?.decision === "withdraw" &&
    ["analyst", "presenter"].includes(role) &&
    !/correct|correg|corrig|correç|retir|withdraw|no longer|ya no|já não/i.test(
      p.interpretation,
    )
  )
    throw Error("Corrected source requires an explicit changed conclusion");
  const prose = [
    p.interpretation,
    p.headline,
    p.caution,
    p.replay_cue,
    p.viewing_question,
  ].join(" ");
  if (packet.review?.scope === 'manually-reviewed-ai-video' && /\b(?:does not|doesn't|did not|didn't|never)\s+(?:change|move|shift)|\b(?:remains|stays)\s+(?:still|stationary|in place|at (?:the|his|its) (?:same|starting) position)|\b(?:no|without)\s+(?:significant\s+)?(?:movement|change in position)/i.test(prose))
    throw Error('The reviewed film does not establish unchanged defender movement');
  if (packet.review?.scope === 'manually-reviewed-ai-video' && /\b(?:readiness|preparedness|ready to|prepared to)\b|(?:potential|clear|decisive) (?:moment of )?advantage|well.positioned to control|defender(?:'s)? (?:intent|attention)/i.test(prose))
    throw Error('The reviewed film does not establish player readiness or advantage');
  if (packet.review?.scope === 'manually-reviewed-ai-video' && role==='guide' && /receiver.{0,45}(?:making|made|sends|sent) (?:the|a) pass/i.test(p.interpretation))
    throw Error('The receiver is not the recorded passer');
  if (packet.review?.scope === 'manually-reviewed-ai-video' && context.round>1 && /what evidence would change|what would change this explanation|qué evidencia cambiar|que evidência mudaria/i.test(context.question||'') && role==='guide' && !/(?:continuous|unbroken|sequence|sequential|continua|continua|contínua|sin cortes|sem cortes).*(?:camera|frame|angle|shot|view|cámara|encuadre|toma|vista|câmera|quadro|tomada)|(?:camera|frame|angle|shot|view|cámara|encuadre|toma|vista|câmera|quadro|tomada).*(?:continuous|unbroken|sequence|sequential|continua|contínua|sin cortes|sem cortes)/i.test(p.interpretation))
    throw Error('Guide must identify a concrete evidence comparison for this challenge');
  if (packet.synthetic) {
    const boundary = [
      p.interpretation,
      p.headline,
      p.caution,
      p.replay_cue,
      p.viewing_question,
    ].flatMap(claimBoundaryIssues);
    if (boundary.length) throw Error(boundary.join("; "));
  }
  if (
    PLAYERS.some((player) =>
      new RegExp("\\b" + player.name.split(" ").at(-1) + "\\b", "i").test(prose),
    )
  )
    throw Error("Player attribution belongs in the calculated facts");
  if (
    /team dynamics|team coordination|shift in play focus|dinámica del equipo|dinâmica da equipe/i.test(
      p.interpretation,
    )
  )
    throw Error("Generic editorial claim; use the recorded physical detail");
  if (
    role === "presenter" &&
    /evidence (allows|lets) (the )?viewers|outcome (remains|is still) uncertain|influence the outcome|maintain(s|ing)? possession|creates? opportunities/i.test(
      p.interpretation,
    )
  )
    throw Error("Host must add a specific judgment, not a generic conclusion");
  if (
    role === "presenter" &&
    (/^(assess|consider|evaluate|judge|watch|look|observe|notice|compare|decide|determine|think about|keep|use|follow|start|replay)\b/i.test(
      p.interpretation,
    ) ||
      /^(evalúa|evalúe|evalua|evalúe|considera|observa|mira|compara|decide|juzga|repite|avalie|considere|observe|olhe|compare|julgue|reveja|acompanhe)\b/i.test(
        p.interpretation,
      ) ||
      /\?$/.test(p.interpretation.trim()))
  )
    throw Error("Host must state a conclusion, not a viewing question or instruction");
  if (
    role === "presenter" &&
    /^(the outcome (remains|is)|more (evidence|context) is needed|it (is|remains) (unclear|uncertain))\b/i.test(
      p.interpretation,
    )
  )
    throw Error("Host must add a football-specific conclusion");
  if (
    role === "presenter" &&
    /\b(is crucial|is essential|is important|importance of|significance of|illustrates the importance|highlights the importance|es crucial|es esencial|importancia de|é crucial|é essencial|importância d)/i.test(
      p.interpretation,
    )
  )
    throw Error("Host must state the football implication, not praise its importance");
  if (
    role === "guide" &&
    /what do you notice|what stands out|what happens next|qué (notas|observas)|o que você (nota|observa)/i.test(
      p.interpretation,
    )
  )
    throw Error("Guide must direct attention to a specific comparison");
  if (
    packet.synthetic &&
    /adjust(ed|ing)? the angle|chang(ed|ing)? the (pass )?angle|lateral to a forward|body (shape|posture)|weaker foot|outside of (his|the) (boot|foot)|ball spin/i.test(
      prose,
    )
  )
    throw Error(
      "Technique claim is absent from the synthetic event and tracking records",
    );
  const guideQuestion =
    role === "guide"
      ? p.viewing_question || p.interpretation.replace(packet.guideDefinition, "").trim()
      : null;
  if (
    role === "guide" &&
    (typeof guideQuestion !== "string" ||
      !guideQuestion.trim().endsWith("?") ||
      guideQuestion.length > 280 ||
      /\d/.test(guideQuestion))
  )
    throw Error("Guide requires the verified definition and a distinct viewing question");
  if (role === "presenter") {
    if (
      /^(the ball|a player|the player|the evidence shows|el balón|el jugador|la evidencia muestra|a bola|o jogador|a evidência mostra)\b/i.test(
        p.interpretation,
      )
    )
      throw Error("Host repeated the observation instead of a viewer takeaway");
    const start = { en: "Replay ", es: "Repite ", pt: "Reveja " }[packet.language];
    if (
      typeof p.replay_cue !== "string" ||
      !p.replay_cue.startsWith(start) ||
      p.replay_cue.length > 220 ||
      /\d/.test(p.replay_cue)
    )
      throw Error("Host omitted the concrete replay cue");
  }
  return {
    summary:
      role === "guide" ? packet.guideDefinition + " " + guideQuestion : p.interpretation,
    title: p.headline,
    caution: p.caution,
    evidence_ids,
    evidence_contract: {
      kind: role === "guide" ? "viewing_question" : "interpretation",
      observation: packet.football?.observation || null,
      limitation: p.caution,
      validation: "Citation and editorial checks only; not semantic proof",
    },
    ...(role === "presenter" ? { replay_cue: p.replay_cue } : {}),
  };
}
export class MatchDesk {
  constructor(narrator, { clip = false, state = new AgentState(narrator.store) } = {}) {
    this.narrator = narrator;
    this.store = narrator.store;
    this.state = state;
    this.pending = new Map();
    this.clip = clip;
  }
  async discuss(input, emit, options = {}) {
    const key =
      options.key ||
      createHash("sha256")
        .update(
          this.clip
            ? "pitchside-tools-v12:" + pitchsideKey(input) + ":" + (input.parentKey || "")
            : (process.env.BTR_GROUNDED_DESK === "1"
                ? "cohesive-source-v55:"
                : "cohesive-tools-v12:") +
                editorialKey(input) +
                ":" +
                (input.parentKey || ""),
        )
        .digest("hex");
    if (this.pending.has(key)) {
      const task = this.pending.get(key);
      for (const [type, item] of task.history) emit(type, item);
      task.listeners.add(emit);
      try {
        return await task.promise;
      } finally {
        task.listeners.delete(emit);
      }
    }
    const task = { history: [], listeners: new Set([emit]) };
    this.pending.set(key, task);
    const publish = (type, item) => {
      task.history.push([type, item]);
      for (const fn of task.listeners) fn(type, item);
    };
    task.promise = this.generate(key, input, publish, options);
    try {
      return await task.promise;
    } finally {
      this.pending.delete(key);
    }
  }
  async generate(key, input, emit, options = {}) {
    const packet = this.clip ? pitchsideStory(input) : matchStory(input),
      notes = this.clip ? pitchsidePanel(packet) : localPanel(packet),
      posts = new Map(),
      start = performance.now();
    const conversation = await conversationContext(this.state, input, this.clip);
    if (conversation.round > 1 && packet.analysis?.calculations?.length > 1) {
      const metric = followUpMetric(packet, conversation.previous);
      if (metric)
        Object.assign(
          notes.find((p) => p.role === "math"),
          {
            summary: metric.text,
            metric_value: metric.value,
            metric_title: metric.label,
            working: metric.equation,
            evidence_ids: metric.evidence_ids,
          },
        );
    }
    emit("conversation", {
      id: key,
      round: conversation.round,
      parent: conversation.parent,
      max_rounds: 3,
    });
    if (!packet.brief.state.seen.length) {
      for (const post of notes) emit("post", post);
      emit("complete", {
        cached: false,
        elapsed_ms: Math.round(performance.now() - start),
        model_calls: 0,
        no_events: true,
      });
      return notes;
    }
    const journal = await this.state.open(key, {
      schema: "btr.agent-run.v1",
      created_at: Date.now(),
      input,
      source: this.clip ? "pitchside" : "match",
      status: "running",
      conversation,
      posts: {},
      trace: [],
      metrics: {
        model_calls: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        usage_missing: 0,
      },
      claim: claimRecord(packet, notes),
    });
    const trace = async (role, action, detail = {}) => {
      let item;
      await journal.change((v) => {
        item = {
          seq: v.trace.length + 1,
          at: Date.now(),
          role,
          action,
          ...detail,
        };
        v.trace.push(item);
        v.trace = v.trace.slice(-100);
      });
      emit("trace", item);
    };
    for (const item of journal.value.trace) emit("trace", { ...item, replayed: true });
    if (journal.value.status === "complete") {
      for (const p of Object.values(journal.value.posts))
        emit("post", { ...p, cached: true });
      emit("complete", {
        cached: true,
        elapsed_ms: Math.round(performance.now() - start),
        model_calls: 0,
        saved_metrics: journal.value.metrics,
        claim: journal.value.claim,
      });
      return Object.values(journal.value.posts);
    }
    await trace(
      "director",
      journal.value.trace.length ? "checkpoint_resumed" : "run_started",
      {
        cutoff: packet.cutoff,
        revision: packet.revision,
        storage: this.store.base ? "azure_blob" : "local_file",
      },
    );
    let sequence = 0;
    const publish = async (p) => {
      p = {
        ...p,
        turn_id: key + ":" + p.role,
        round: conversation.round,
        sequence: ++sequence,
        reply_to:
          { guide: "analyst", reviewer: "analyst", presenter: "reviewer" }[p.role] ||
          null,
      };
      await journal.change((v) => {
        v.posts[p.role] = p;
      });
      posts.set(p.role, p);
      emit("post", p);
    };
    if (!this.clip && process.env.BTR_GROUNDED_DESK === "1")
      return groundedRound({
        packet,
        notes,
        conversation,
        input,
        journal,
        narrator: this.narrator,
        emit,
        publish,
        trace,
        start,
        options,
      });
    await publish(notes.find((p) => p.role === "math"));
    await trace("math", "calculation_saved", {
      evidence_ids: notes.find((p) => p.role === "math").evidence_ids,
    });
    const usage = async (data) =>
      journal.change((v) => {
        if (data) {
          v.metrics.prompt_tokens += data.prompt_tokens || 0;
          v.metrics.completion_tokens += data.completion_tokens || 0;
        } else v.metrics.usage_missing++;
      });
    const reserve = async () => {
      if ((this.narrator.retryAt || 0) > Date.now())
        throw Error("Azure rate limit cooling down; saved work remains available");
      if (!(await this.store.reserve())) throw Error("Daily allowance reached");
      await journal.change((v) => v.metrics.model_calls++);
    };
    const modelFailure = (response, stage) => {
      if (response.status === 429) {
        const seconds = Number(response.headers.get("retry-after"));
        this.narrator.retryAt =
          Date.now() +
          Math.min(
            120000,
            Math.max(
              1000,
              Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60000,
            ),
          );
      }
      return Error(`${stage} HTTP ${response.status}`);
    };
    const complete = async (role, previous = []) => {
      const began = performance.now();
      let acquired = false;
      const saved = journal.value.posts[role];
      if (saved && saved.engine === "azure_openai") {
        posts.set(role, saved);
        emit("post", { ...saved, resumed: true });
        await trace(role, "saved_contribution_reused");
        return saved;
      }
      try {
        if (!process.env.AZURE_OPENAI_ENDPOINT) throw Error("AI unavailable");
        // Share the existing two-request capacity with the other app services.
        while (this.narrator.busy >= 2) {
          if (performance.now() - began > 20000) throw Error("Capacity wait exceeded");
          await new Promise((r) => setTimeout(r, 100));
        }
        this.narrator.busy++;
        acquired = true;
        emit("speaker", { role });
        let evidence = packet.evidence.filter(
          (e) => e.record_type !== "tracking" || packet.brief.evidenceIds.includes(e.id),
        );
        // Automatic discussions stay with the latest shot. Questions can use all
        // earlier evidence; the deterministic end recap covers the whole film.
        if (this.clip && !input.question) {
          const latestShot = evidence.at(-1)?.shot_id;
          if (latestShot) evidence = evidence.filter((e) => e.shot_id === latestShot);
        }
        const ids = evidence.map((e) => e.id),
          schema = {
            type: "object",
            additionalProperties: false,
            properties: {
              post: {
                type: "object",
                additionalProperties: false,
                properties: {
                  interpretation: { type: "string" },
                  headline: { type: "string" },
                  caution: { type: "string" },
                  evidence_ids: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      primary: { type: "string", enum: ids },
                      secondary: {
                        type: ["string", "null"],
                        enum: [...ids, null],
                      },
                    },
                    required: ["primary", "secondary"],
                  },
                },
                required: ["interpretation", "headline", "caution", "evidence_ids"],
              },
            },
            required: ["post"],
          };
        if (packet.football?.observation)
          schema.properties.post.properties.evidence_ids.properties.primary.enum = [
            packet.football.record.id,
          ];
        let editorialPrompt = editorialPolicy(packet, role, {
          clip: this.clip,
          round: conversation.round,
        });
        if (role === "guide") {
          delete schema.properties.post.properties.interpretation;
          schema.properties.post.required = schema.properties.post.required.filter(
            (k) => k !== "interpretation",
          );
          schema.properties.post.properties.viewing_question = {
            type: "string",
          };
          schema.properties.post.required.push("viewing_question");
        }
        if (role === "presenter") {
          delete schema.properties.post.properties.interpretation;
          schema.properties.post.required = schema.properties.post.required.filter(
            (k) => k !== "interpretation",
          );
          schema.properties.post.properties.takeaway = { type: "string" };
          schema.properties.post.required.push("takeaway");
          schema.properties.post.properties.replay_cue = { type: "string" };
          schema.properties.post.required.push("replay_cue");
        }
        const url = new URL(
          `openai/deployments/${encodeURIComponent(process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini")}/chat/completions?api-version=2024-10-21`,
          process.env.AZURE_OPENAI_ENDPOINT,
        );
        const toolContext = { packet, notes, evidence, previous },
          headers = {
            Authorization: `Bearer ${await accessToken("https://cognitiveservices.azure.com/")}`,
            "Content-Type": "application/json",
          };
        const toolMessages = [
          {
            role: "system",
            content: `${roleTasks[role]} Select the most useful evidence tool before writing. No outside facts. The next step will receive the tool result. These are public editorial operations, not private reasoning.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              cutoff: packet.cutoff,
              revision: packet.revision,
              source: this.clip ? "reviewed film annotations" : "synthetic events",
              available_previous_roles: previous.map((p) => p.role),
              question: input.question || null,
            }),
          },
        ];
        let toolReceipt = journal.value.tools?.[role];
        if (role === "analyst" && !toolReceipt) {
          let call;
          if (this.clip) {
            // The film has one bounded, manually reviewed source. Choosing it is
            // deterministic; a model selection call adds cost without evidence.
            call = {
              id: `film_evidence_${packet.revision}`,
              type: "function",
              function: { name: "read_evidence", arguments: "{}" },
            };
          } else {
            await reserve();
            const response = await fetch(url, {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              messages: toolMessages,
              tools: TOOL_DEFINITIONS,
              tool_choice: "required",
              parallel_tool_calls: false,
              max_tokens: 160,
              temperature: 0,
            }),
            });
            if (!response.ok) throw modelFailure(response, "Evidence tool selection");
            const selection = await response.json();
            await usage(selection.usage);
            const calls = selection.choices?.[0]?.message?.tool_calls;
            if (calls?.length !== 1) throw Error("Exactly one bounded tool is required");
            call = calls[0];
          }
          const output = executeAgentTool(
              call.function.name,
              JSON.parse(call.function.arguments),
              toolContext,
            );
          toolReceipt = { call, output };
          await journal.change((v) => {
            v.tools ??= {};
            v.tools[role] = toolReceipt;
          });
          await trace(role, "tool_completed", {
            tool: call.function.name,
            evidence_ids:
              output.records?.map((e) => e.id) ||
              output.calculation?.evidence_ids ||
              output.review?.evidence_ids ||
              [],
            duration_ms: Math.round(performance.now() - began),
          });
        } else if (toolReceipt)
          await trace(role, "saved_tool_reused", {
            tool: toolReceipt.call.function.name,
          });
        else
          await trace(role, "context_prepared", {
            source:
              role === "presenter"
                ? "saved_public_contributions"
                : "verified_glossary_and_evidence",
            evidence_ids: ids,
            model_tool_selection: false,
          });
        await reserve();
        const res = await fetch(url, {
          method: "POST",
          headers,
          signal: AbortSignal.timeout(30000),
          body: JSON.stringify({
            messages: [
              { role: "system", content: editorialPrompt },
              {
                role: "user",
                content: JSON.stringify({
                  question: input.question || null,
                  clock: packet.clock,
                  revision: packet.revision,
                  calculated: packet.stats,
                  local_calculation: notes.find((p) => p.role === "math"),
                  football_context: packet.football
                    ? {
                        ...packet.football,
                        ...(conversation.round > 1
                          ? { question: undefined, definition: undefined }
                          : {}),
                      }
                    : null,
                  guide_definition:
                    conversation.round === 1 ? packet.guideDefinition : undefined,
                  role_brief:
                    conversation.round > 1 && role === "guide"
                      ? {
                          task: packet.football?.record?.width
                            ? "Ask a new viewing question about the order of the defender's movement and the pass release; do not reuse the opening question."
                            : "Ask a new viewing question that addresses this follow-up using only the supplied source; do not reuse the opening question.",
                        }
                      : notes.find((p) => p.role === role),
                  evidence,
                  review: packet.review,
                  previous_public_contributions: previous,
                  conversation: { round: conversation.round, max_rounds: 3 },
                  prior_round: conversation.previous,
                  ...(role === "presenter"
                    ? {
                        editorial_closing_reference: notes.find(
                          (p) => p.role === "presenter",
                        ).summary,
                      }
                    : {}),
                }),
              },
              ...(toolReceipt
                ? [
                    {
                      role: "assistant",
                      content: null,
                      tool_calls: [toolReceipt.call],
                    },
                    {
                      role: "tool",
                      tool_call_id: toolReceipt.call.id,
                      content: JSON.stringify(toolReceipt.output),
                    },
                  ]
                : []),
            ],
            temperature: 0.45,
            max_tokens: 450,
            stream: true,
            stream_options: { include_usage: true },
            response_format: {
              type: "json_schema",
              json_schema: { name: "match_editor", strict: true, schema },
            },
          }),
        });
        if (!res.ok) throw modelFailure(res, "Model response");
        let prior = "",
          first = null;
        const result = await readCompletion(res.body, (content) => {
          const fragment = draftInterpretations(
              content,
              ["post"],
              role === "guide"
                ? "viewing_question"
                : role === "presenter"
                  ? "takeaway"
                  : "interpretation",
            ).post,
            draft = fragment
              ? role === "guide" && conversation.round === 1
                ? packet.guideDefinition + " " + fragment
                : fragment
              : null;
          if (draft && draft !== prior) {
            prior = draft;
            first ??= Math.round(performance.now() - start);
            emit("draft", {
              role,
              summary: draft,
              cutoff: packet.cutoff,
              revision: packet.revision,
              first_text_ms: first,
            });
          }
        });
        await usage(result.usage);
        let raw = JSON.parse(result.content);
        const accept = candidate => {
          const validated = validateMatchPost(candidate, packet, role,{round:conversation.round,question:input.question});
          if (role === "guide" && conversation.round > 1)
            validated.summary = candidate.post.viewing_question;
          if (conversation.round > 1 && repeatsContribution(validated.summary,conversation.previous.filter(p=>p.role===role)))
            throw Error("Follow-up repeats the previous contribution");
          if (role === "presenter" && (repeatsContribution(validated.summary,previous) || repeatsInsight(validated.summary,previous.filter(p=>p.role==='analyst')) || (this.clip && (repeatsFilmUncertainty(validated.summary,previous) || filmHostSkipsCheck(validated.summary,packet))) || editorialIssues(role,validated.summary,previous).length))
            throw Error("Repeated contribution; using the reviewed closing cue");
          return validated;
        };
        let validated;
        try { validated=accept(raw); }
        catch (firstError) {
          if (role!=="presenter" || !this.clip) throw firstError;
          await journal.change(v=>{v.rejected_outputs??={};v.rejected_outputs[role]=raw;});
          await trace(role,"editorial_revision_requested",{reason:firstError.message});
          await reserve();
          const repairedResponse=await fetch(url,{
            method:"POST",headers,signal:AbortSignal.timeout(30000),
            body:JSON.stringify({
              messages:[
                {role:"system",content:editorialPrompt+' This is a revision after an editorial rejection. State a specific new football implication or the precise next-touch replay test. For a received pass, distinguish the local outlet from the unverified wider defensive line, and say what the next touch can test. Do not use the words importance, important, essential, crucial, or highlights. Do not repeat Scout. Keep the same evidence cutoff and citations.'},
                {role:"user",content:JSON.stringify({question:input.question,clock:packet.clock,revision:packet.revision,evidence,review:packet.review,calculated:packet.stats,previous_public_contributions:previous,prior_round:conversation.previous,editorial_rejection:firstError.message})},
              ],temperature:.25,max_tokens:450,stream:false,
              response_format:{type:"json_schema",json_schema:{name:"match_editor",strict:true,schema}},
            }),
          });
          if(!repairedResponse.ok)throw modelFailure(repairedResponse,"Editorial revision");
          const repaired=await repairedResponse.json();await usage(repaired.usage);
          raw=JSON.parse(repaired.choices?.[0]?.message?.content||'null');
          validated=accept(raw);
        }
        await journal.change(v=>{v.raw_outputs??={};v.raw_outputs[role]=raw;});
        const post = {
          ...validated,
          role,
          engine: "azure_openai",
          cutoff: packet.cutoff,
          revision: packet.revision,
          latency_ms: Math.round(performance.now() - began),
          first_text_ms: first,
        };
        await publish(post);
        await trace(role, "contribution_saved", {
          evidence_ids: post.evidence_ids,
          latency_ms: post.latency_ms,
          first_text_ms: first,
        });
        return post;
      } catch (error) {
        console.warn(
          JSON.stringify({
            event: "match_editor_fallback",
            role,
            message: error.message,
          }),
        );
        const p = {
          ...notes.find((p) => p.role === role),
          engine: "reviewed_fallback",
          ...(this.clip && conversation.round>1 && /what evidence would change|what would change this explanation|qué evidencia cambiar|que evidência mudaria/i.test(input.question||'')?{summary:reviewedClipChallenge(packet,role)}:{}),
          caution: input.question
            ? this.clip
              ? {en:'AI wording did not pass the editorial check. This is a reviewed evidence note.',es:'El texto de IA no pasó la revisión editorial. Esta es una nota revisada.',pt:'O texto da IA não passou na revisão editorial. Esta é uma nota revisada.'}[packet.language]
              : {
                  en: "AI could not answer this question. Showing the recorded match briefing.",
                  es: "La IA no pudo responder. Se muestra el resumen registrado.",
                  pt: "A IA não pôde responder. Exibindo o resumo registrado.",
                }[packet.language]
            : undefined,
        };
        await publish(p);
        await trace(role, "fallback_published", { reason: error.message });
        return p;
      } finally {
        if (acquired) this.narrator.busy--;
      }
    };
    const scout = await complete("analyst", conversation.previous);
    const guide = await complete("guide", [scout, posts.get("math")]);
    if (options.interruptAfterSpecialists && !journal.value.fault_injected) {
      await journal.change((v) => {
        v.fault_injected = true;
        v.status = "interrupted";
      });
      await trace("director", "worker_interrupted", {
        saved_roles: Object.keys(journal.value.posts),
      });
      throw new DeskInterrupted();
    }
    const check = {
      ...notes.find((p) => p.role === "reviewer"),
      target_role: "analyst",
      reviewed_contribution: scout.summary,
    };
    await publish(check);
    await trace("reviewer", "claim_checked", { claim: journal.value.claim });
    await complete("presenter", [scout, guide, posts.get("math"), check]);
    const ordered = ["analyst", "guide", "math", "reviewer", "presenter"].map((id) =>
      posts.get(id),
    );
    const allAI = ordered
      .filter((p) => ["analyst", "guide", "presenter"].includes(p.role))
      .every((p) => p.engine === "azure_openai");
    await journal.change((v) => {
      v.status = allAI ? "complete" : "degraded";
      v.metrics.elapsed_ms = Math.round(performance.now() - start);
    });
    await trace("director", allAI ? "broadcast_ready" : "reviewed_notes_ready", {
      revision: packet.revision,
    });
    emit("complete", {
      cached: false,
      ...journal.value.metrics,
      claim: journal.value.claim,
      status: journal.value.status,
    });
    return ordered;
  }
}
