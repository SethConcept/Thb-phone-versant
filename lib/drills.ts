// Per-module voice mini-drills — short, focused practice sessions that gate
// progression through the learning path. Each module (m2–m8) maps to one
// drill; the full Versant test unlocks when every module is complete.

import {
  PRESSURE_LINES,
  SHORT_ANSWERS,
  SELLER_PERSONAS,
  type PressureLine,
  type ShortAnswer,
  type SellerPersona,
} from "./academy";

// Extra item pools that exist only for drills (same shape as academy items).
// The "ten call models" module drills common calls that appear in the full
// test only as personas; the endings module drills how calls close.
export const MODEL_ITEMS: ShortAnswer[] = [
  {
    id: "just_looking",
    seller: "Honestly I'm just kind of looking around, seeing what's out there.",
    pass: "No pressure; treats it as a real lead. Asks how long they've been thinking about it and what's making them consider it now.",
    fail: "Writes them off, pitches hard, or pushes for an appointment without uncovering motivation.",
  },
  {
    id: "other_investors",
    seller: "I should tell you — I'm already talking to a couple of other investors.",
    pass: "Never attacks competitors. Asks whether any of them has actually seen the property and whether they've gotten anything in writing.",
    fail: "Bad-mouths competitors or claims superiority with invented numbers.",
  },
  {
    id: "realtor_more",
    seller: "My realtor friend says I'd get way more just listing it.",
    pass: "Makes it a real question: what matters more — the highest possible price, or certainty and less work? No realtor-bashing.",
    fail: "Attacks realtors or recites a canned list of cash-offer benefits without asking anything.",
  },
  {
    id: "needs_work",
    seller: "I'll be honest with you, the house needs a LOT of work.",
    pass: "Judgment-free: we look at properties in every condition — asks what they're dealing with and lets them describe it.",
    fail: "Diagnoses construction, estimates repair costs over the phone, or sounds put off by the condition.",
  },
  {
    id: "email_offer",
    seller: "Can you just email me an offer in writing first?",
    pass: "Explains a number sent without seeing the house is meaningless — WITHOUT using any example dollar figure — and offers the short visit instead.",
    fail: "Agrees to email an offer, or illustrates the point with a hypothetical dollar amount.",
  },
];

export const ENDING_ITEMS: ShortAnswer[] = [
  {
    id: "ready_handoff",
    seller: "Okay, you know what — I'm ready. I want to talk numbers with someone today. What happens now?",
    pass: "A concrete next step: connects them live with the closer if one is on shift, or offers two specific named times and asks which works.",
    fail: "Vague 'someone will call you', takes a message with no time, or tries to discuss numbers themselves.",
  },
  {
    id: "not_selling",
    seller: "Actually, I've thought about it — I'm not selling. I'd like you to stop calling me.",
    pass: "Gracious and immediate: thanks them and ends the call politely, leaving the door open. No pushback.",
    fail: "Keeps selling, argues, manufactures urgency, or asks 'why not' more than once.",
  },
];

// The three empathy personas the m7 drill draws from.
const EMPATHY_PERSONA_IDS = ["grieving", "quiet", "elderly"] as const;

// ---------------------------------------------------------------------------
// Drill definitions per module
// ---------------------------------------------------------------------------

export type DrillKind = "open" | "items" | "persona";

export type DrillDef = {
  module: string;
  title: string;
  kind: DrillKind;
  intro: string; // one line shown to the trainee before starting
  // items drills
  pool?: ShortAnswer[] | PressureLine[];
  drawCount?: number;
  // persona drills
  personaPool?: string[];
  // persona drills: criteria ids from DRILL_CRITERIA graded for pass
  personaCriteria?: { id: string; label: string }[];
};

export const DRILLS: Record<string, DrillDef> = {
  m2: {
    module: "m2",
    title: "The Open",
    kind: "open",
    intro: "The phone rings twice. Deliver your full open each time — name, recording line, and don't forget how they heard about us.",
  },
  m3: {
    module: "m3",
    title: "Pressure lines",
    kind: "items",
    intro: "Three lines engineered to bait a banned response. Answer each exactly as you would live.",
    pool: PRESSURE_LINES,
    drawCount: 3,
  },
  m4: {
    module: "m4",
    title: "Seller questions",
    kind: "items",
    intro: "Three common seller questions. Answer each one the approved way.",
    pool: SHORT_ANSWERS.filter((x) => ["scam", "howfast", "howcalc", "fair", "spouse"].includes(x.id)),
    drawCount: 3,
  },
  m5: {
    module: "m5",
    title: "The common calls",
    kind: "items",
    intro: "Three callers you'll hear every week. Handle each line.",
    pool: [...MODEL_ITEMS, ...SHORT_ANSWERS.filter((x) => x.id === "juanonly")],
    drawCount: 3,
  },
  m6: {
    module: "m6",
    title: "Hard situations",
    kind: "items",
    intro: "Three complicated-house situations. Gather — don't diagnose, don't promise.",
    pool: [
      ...SHORT_ANSWERS.filter((x) => ["probate", "tenants", "attorney", "howfast"].includes(x.id)),
      ...PRESSURE_LINES.filter((x) => ["lien", "fees"].includes(x.id)),
    ],
    drawCount: 3,
  },
  m7: {
    module: "m7",
    title: "Being a person",
    kind: "persona",
    intro: "A short call with a seller who needs you to be human first. Two to three minutes.",
    personaPool: [...EMPATHY_PERSONA_IDS],
    personaCriteria: [
      { id: "acknowledged", label: "Acknowledged the human moment before returning to the house" },
      { id: "pace", label: "Matched the caller's pace — no talking over, no filling silence with pitch" },
      { id: "natural", label: "Sounded like a person, not a script" },
    ],
  },
  m8: {
    module: "m8",
    title: "Endings",
    kind: "items",
    intro: "Three calls at the moment they end. Land the right next step every time.",
    pool: [...ENDING_ITEMS, ...PRESSURE_LINES.filter((x) => ["callback", "mailer"].includes(x.id))],
    drawCount: 3,
  },
};

