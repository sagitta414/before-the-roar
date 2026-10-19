// Follow-ups read saved public contributions, never client-supplied dialogue.
import { clipSceneStart } from "../dist/pitchside-story.js";
export const CONVERSATION_LIMIT = 3;
// A second round adds a reached calculation, never an unavailable placeholder.
export function followUpMetric(packet, previous = []) {
  const width = packet.football?.record?.width;
  if (width) {
    const n = width.defender_lateral_displacement_m.toFixed(1);
    const start = width.defender_start_m[1].toFixed(1);
    const end = width.defender_end_m[1].toFixed(1);
    const language = packet.language;
    const metric = {
      text: {
        en: `The defender shifts ${n} m across the pitch. That measures movement, not how much of it the winger caused. Compare when that shift begins with the pass release; timing alone still cannot prove influence.`,
        es: `El defensor se desplaza ${n} m a lo ancho. Eso mide movimiento, no cuánto provocó el extremo. Compara el inicio del desplazamiento con la salida del pase; el orden temporal no prueba la influencia.`,
        pt: `O defensor se desloca ${n} m na largura. Isso mede movimento, não quanto o ponta causou. Compare o início do deslocamento com a saída do passe; a ordem temporal não prova influência.`,
      }[language],
      label: {
        en: "Defender lateral movement",
        es: "Movimiento lateral del defensor",
        pt: "Movimento lateral do defensor",
      }[language],
      value: n + " m",
      equation: `|${end} − ${start}| = ${n} m`,
      evidence_ids: [packet.football.record.id],
    };
    if (!previous.some((p) => p.role === "math" && p.summary === metric.text))
      return metric;
  }
  return packet.analysis?.calculations?.find(
    (c) =>
      c.value !== "—" &&
      c.evidence_ids.length &&
      !previous.some((p) => p.role === "math" && p.summary === c.text),
  );
}
export function sameConversation(a, b, clip = false) {
  const keys = clip
    ? ["language", "mode", "clipChallenge"]
    : ["scenario", "language", "mode", "team", "focus", "corrected"];
  return (
    keys.every((k) => (a[k] ?? false) === (b[k] ?? false)) &&
    Number(a.time) <= Number(b.time) &&
    (!clip || clipSceneStart(a.time) === clipSceneStart(b.time))
  );
}
export async function conversationContext(state, input, clip = false) {
  if (!input.parentKey) return { round: 1, previous: [], parent: null };
  if (!/^[a-f0-9]{64}$/.test(input.parentKey))
    throw Error("Invalid discussion reference");
  const saved = (await state.read(input.parentKey))?.value;
  if (
    !saved ||
    !["complete", "degraded"].includes(saved.status) ||
    saved.source !== (clip ? "pitchside" : "match")
  )
    throw Error("The previous round is not available");
  if (!sameConversation(saved.input, input, clip))
    throw Error(
      "Start a new discussion for this source, language, perspective or evidence revision",
    );
  const round = (saved.conversation?.round || 1) + 1;
  if (round > CONVERSATION_LIMIT)
    throw Error(
      "This discussion has reached three rounds. Start a new discussion or move to another moment.",
    );
  return {
    round,
    parent: input.parentKey,
    previous: [...(saved.conversation?.previous || []), ...Object.values(saved.posts)]
      .map((p) => ({
        role: p.role,
        summary: p.summary,
        engine: p.engine,
        evidence_ids: p.evidence_ids,
        cutoff: p.cutoff,
        revision: p.revision,
      }))
      .slice(-15),
  };
}
export const VOICES = {
  analyst:
    "Scout is an alert, observant football analyst. Crisp, concrete sentences; an eye for the detail viewers miss. Sound interested, never grandiose. No invented coaching career or first-person match experience.",
  guide:
    "Guide is a warm, curious newcomer coach. Ask the question someone watching football for the first time would actually ask. Build directly on Scout’s detail. No classroom lecture or condescension.",
  presenter:
    "Host is a confident, conversational studio presenter. Resolve the useful contrast raised by the room. A short natural response to Check is welcome; avoid hype, catchphrases and merely listing speakers.",
};
