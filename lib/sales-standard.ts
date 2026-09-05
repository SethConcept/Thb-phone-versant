// THE THB SALES STANDARD
//
// The scoring standard for REAL seller calls — the ones that actually came
// in on the phone, with no persona, no scripted draw and no ground truth
// about the property. This is what the paste-a-transcript grader uses, and
// what a real-call monitoring pipeline will use when one exists.
//
// ── CALIBRATED AGAINST REAL CALLS, 2026-09 ────────────────────────────────
// The first version of this file graded every call against one rubric and
// said so itself: "the weights are provisional until real game film replaces
// them." Fifty-two real calls later (`data/real-calls/`, analysis in
// docs/CALL-FINDINGS.md), the structural finding was bigger than the weights:
//
//   THERE ARE TWO JOBS ON THIS PHONE AND ONE RUBRIC CANNOT GRADE BOTH.
//
//   INTAKE      answers the line, qualifies, protects the number, books the
//               visit. Quoting a price is a hard fail — the desk has not seen
//               the house and any figure it says anchors everything after it.
//   ACQUISITION takes the transfer, presents the offer WITH the arithmetic,
//               holds the sequence, negotiates to a floor, closes. Quoting a
//               price is the job. Grading it as a breach failed the company's
//               best calls.
//
// So the rubric takes a role. Everything below is split accordingly.
//
// Both roles are still split into two SCORES on purpose:
//
//   CALL SKILL (80 pts) — everything a recording can actually prove.
//   PROCESS COMPLIANCE (20 pts) — follow-up, CRM routing, response time.
//     Not scored from the transcript, because it isn't in the transcript.
//     Speed to lead is the one piece a seller sometimes says out loud
//     (call-06) — when they do, it belongs in the coaching note, not the score.

import {
  HARD_FAILS,
  MANDATORY_OPEN,
  OUTBOUND_DISCLOSURE,
  SOURCE_QUESTION,
  BUYBOX_RULES,
} from "./academy";
import { SELLER_BRAND } from "./brand";

/** Which seat was on the call. Everything downstream branches on this. */
export type CallRole = "intake" | "acquisition";

export const ROLE_LABEL: Record<CallRole, string> = {
  intake: "Intake desk",
  acquisition: "Acquisitions",
};

export const ROLE_BLURB: Record<CallRole, string> = {
  intake:
    "Answered the line, qualified the property and the seller's authority to sell it, and booked the visit. Never gives a number.",
  acquisition:
    "Took the handoff, presented the offer with the arithmetic behind it, held the sequence, and closed to a written next step. Gives numbers — and has to justify them.",
};

export type StandardCategory = {
  id: string;
  name: string;
  points: number;
  /** What a full-marks answer looks like — sent to the grader verbatim. */
  looksLike: string;
  /** What loses points — sent to the grader verbatim. */
  losesPoints: string;
};

// ---------------------------------------------------------------------------
// INTAKE — 80 points
// ---------------------------------------------------------------------------

const INTAKE_SKILL: StandardCategory[] = [
  {
    id: "rapport",
    name: "Rapport and control",
    points: 10,
    looksLike:
      "Opened with the branded greeting and their own first name, used the caller's name back, acknowledged anything human (a death, a divorce, a bad line, a barking dog) before returning to the house, and kept a natural back-and-forth. Kept hold of the call rather than reaching for a transfer at the first hard question.",
    losesPoints:
      "Robotic or rushed, talked over the seller, ignored an emotional disclosure, ran a checklist with no human response between items, left long unexplained dead air ('let me just check here…'), over-apologised, or handed the call off to escape a question they could have answered.",
  },
  {
    id: "motivation",
    name: "Motivation discovery",
    points: 12,
    looksLike:
      "Found out WHY they are selling and what happens to them if it does or doesn't sell — the real reason, not 'thinking about it'. Asked a follow-up to get under the first answer.",
    losesPoints:
      "Never asked why, accepted a vague reason without probing, or collected property facts while learning nothing about the person's situation.",
  },
  {
    id: "qualification",
    name: "Property qualification",
    points: 15,
    looksLike:
      "Got the full address, condition, occupancy (owner / tenant / vacant / squatter), and timeline. Established enough to know whether it fits the buy box.",
    losesPoints:
      "Missing address, never asked about condition or occupancy, or no timeline at all.",
  },
  {
    id: "authority",
    name: "Authority to sell",
    points: 10,
    looksLike:
      "Established WHO can actually sign: who is on title, whether it sits in a trust or an estate, whether a power of attorney is involved, and who else has to agree. On a call with siblings, heirs or a co-trustee, found out how those people get to a decision together.",
    losesPoints:
      "Never asked who is on title, took 'it's my mom's house' at face value, discovered a second decision-maker only at the end, or booked a visit without knowing whether the person on the phone can sell.",
  },
  {
    id: "price",
    name: "Price discipline",
    points: 10,
    looksLike:
      "Handled price WITHOUT giving a number: may ask what the seller has in mind, explains that the number comes after someone has seen it, and moves on. Never anchors, never validates a figure, never quotes a percentage of market value.",
    losesPoints:
      "Gave or confirmed any figure, offered a range or a percentage of market value, argued about value, cited comps or Zillow, or got pulled into negotiating on the phone.",
  },
  {
    id: "objections",
    name: "Objection handling",
    points: 13,
    looksLike:
      "Answered what was actually asked. Handled the standard objections in their own words — why an as-is buyer still inspects, why the offer won't drop afterwards, what makes us different from the last buyer who retraded them. Turned a delay into a next step (a spouse who must be present becomes a scheduling opportunity).",
    losesPoints:
      "Dodged the question, argued, over-promised to make the objection go away, invented an answer, said a version of 'I'm not the one who handles that' where an answer existed, or let an objection end the call with nothing gained.",
  },
  {
    id: "next_step",
    name: "Next step and appointment",
    points: 10,
    looksLike:
      "Ended on ONE specific agreed step — a live handoff, a booked visit, or two named times — with a named person attached, confirmed back to the seller.",
    losesPoints:
      "'Someone will call you soon', no time named, no person named, no confirmation, or the call simply ended.",
  },
];

