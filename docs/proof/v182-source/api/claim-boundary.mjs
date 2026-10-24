// Conservative language checks, not a semantic accuracy classifier.
// Apply to every public field; a cautious body must not hide a causal headline.
export function claimBoundaryIssues(text) {
  const s = String(text || "").normalize("NFKC");
  const absent =
    /\bwithout\s+(?:directly\s+|clearly\s+|significantly\s+)?(?:affecting|influencing|changing|impacting)\b|\bunaffected\b|\bindependen(?:tly|t|cia|temente)\b|\bregardless of (?:the |this )?(?:run|runner|movement)|\bsin\s+(?:afectar|influir)|\bsem\s+(?:afetar|influenciar)/i;
  const attention =
    /\b(?:distract(?:s|ed|ing|ion)?|decoy|lures?|lured|bait(?:s|ed)?|distracci[oó]n|distra[cç][aã]o)\b/i;
  // Deliberately conservative: proposed causal explanations remain outside this event-only contract.
  const causation =
    /\b(?:run|runner|movement)\s+(?:directly\s+)?(?:creates?|created|opens?|opened|causes?|caused|forces?|forced)\b|\b(?:draws|pulls|forces) the defender\b/i;
  const issues = [];
  if (absent.test(s)) issues.push("Unsupported absence or independence of influence");
  if (attention.test(s))
    issues.push("Attention is not measured by event and coordinate records");
  if (causation.test(s))
    issues.push("Causal mechanism is not established by these records");
  return issues;
}
