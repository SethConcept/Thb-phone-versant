// THE THB SALES STANDARD
//
// The scoring standard for REAL seller calls — the ones that actually came
// in on the phone, with no persona, no scripted draw and no ground truth
// about the property. This is what the paste-a-transcript grader uses, and
// what a real-call monitoring pipeline will use when one exists.
//
// Structure follows the operations spec: weighted categories totalling 100.
// It is split into TWO scores on purpose:
//
//   CALL SKILL (80 pts) — everything a recording can actually prove.
//   PROCESS COMPLIANCE (20 pts) — follow-up, CRM routing, response time.
//     None of that is audible in a call, so it is NOT scored from the
//     transcript. It stays reserved until a CRM/telephony data source
//     exists; scoring it from audio would be inventing evidence.
//
// ⚠️ THE WEIGHTS BELOW ARE PROVISIONAL. They come from the written Phone
// Academy rules, not from analysing real winning calls. Once the game film
// (real recordings + outcome labels) is analysed, replace these numbers with
// what actually separates a won call from a lost one. The STRUCTURE is
// intended to be final; the NUMBERS are placeholders.

import { HARD_FAILS, MANDATORY_OPEN, SOURCE_QUESTION, BUYBOX_RULES, SELLER_BRAND } from "./academy";

export type StandardCategory = {
  id: string;
  name: string;
  points: number;
  /** What a full-marks answer looks like — sent to the grader verbatim. */
  looksLike: string;
  /** What loses points — sent to the grader verbatim. */
  losesPoints: string;
};

/** Call skill: 80 points, all provable from the recording. */
export const CALL_SKILL: StandardCategory[] = [
  {
    id: "rapport",
    name: "Rapport and control",
    points: 10,
    looksLike:
      "Answered warmly and professionally, used the caller's name, acknowledged anything human (a death, a divorce, stress, a dog barking) before returning to the house, and kept a natural back-and-forth instead of an interrogation.",
    losesPoints:
      "Robotic or rushed, talked over the seller, ignored an emotional disclosure, or ran a checklist of questions with no human response between them.",
  },
  {
    id: "motivation",
    name: "Motivation discovery",
    points: 15,
    looksLike:
      "Found out WHY they are selling and what happens to them if it does or does not sell — the real reason, not just 'thinking about it'. Asked follow-up questions to get under the first answer.",
    losesPoints:
      "Never asked why, accepted a vague reason without probing, or collected property facts while learning nothing about the person's situation.",
  },
  {
    id: "qualification",
    name: "Property qualification",
    points: 15,
    looksLike:
      "Got the full address, condition, occupancy (owner/tenant/vacant), and timeline. Confirmed the caller actually owns it or has authority to sell. Established enough to know whether it fits the buy box.",
    losesPoints:
      "Missing address, never asked about condition or occupancy, no timeline, or never established whether the caller can actually sell the property.",
  },
  {
    id: "price",
    name: "Price conversation",
    points: 10,
    looksLike:
      "Handled price WITHOUT giving a number: may ask what the seller has in mind, explains that the owner prices it after seeing it, and moves on. Never argues, never anchors, never validates a figure.",
    losesPoints:
      "Gave or confirmed any figure, argued about value, cited comps or Zillow, or got pulled into negotiating on the phone.",
  },
  {
    id: "objections",
    name: "Objection handling",
    points: 15,
    looksLike:
      "Answered what was actually asked, stayed calm and honest, turned a delay into a next step (e.g. a spouse who must be present becomes a scheduling opportunity), and never improvised on anything outside their authority.",
    losesPoints:
      "Dodged the question, argued, over-promised to make the objection go away, invented an answer, or let an objection end the call with nothing gained.",
  },
  {
    id: "next_step",
    name: "Next step and appointment",
    points: 15,
    looksLike:
      "Ended on ONE specific agreed step — a live handoff, an appointment, or two named times for a callback — confirmed back to the seller. Both sides know exactly what happens next and when.",
    losesPoints:
      "'Someone will call you soon', no time named, no confirmation, or the call simply ended without an agreed step.",
  },
];

/** Process compliance: 20 points, reserved — not gradeable from audio. */
export const PROCESS_COMPLIANCE = {
  id: "process",
  name: "Follow-up and process compliance",
  points: 20,
  note:
    "Response time, CRM routing, whether the follow-up actually happened, and whether the lead reached the right person. None of this is observable in a call recording — it needs the CRM and phone-system data. Scored separately once that source exists.",
};

export const CALL_SKILL_MAX = CALL_SKILL.reduce((a, c) => a + c.points, 0); // 80
export const STANDARD_MAX = CALL_SKILL_MAX + PROCESS_COMPLIANCE.points; // 100

/** Provisional bands for the call-skill score, normalised to 100. */
export const BANDS = { strong: 85, solid: 70, developing: 55 };

export type StandardScore = {
  /** Raw call-skill points out of CALL_SKILL_MAX. */
  points: number;
  /** Call skill normalised to 0–100 — the headline number. */
  score100: number;
  band: "Strong" | "Solid" | "Developing" | "Needs work";
  /** Any compliance breach = the call is unsafe regardless of score. */
  safe: boolean;
  categories: { id: string; name: string; got: number; max: number; note: string }[];
  breaches: { rule: string; quote?: string }[];
};

