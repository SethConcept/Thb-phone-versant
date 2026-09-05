// Dispositions mode prompts: the live agent the trainee dials, the grading
// prompt, and the deterministic verdict. Mirrors versant-prompts.ts but for
// OUTBOUND calls — the trainee dials a licensed agent, the agent answers
// "Hello?", and the trainee runs the Equity Track dispo script.

import {
  DISPO_BRAND,
  DISPO_PROPERTY,
  DISPO_RUBRIC,
  DISPO_BREACHES,
  DISPO_MAX_SCORE,
  DISPO_PASS_SCORE,
  getDispoAgent,
  DISPO_AGENTS,
  type DispoDraw,
} from "./dispo";

function agentOf(draw: DispoDraw) {
  return getDispoAgent(draw.agent) ?? DISPO_AGENTS[0];
}

// ---------------------------------------------------------------------------
// The live agent (Gemini Live system prompt)
// ---------------------------------------------------------------------------

export function dispoSystemPrompt(traineeName: string, draw: DispoDraw) {
  const a = agentOf(draw);

  return `You are ${a.name}, a licensed real estate agent at ${a.brokerage} in ${a.city}, California. Your phone is ringing — a number you don't recognize. The caller will turn out to be a dispositions rep from ${DISPO_BRAND}, an investment company in Northern California that buys homes, wholesales transactions, and sometimes closes and lists with an agent. The rep's name is ${traineeName}. The property they are calling about: ${DISPO_PROPERTY.blurb}

START: Answer the phone with just "Hello?" — nothing else — and then WAIT for the caller to speak. Do not introduce yourself until they've said who they are or asked.

YOUR CHARACTER:
${a.persona}

YOUR INVESTOR CLIENT'S BUY BOX (your private knowledge — reveal it only per your character above, and only when the caller asks about your buyers):
${a.buybox}

RULES:
- This is a real-time VOICE call. Reply only as ${a.name} speaking on the phone. No narration, no stage directions, no reading punctuation aloud.
- Keep replies to 1–3 sentences, the way people actually talk on the phone.
- Never break character and never coach the caller. You are not a trainer; you are a busy agent.
- Stay consistent with your buy box. Do not invent market statistics, comps, or prices of your own beyond what your character would plausibly ask about.
- If the caller offers to pay you personally rather than through your brokerage, react the way a licensed agent would — that is a red flag to you.
- If the caller is vague about whether they control the property, press them on it.
- If the caller tells you what the property should be listed for, or negotiates a retail price with you, or discusses the seller's personal situation — do NOT point out that it was a mistake. Respond naturally as an agent would and let it stand. The grader handles that afterward.
- End the call naturally if they waste your time or the conversation reaches a real conclusion — an email exchanged, a file promised, a clear no, or a polite goodbye.
- After the goodbyes are fully done and the conversation is over, say exactly: "CALL COMPLETE" — quietly, as the very last thing. Nothing after it.`;
}

// ---------------------------------------------------------------------------
// Grading prompt — the model reports facts, the code decides
// ---------------------------------------------------------------------------

