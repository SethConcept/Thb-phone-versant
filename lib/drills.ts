// The drill room — OPTIONAL coached practice, never pass/fail and never
// gating. Draws from the combined question pool built across the whole
// learning path; the AI coach delivers each seller line, hears the answer,
// gives short spoken advice on the spot, then moves on (or ends).

import {
  PRESSURE_LINES,
  SHORT_ANSWERS,
  type PressureLine,
  type ShortAnswer,
} from "./academy";

// Extra pools (same item shape) covering the "ten call models" and endings
// lessons — part of the drill-room pool and usable as cert weave-ins labels.
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

// Everything the learning path teaches, in one pool.
export const DRILL_POOL: (PressureLine | ShortAnswer)[] = [
  ...PRESSURE_LINES,
  ...SHORT_ANSWERS,
  ...MODEL_ITEMS,
  ...ENDING_ITEMS,
];

export type PracticeDraw = {
  kind: "drill";
  items: string[]; // 1 or 3 ids from DRILL_POOL
};

export const PRACTICE_MODES: Record<string, { count: number; title: string; intro: string; capMs: number }> = {
  one: {
    count: 1,
    title: "Quick drill",
    intro: "One seller line from anywhere in the course. Answer it, get instant coaching, done in a minute.",
    capMs: 3 * 60 * 1000,
  },
  three: {
    count: 3,
    title: "Three in a row",
    intro: "Three seller lines, back to back, from anywhere in the course. Coaching after each answer.",
    capMs: 6 * 60 * 1000,
  },
};

export function drawPractice(mode: string): PracticeDraw {
  const count = PRACTICE_MODES[mode]?.count ?? 1;
  const copy = [...DRILL_POOL];
  const out: string[] = [];
  while (out.length < count && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0].id);
  }
  return { kind: "drill", items: out };
}

export function resolvePractice(draw: PracticeDraw): (PressureLine | ShortAnswer)[] {
  return draw.items
    .map((id) => DRILL_POOL.find((x) => x.id === id))
    .filter(Boolean) as (PressureLine | ShortAnswer)[];
}
