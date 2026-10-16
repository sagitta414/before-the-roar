// Follow-ups read saved public contributions, never client-supplied dialogue.
import { clipSceneStart } from "../dist/pitchside-story.js";
export const CONVERSATION_LIMIT = 3;
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
    previous: Object.values(saved.posts)
      .map((p) => ({
        role: p.role,
        summary: p.summary,
        engine: p.engine,
        evidence_ids: p.evidence_ids,
        cutoff: p.cutoff,
        revision: p.revision,
      }))
      .slice(-5),
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