export function dispoScoringPrompt(transcript: string, draw: DispoDraw) {
  const a = agentOf(draw);

  const rubricList = DISPO_RUBRIC.map(
    (r, i) => `${i + 1}. "${r.id}" — ${r.name.toUpperCase()}: ${r.desc}`
  ).join("\n");

  const breachList = DISPO_BREACHES.map((b) => `- "${b.id}": ${b.desc}`).join("\n");

  return `You are grading a ${DISPO_BRAND} dispositions practice call. The rep works for ${DISPO_BRAND}, an investment company in Northern California. ${DISPO_BRAND} puts homes under contract, then either wholesales the transaction (sells its own contract position), or closes and puts the property back on the market, sometimes listing with an agent.

THE CALL: the rep dialed ${a.name} of ${a.brokerage}, ${a.city}. The agent's character: ${a.persona}
The agent's buy box (what a good rep should have extracted): ${a.buybox}
The property in the rep's file: ${DISPO_PROPERTY.blurb}

CRITICAL CONTEXT FOR SCORING — the rep is NOT a licensed real estate agent. The rep IS allowed to state what ${DISPO_BRAND} wants for its own contract position (the wholesale ask in the file). The rep is NOT allowed to: claim or imply they are an agent, tell the agent what the property should be listed for, give an ARV or rehab estimate as fact, negotiate or counter on price, discuss the seller's personal situation or motivation, offer to pay an agent personally instead of through the brokerage, or accept any offer.

The rep MUST tell the agent the call is recorded, early, before anything substantive. Any natural wording counts ("this call is recorded", "just so you know we record these"). It applies even though the rep placed the call — two-party consent is about the recording, not about who dialled.

Score each rubric item 0, 1, or 2. Be a demanding trainer — a 2 means they did it well, not that they attempted it. If a conditional topic (e.g. commission) genuinely never came up in the call, score that item 2 and note "didn't come up".

RUBRIC (use these exact ids):
${rubricList}

BREACHES — boundary and consent. List each one that actually happened, with the rep's exact words (for a missing recording disclosure there is no quote — leave it out). Use ONLY these ids:
${breachList}

FAIRNESS: the rep may be a non-native English speaker and the transcript comes from ASR. Accent, grammar slips, and transcription artifacts are NOT scoring factors. Judge what they did, not how their English sounds.

Reply with ONLY valid JSON, no markdown fences:
{
  "kind": "dispo",
  "items": [ { "id": "identify", "score": 0, "note": "one specific sentence referencing what they actually did" } ],
  "breaches": [ { "id": "breach id from the list", "quote": "the rep's exact words" } ],
  "buybox_captured": [ "market", "price band", "rehab tolerance", "close speed", "pain point" ],
  "strongest_moment": { "what": "one line — the single best thing they did", "quote": "their exact words" },
  "weakest_moment": { "what": "one line — the costliest miss", "quote": "their exact words, or a description of the silence" },
  "questions_missed": [ "a specific question they should have asked and did not" ],
  "coaching_note": "2-3 sentences of blunt, useful coaching",
  "summary_note": "one line: the call in a sentence"
}
For "buybox_captured", include only the facts the rep actually got the agent to reveal.

TRANSCRIPT:
${transcript}`;
}

// ---------------------------------------------------------------------------
// Deterministic verdict
// ---------------------------------------------------------------------------

const RUBRIC_IDS = new Set(DISPO_RUBRIC.map((r) => r.id));
const BREACH_IDS = new Set(DISPO_BREACHES.map((b) => b.id));

export function dispoVerdict(parsed: any): {
  verdict: "PASS" | "FAIL";
  reason: string;
  total: number;
  max: number;
  breaches: { id: string; quote?: string }[];
} {
  // Only canonical rubric ids count, deduped — graders sometimes invent ids.
  const seen = new Set<string>();
  const items = (Array.isArray(parsed.items) ? parsed.items : []).filter((x: any) => {
    if (!RUBRIC_IDS.has(x?.id) || seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
  const total = items.reduce(
    (sum: number, x: any) => sum + Math.max(0, Math.min(2, Number(x.score) || 0)),
    0
  );

  const seenBreach = new Set<string>();
  const breaches = (Array.isArray(parsed.breaches) ? parsed.breaches : []).filter((b: any) => {
    if (!BREACH_IDS.has(b?.id) || seenBreach.has(b.id)) return false;
    seenBreach.add(b.id);
    return true;
  });

  const base = { total, max: DISPO_MAX_SCORE, breaches };
  if (breaches.length > 0) {
    const names = breaches
      .map((b: any) => DISPO_BREACHES.find((x) => x.id === b.id)?.desc ?? b.id)
      .join("; ");
    return { verdict: "FAIL", reason: `Boundary breach: ${names}`, ...base };
  }
  if (total < DISPO_PASS_SCORE)
    return {
      verdict: "FAIL",
      reason: `Scored ${total}/${DISPO_MAX_SCORE} — needs ${DISPO_PASS_SCORE} (85%)`,
      ...base,
    };
  return { verdict: "PASS", reason: "", ...base };
}