// ---------------------------------------------------------------------------
// ACQUISITION — 80 points
// ---------------------------------------------------------------------------

const ACQUISITION_SKILL: StandardCategory[] = [
  {
    id: "rapport",
    name: "Rapport and control",
    points: 8,
    looksLike:
      "Re-established who they are and why they're calling, kept the seller oriented, and stayed steady through bad news, delays and other people's mistakes without either blaming or grovelling.",
    losesPoints:
      "Cold open with no context, talked over the seller, or absorbed fault repeatedly for something outside their control instead of stating it plainly once.",
  },
  {
    id: "motivation",
    name: "Situation re-confirmed",
    points: 10,
    looksLike:
      "Confirmed what is actually driving the timeline before talking money — what has changed since the visit, who else is now involved, what the seller needs to have happen.",
    losesPoints:
      "Went straight to the number without re-checking the situation, or missed a change (a competing offer, a new decision-maker, a deadline) that was there to be found.",
  },
  {
    id: "arithmetic",
    name: "Showed the arithmetic",
    points: 15,
    looksLike:
      "Presented the number WITH the reasoning: what comparable properties sold for, what the rehab costs, what the required margin is, and — where relevant — the cost of the capital. The seller can see how the figure was reached, even if they don't like it.",
    losesPoints:
      "Delivered a bare number, hid behind 'that's just what we can do', invented figures that don't reconcile, or quoted comps and rehab costs so vaguely that the seller has nothing to evaluate.",
  },
  {
    id: "sequence",
    name: "Sequence discipline",
    points: 12,
    looksLike:
      "Stated and held the process: we inspect first, then make an offer, the offer is non-contingent, and we don't come back later and lower it. Said so explicitly when the seller feared a retrade, and did not create a caveat that quietly reopens the price.",
    losesPoints:
      "Let the sequence blur, hinted the number could move after further inspection, promised something outside their authority, or committed to a closing date the process can't support.",
  },
  {
    id: "authority",
    name: "Authority and title",
    points: 10,
    looksLike:
      "Confirmed who signs and what stands in the way of a clean title — trust, estate, POA, co-owners, liens, payoffs — and got every decision-maker into the conversation or explicitly scheduled.",
    losesPoints:
      "Negotiated with someone who cannot sign, discovered a sibling or lien late, or left the ownership structure vague going into contract.",
  },
  {
    id: "objections",
    name: "Objections and competition",
    points: 15,
    looksLike:
      "Answered what was asked. Against a competing offer, taught the seller what to check — earnest money, contingency clauses, proof of funds — instead of attacking the other buyer. Held a floor without arguing.",
    losesPoints:
      "Trashed the competitor, made claims about them that can't be supported, chased the other offer with an unjustified number, dodged, or invented an answer on escrow, title or legal questions instead of routing them.",
  },
  {
    id: "next_step",
    name: "Close and next step",
    points: 10,
    looksLike:
      "Ended on ONE specific agreed step with a named owner and a time — contract sent, addendum signed, callback at a named hour — and confirmed it back.",
    losesPoints:
      "Vague follow-up, no owner named, or the number left hanging with nothing scheduled.",
  },
];

export const ROLE_SKILL: Record<CallRole, StandardCategory[]> = {
  intake: INTAKE_SKILL,
  acquisition: ACQUISITION_SKILL,
};