// ---------------------------------------------------------------------------
// The prompt — for a REAL call with no persona and no ground truth
// ---------------------------------------------------------------------------

export function salesStandardPrompt(transcript: string, context?: string) {
  const cats = CALL_SKILL.map(
    (c) =>
      `- id "${c.id}" — ${c.name.toUpperCase()} (0-${c.points} points)\n  FULL MARKS: ${c.looksLike}\n  LOSES POINTS: ${c.losesPoints}`
  ).join("\n");

  const hardFailList = HARD_FAILS.map((h) => `- "${h.id}": ${h.label}`).join("\n");

  return `You are grading a REAL recorded ${SELLER_BRAND} seller call against the THB Sales Standard. A homeowner (or someone calling about a property) phoned in; a company representative handled the call. Grade the REPRESENTATIVE only.

This is a real call, not a scripted exercise: you do NOT know the seller's true situation beyond what is said, and there is no answer key. Judge only what the transcript shows.
${context ? `\nCONTEXT PROVIDED BY THE REVIEWER: ${context}\n` : ""}
THE COMPANY'S ABSOLUTE PHONE RULES:
- Every call should open close to: "${MANDATORY_OPEN}"
- Every call should ask, at some point: "${SOURCE_QUESTION}" (any natural how-did-you-hear phrasing counts)
- NEVER any price, range, comp, Zillow/Redfin figure, or hypothetical dollar amount.
- NEVER promise an on-the-spot offer. NEVER state or imply the rep's own location.
- NEVER discuss a mailer/letter/check amount — it must be routed, not explained.
- NEVER manufacture urgency, invent statistics, or claim the offer equals what the seller nets.

BUY BOX:${BUYBOX_RULES}

SCORE THESE SIX CATEGORIES. Award whole points, and be a demanding trainer — full marks means they did it well, not that they attempted it. If a category genuinely never became relevant in this call, award full points and say "didn't arise" in the note.
${cats}

COMPLIANCE BREACHES — scan the ENTIRE transcript. A breach makes the call unsafe no matter how good the score. Record the rule id and the rep's exact words:
${hardFailList}

ALSO REPORT:
- opening: did they give a name, disclose recording, and ask how the caller found us? (three booleans)
- strongest_moment: the single best thing they did, with their exact words.
- weakest_moment: the single costliest miss, with the exact words (or the silence) where it happened.
- questions_missed: the specific questions they should have asked and did not.

FAIRNESS: this transcript comes from automatic speech recognition and will contain mis-transcriptions; many reps speak English as a second language. Accent, dialect and minor grammar slips are NOT scoring factors. Judge substance and rule-following. If a possible breach looks like a transcription artifact rather than a real violation, do not report it as a breach — mention it in coaching_note instead.

Return ONLY valid JSON, no markdown fences:
{
  "kind": "standard",
  "categories": [ { "id": "rapport", "got": 0, "note": "one specific sentence citing what they actually did" } ],
  "opening": { "name_given": true|false, "recording_disclosure": true|false, "source_question": true|false },
  "breaches": [ { "rule": "rule id", "quote": "the rep's exact words" } ],
  "strongest_moment": { "what": "one line", "quote": "their words" },
  "weakest_moment": { "what": "one line", "quote": "their words, or a description of the silence" },
  "questions_missed": [ "question they should have asked" ],
  "coaching_note": "2-3 sentences: the single biggest thing to fix, and where in the call it showed",
  "summary_note": "one line: would you put this call in front of Juan as an example of how it should be done?"
}

TRANSCRIPT:
${transcript}`;
}

// ---------------------------------------------------------------------------
// Deterministic scoring — the model reports, the code decides
// ---------------------------------------------------------------------------

const CAT_IDS = new Set(CALL_SKILL.map((c) => c.id));
const RULE_IDS = new Set(HARD_FAILS.map((h) => h.id));

export function scoreAgainstStandard(parsed: any): StandardScore {
  const seen = new Set<string>();
  const categories = CALL_SKILL.map((c) => {
    const row = (Array.isArray(parsed.categories) ? parsed.categories : []).find(
      (x: any) => x?.id === c.id && CAT_IDS.has(x.id) && !seen.has(x.id)
    );
    if (row) seen.add(c.id);
    const got = Math.max(0, Math.min(c.points, Math.round(Number(row?.got) || 0)));
    return { id: c.id, name: c.name, got, max: c.points, note: row?.note || "" };
  });

  const points = categories.reduce((a, c) => a + c.got, 0);
  const score100 = Math.round((points / CALL_SKILL_MAX) * 100);

  const seenRule = new Set<string>();
  const breaches = (Array.isArray(parsed.breaches) ? parsed.breaches : [])
    .filter((b: any) => {
      if (!RULE_IDS.has(b?.rule) || seenRule.has(b.rule)) return false;
      seenRule.add(b.rule);
      return true;
    })
    .map((b: any) => ({ rule: b.rule, quote: b.quote || undefined }));

  const band =
    score100 >= BANDS.strong
      ? "Strong"
      : score100 >= BANDS.solid
        ? "Solid"
        : score100 >= BANDS.developing
          ? "Developing"
          : "Needs work";

  return { points, score100, band, safe: breaches.length === 0, categories, breaches };
}
