// Weakness → who to practice against.
//
// A coach report tells a trainee WHAT they missed. This turns that into a
// specific caller who will make them do it again. Keyed off the labels the
// report already produces, so nothing new has to be scored.
//
// Server-safe only — it names personas, so keep it out of client bundles
// (pages pass the resolved suggestion down as plain props).

import { CERT_SELLERS } from "./academy";

export type PracticeSuggestion = {
  /** Persona id to dial. */
  id: string;
  /** Desk-safe label — never reveals what the caller is testing. */
  label: string;
  /** Why this caller, phrased for the trainee. */
  because: string;
};

type Rule = { match: RegExp; personas: string[]; because: string };

// Order matters — the first rule that matches a recommendation wins.
const RULES: Rule[] = [
  {
    match: /price|dollar|zillow|redfin|figure|number|negotiat|comp\b/i,
    personas: ["curtis", "victor"],
    because: "they push hard for a number — practice holding the line without one",
  },
  {
    match: /next step|appointment|book|follow.?up|two (named )?times|close/i,
    personas: ["larry", "dave"],
    because: "cooperative callers, so the only thing left to get right is the next step",
  },
  {
    match: /motivation|why.*sell|discover|situation/i,
    personas: ["marguerite", "dolores"],
    because: "they won't volunteer their reason — you have to draw it out",
  },
  {
    match: /as.?is|inspect|retrade|lower the (price|offer)|went down|contingen/i,
    personas: ["arthur"],
    because: "they take the as-is question apart — practice answering it instead of transferring",
  },
  {
    match: /trust|probate|power of attorney|\bpoa\b|estate|sibling|heir|beneficiar/i,
    personas: ["warren", "arthur"],
    because: "nobody on the call can sign on their own — practice finding the signer first",
  },
  {
    match: /decision|spouse|owner|authority|who else|title/i,
    personas: ["yvette", "renee", "warren"],
    because: "more than one person has to say yes — practice finding that out early",
  },
  {
    match: /repeat|confirm|clarif|misheard|talked over|interrupt|too fast|stack/i,
    personas: ["minh"],
    because: "a hard line and a second language — practice slowing down and confirming back",
  },
  {
    match: /objection|pressure|pushback|argu|calm|tone|natural|rapport|acknowledg/i,
    personas: ["ray", "sam"],
    because: "they come in hot — practice staying calm and staying in control",
  },
  {
    match: /agent|commission|brokerage|licens|lane|disclosure/i,
    personas: ["denise"],
    because: "she asks the questions that make people accidentally act like an agent",
  },
  {
    match: /condition|timeline|qualif|address|property|occupan/i,
    personas: ["curtis", "yvette"],
    because: "plenty to qualify here — address, condition, occupancy, timeline",
  },
  {
    match: /escalat|closer|hand.?off|juan/i,
    personas: ["jonathan"],
    because: "the call where deciding it yourself — either way — is the mistake",
  },
  {
    match: /buy box|manufactured|mobile|out of state|kind no|decline/i,
    personas: ["terri", "marcus"],
    because: "the right answer is a warm, clear no — practice giving one",
  },
  {
    match: /silence|listen|interrupt|talked over|pace|open question/i,
    personas: ["marguerite"],
    because: "she answers in two words and stops — practice letting silence work",
  },
];

const labelOf = (id: string) => CERT_SELLERS.find((s) => s.id === id)?.label ?? id;

/**
 * Pick up to `limit` callers who drill the weaknesses in a report.
 * `recommendations` are the report's own lines; `exclude` is usually the
 * persona they just failed, so they get a different angle on it.
 */
export function suggestPractice(
  recommendations: string[],
  exclude?: string,
  limit = 2
): PracticeSuggestion[] {
  const out: PracticeSuggestion[] = [];
  const taken = new Set<string>(exclude ? [exclude] : []);

  for (const rec of recommendations) {
    for (const rule of RULES) {
      if (!rule.match.test(rec)) continue;
      for (const id of rule.personas) {
        if (taken.has(id) || !CERT_SELLERS.some((s) => s.id === id)) continue;
        taken.add(id);
        out.push({ id, label: labelOf(id), because: rule.because });
        if (out.length >= limit) return out;
      }
      break; // one rule per recommendation line
    }
  }
  return out;
}