/** Back-compat: callers that predate roles get the intake rubric. */
export const CALL_SKILL = INTAKE_SKILL;

/** Process compliance: 20 points, reserved — not gradeable from audio. */
export const PROCESS_COMPLIANCE = {
  id: "process",
  name: "Follow-up and process compliance",
  points: 20,
  note:
    "Response time, CRM routing, whether the follow-up actually happened, and whether the lead reached the right person. None of this is observable in a call recording — it needs the CRM and phone-system data. Scored separately once that source exists.",
};

export const CALL_SKILL_MAX = 80;
export const STANDARD_MAX = CALL_SKILL_MAX + PROCESS_COMPLIANCE.points; // 100

/** Bands for the call-skill score, normalised to 100. */
export const BANDS = { strong: 85, solid: 70, developing: 55 };

// ---------------------------------------------------------------------------
// Breaches — which of the absolute rules apply to which seat
// ---------------------------------------------------------------------------

// Intake has not seen the house. Any number it says becomes the anchor for
// every conversation after it, so the whole list applies.
const INTAKE_BREACHES = HARD_FAILS.map((h) => h.id as string);

// Acquisitions quotes numbers for a living. Grading that as a breach failed
// the company's best calls (docs/CALL-FINDINGS.md §3), so the price rules come
// out and are replaced by the arithmetic criterion — the question is not
// whether a figure was said, it is whether it was justified. What stays
// forbidden is inventing, over-promising and pressure.
const ACQUISITION_BREACHES = ["invented", "net_check", "pressure", "mailer"];

export const ROLE_BREACHES: Record<CallRole, string[]> = {
  intake: INTAKE_BREACHES,
  acquisition: ACQUISITION_BREACHES,
};

/**
 * Recording disclosure. Not in HARD_FAILS because that list is about things
 * the rep SAID; this is about something nobody said.
 *
 * The corpus found zero human disclosures in 52 recorded calls, which was
 * first surfaced as a team-level policy alert rather than an individual fail
 * — failing every rep for a company-wide practice tells you nothing about any
 * of them. Juan ruled on 2026-09: the line goes in. So it is a scored
 * compliance breach for both seats and both directions, and an undisclosed
 * call is unsafe no matter how well it went.
 */
export const DISCLOSURE_RULE = {
  id: "no_disclosure",
  label:
    "Never told the caller the call is recorded. California is a two-party-consent state and every one of these calls is recorded and transcribed.",
};

export type StandardScore = {
  role: CallRole;
  /** Raw call-skill points out of CALL_SKILL_MAX. */
  points: number;
  /** Call skill normalised to 0–100 — the headline number. */
  score100: number;
  band: "Strong" | "Solid" | "Developing" | "Needs work";
  /** Any compliance breach = the call is unsafe regardless of score. */
  safe: boolean;
  categories: { id: string; name: string; got: number; max: number; note: string }[];
  breaches: { rule: string; quote?: string }[];
  /**
   * Rules the call missed that are POLICY, not personal performance — today
   * that means the recording disclosure, which no human on this phone gives
   * (docs/CALL-FINDINGS.md §2). Surfaced for the team, never scored against
   * the individual: failing every rep for a company-wide practice makes the
   * tool useless and buries the actual legal exposure.
   */
  policyAlerts: { id: string; label: string }[];
};

// ---------------------------------------------------------------------------
// The prompt — for a REAL call with no persona and no ground truth
// ---------------------------------------------------------------------------