// ---------------------------------------------------------------------------
// Draw + resolve (stored in interviews.exam_meta for drill attempts)
// ---------------------------------------------------------------------------

export type DrillDraw = {
  kind: "drill";
  module: string;
  items?: string[]; // item ids (items drills)
  persona?: string; // persona id (persona drills)
};

function pickN<T extends { id: string }>(pool: T[], n: number): T[] {
  const copy = [...pool];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function drawDrill(moduleId: string): DrillDraw | null {
  const def = DRILLS[moduleId];
  if (!def) return null;
  if (def.kind === "items") {
    return {
      kind: "drill",
      module: moduleId,
      items: pickN(def.pool!, def.drawCount ?? 3).map((x) => x.id),
    };
  }
  if (def.kind === "persona") {
    const id = def.personaPool![Math.floor(Math.random() * def.personaPool!.length)];
    return { kind: "drill", module: moduleId, persona: id };
  }
  return { kind: "drill", module: moduleId }; // open drill needs no draw
}

const ALL_ITEMS: (ShortAnswer | PressureLine)[] = [
  ...PRESSURE_LINES,
  ...SHORT_ANSWERS,
  ...MODEL_ITEMS,
  ...ENDING_ITEMS,
];

export function resolveDrillDraw(draw: DrillDraw): {
  def: DrillDef;
  items: (ShortAnswer | PressureLine)[];
  persona: SellerPersona | null;
} {
  const def = DRILLS[draw.module];
  const items = (draw.items ?? [])
    .map((id) => ALL_ITEMS.find((x) => x.id === id))
    .filter(Boolean) as (ShortAnswer | PressureLine)[];
  const persona = draw.persona
    ? SELLER_PERSONAS.find((p) => p.id === draw.persona) ?? null
    : null;
  return { def, items, persona };
}

// Deterministic pass rule per drill kind — the grader reports facts, the
// code decides. Any hard fail always fails the drill.
export function drillVerdict(
  draw: DrillDraw,
  parsed: any
): { pass: boolean; reason: string; summary: string } {
  const def = DRILLS[draw.module];
  const hardFails = Array.isArray(parsed.hard_fails) ? parsed.hard_fails : [];
  if (hardFails.length > 0)
    return {
      pass: false,
      reason: `Hard fail: ${hardFails.map((h: any) => h.rule).join(", ")}`,
      summary: "hard fail",
    };

  if (def.kind === "open") {
    const a = parsed.part_a ?? {};
    const ok =
      a.recording_disclosure === true &&
      a.name_given === true &&
      a.source_question === true &&
      Number(a.delivery) >= 3;
    return {
      pass: ok,
      reason: ok
        ? ""
        : [
            a.recording_disclosure !== true && "missed the recording disclosure",
            a.name_given !== true && "no name",
            a.source_question !== true && "never asked how they heard of us",
            Number(a.delivery) < 3 && "delivery too far from the mandatory open",
          ]
            .filter(Boolean)
            .join("; "),
      summary: `delivery ${a.delivery ?? "—"}/5`,
    };
  }

  if (def.kind === "items") {
    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const passed = items.filter((x: any) => x?.pass === true).length;
    const total = items.length || (draw.items?.length ?? 0);
    const ok = total > 0 && total - passed <= 1; // max one miss
    return {
      pass: ok,
      reason: ok ? "" : `Missed ${total - passed} of ${total} — max 1 miss`,
      summary: `${passed}/${total} items`,
    };
  }

  // persona
  const criteria = parsed.criteria ?? {};
  const list = def.personaCriteria ?? [];
  const hit = list.filter((c) => criteria[c.id] === true).length;
  const ok = hit === list.length;
  return {
    pass: ok,
    reason: ok
      ? ""
      : `Missed: ${list.filter((c) => criteria[c.id] !== true).map((c) => c.label).join("; ")}`,
    summary: `${hit}/${list.length} criteria`,
  };
}