export function salesStandardPrompt(
  transcript: string,
  context?: string,
  role: CallRole = "intake"
) {
  const skill = ROLE_SKILL[role];
  const cats = skill
    .map(
      (c) =>
        `- id "${c.id}" — ${c.name.toUpperCase()} (0-${c.points} points)\n  FULL MARKS: ${c.looksLike}\n  LOSES POINTS: ${c.losesPoints}`
    )
    .join("\n");

  const allowed = new Set(ROLE_BREACHES[role]);
  const hardFailList = HARD_FAILS.filter((h) => allowed.has(h.id))
    .map((h) => `- "${h.id}": ${h.label}`)
    .join("\n");

  const seatRules =
    role === "intake"
      ? `THE SEAT: this is the INTAKE DESK. They answer the line, qualify, and book the visit. They have NOT seen the property. They must never give a price, a range, or a percentage of market value — the number comes after someone walks the house. Their job ends at a booked next step.`
      : `THE SEAT: this is ACQUISITIONS. They took the handoff after the property was seen. Quoting a number IS their job — do NOT treat a price, an offer, a rehab estimate or a comparable as a violation. Judge instead whether the number was JUSTIFIED: did the seller hear the reasoning behind it? Negotiating, holding a floor, and explaining escrow mechanics are all in scope.`;

  return `You are grading a REAL recorded ${SELLER_BRAND} seller call against the THB Sales Standard. A homeowner (or someone calling about a property) was on the phone with a company representative. Grade the REPRESENTATIVE only.

This is a real call, not a scripted exercise: you do NOT know the seller's true situation beyond what is said, and there is no answer key. Judge only what the transcript shows.

${seatRules}
${context ? `\nCONTEXT PROVIDED BY THE REVIEWER: ${context}\n` : ""}
THE COMPANY'S PHONE RULES:
- Every inbound call should open close to: "${MANDATORY_OPEN}"
- Every OUTBOUND call should disclose it too, early: "${OUTBOUND_DISCLOSURE}"
- The recording disclosure is REQUIRED on every call in either direction. Any natural wording counts ("this call is recorded", "we record our calls for quality", "just so you know I'm recording this"). It does not have to be the first sentence, but it has to happen before anything substantive is collected. Report it honestly in opening.recording_disclosure — the code, not you, decides what that costs.
- Every call should ask, at some point: "${SOURCE_QUESTION}" (any natural how-did-you-hear phrasing counts)
- NEVER manufacture urgency, invent statistics, or claim the offer equals what the seller nets.
- NEVER discuss a mailer/letter/check amount — it must be routed, not explained.
- NEVER give legal, tax or eviction advice, however directly asked.
${role === "intake" ? "- NEVER any price, range, comp, Zillow/Redfin figure, percentage of market value, or hypothetical dollar amount.\n- NEVER promise an on-the-spot offer, and never state the rep's own location." : "- Numbers ARE allowed and expected in this seat; they must be explained, not merely asserted."}

BUY BOX:${BUYBOX_RULES}

SCORE THESE CATEGORIES. Award whole points, and be a demanding trainer — full marks means they did it well, not that they attempted it. If a category genuinely never became relevant in this call (a signature-chasing follow-up has no motivation discovery to do), award full points and say "didn't arise" in the note.
${cats}

COMPLIANCE BREACHES — scan the ENTIRE transcript. A breach makes the call unsafe no matter how good the score. Record the rule id and the rep's exact words:
${hardFailList}

ALSO REPORT:
- opening: did they give a name, disclose recording, and ask how the caller found us? (three booleans)
- strongest_moment: the single best thing they did, with their exact words.
- weakest_moment: the single costliest miss, with the exact words (or the silence) where it happened.
- questions_missed: the specific questions they should have asked and did not.

FAIRNESS — this matters more on these calls than on any scripted one. The transcript comes from automatic speech recognition and WILL contain mis-transcriptions, dropped words and mangled names. Many representatives AND many sellers are speaking English as a second language, sometimes on a poor line. Accent, dialect, grammar, repetition and confirming things twice are NOT scoring factors — on a bilingual call, repeating something back to confirm it is good practice, not a weakness. Judge substance and rule-following. If a possible breach looks like a transcription artifact rather than a real violation, do not report it as a breach — mention it in coaching_note instead.

Return ONLY valid JSON, no markdown fences:
{
  "kind": "standard",
  "role": "${role}",
  "categories": [ { "id": "${skill[0].id}", "got": 0, "note": "one specific sentence citing what they actually did" } ],
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

export function scoreAgainstStandard(parsed: any, role: CallRole = "intake"): StandardScore {
  const skill = ROLE_SKILL[role];
  const catIds = new Set(skill.map((c) => c.id));
  const ruleIds = new Set(ROLE_BREACHES[role]);

  const seen = new Set<string>();
  const categories = skill.map((c) => {
    const row = (Array.isArray(parsed.categories) ? parsed.categories : []).find(
      (x: any) => x?.id === c.id && catIds.has(x.id) && !seen.has(x.id)
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
      if (!ruleIds.has(b?.rule) || seenRule.has(b.rule)) return false;
      seenRule.add(b.rule);
      return true;
    })
    .map((b: any) => ({ rule: b.rule, quote: b.quote || undefined }));

  // Ruled a real compliance breach, 2026-09 — see DISCLOSURE_RULE.
  if (parsed?.opening?.recording_disclosure === false)
    breaches.push({ rule: DISCLOSURE_RULE.id, quote: undefined });

  // Policy, not performance — see StandardScore.policyAlerts.
  const policyAlerts: { id: string; label: string }[] = [];
  if (parsed?.opening?.source_question === false)
    policyAlerts.push({
      id: "source_question",
      label: "Never asked how the caller found us — the lead source went uncaptured.",
    });

  const band =
    score100 >= BANDS.strong
      ? "Strong"
      : score100 >= BANDS.solid
        ? "Solid"
        : score100 >= BANDS.developing
          ? "Developing"
          : "Needs work";

  return {
    role,
    points,
    score100,
    band,
    safe: breaches.length === 0,
    categories,
    breaches,
    policyAlerts,
  };
}
