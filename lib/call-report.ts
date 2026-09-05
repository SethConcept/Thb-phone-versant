// Turns a stored score row into a plain, serializable coach report.
//
// SERVER ONLY by construction: it imports the academy/dispo content (which
// carries persona scripts). Client components must receive the returned
// ReportData as props — never import this module.

import {
  DRILL_CRITERIA,
  HARD_FAILS,
  PRESSURE_LINES,
  SHORT_ANSWERS,
  SELLER_PERSONAS,
  CERT_SELLERS,
} from "@/lib/academy";
import { MODEL_ITEMS, ENDING_ITEMS } from "@/lib/drills";
import {
  DISPO_RUBRIC,
  DISPO_BREACHES,
  DISPO_MAX_SCORE,
  DISPO_AGENTS,
  DISPO_GATE,
} from "@/lib/dispo";

export type Audience = "admin" | "trainee";

export type ReportBar = { label: string; got: number; max: number };
export type ReportFlag = { label: string; quote?: string };

export type ReportData = {
  graded: boolean;
  pass: boolean;
  headline: string;
  /** e.g. "17 / 24" — null when the mode has no single total */
  scoreText: string | null;
  /** 0–100 roll-up across the bars, for the list column */
  score100: number | null;
  whoLabel: string; // "Seller" | "Agent"
  who: string;
  note: string | null;
  passRule: string | null;
  bars: ReportBar[];
  strengths: string[];
  recommendations: string[];
  flags: ReportFlag[];
  coaching: string | null;
  extra: string | null;
};

const ALL_ITEMS = [...PRESSURE_LINES, ...SHORT_ANSWERS, ...MODEL_ITEMS, ...ENDING_ITEMS];
export const itemLabel = (id: string) => ALL_ITEMS.find((x) => x.id === id)?.seller ?? id;

export const personaLabel = (id?: string) =>
  CERT_SELLERS.find((x) => x.id === id)?.label ??
  SELLER_PERSONAS.find((x) => x.id === id)?.label ??
  id ??
  "—";

export const hardFailLabel = (id: string) =>
  HARD_FAILS.find((x) => x.id === id)?.label ?? id;

export const dispoAgentLabel = (id?: string) =>
  DISPO_AGENTS.find((a) => a.id === id)?.label ?? id ?? "—";

const dispoRubricName = (id: string) => DISPO_RUBRIC.find((r) => r.id === id)?.name ?? id;
const dispoBreachDesc = (id: string) => DISPO_BREACHES.find((b) => b.id === id)?.desc ?? id;

export function verdictClass(v?: string) {
  if (v === "PASS") return "score-pass";
  if (v === "BORDERLINE") return "score-borderline";
  return "score-fail";
}

// Coach-report bar groups for the dispo rubric (each item is 0–2)
const DISPO_GROUPS: { label: string; ids: string[] }[] = [
  { label: "Opening", ids: ["identify", "reason", "position", "stop_talking"] },
  { label: "Boundaries", ids: ["disclosure", "lane"] },
  { label: "Pricing", ids: ["pricing_handback", "commission"] },
  { label: "Buy box", ids: ["buybox", "pain"] },
  { label: "Wrap-up", ids: ["next_step", "tone"] },
];

const roll = (bars: ReportBar[]) => {
  const max = bars.reduce((a, b) => a + b.max, 0);
  const got = bars.reduce((a, b) => a + b.got, 0);
  return max > 0 ? Math.round((got / max) * 100) : null;
};

const headlineFor = (pass: boolean) =>
  pass ? "Passed — counts toward certification" : "Keep training — see recommendations";

export function buildCallReport(
  score: any,
  draw: any,
  audience: Audience = "trainee"
): ReportData {
  const d = score?.detail as any;
  const pass = score?.verdict === "PASS";

  // ---- Dispositions -------------------------------------------------
  if (d && d.kind === "dispo") {
    const items: any[] = Array.isArray(d.items) ? d.items : [];
    const scoreOf = (rid: string) =>
      Math.max(0, Math.min(2, Number(items.find((x) => x?.id === rid)?.score) || 0));
    const total = score.completeness ?? DISPO_RUBRIC.reduce((sum, r) => sum + scoreOf(r.id), 0);
    const known = items.filter((x) => DISPO_RUBRIC.some((r) => r.id === x?.id));
    const bars = DISPO_GROUPS.map((g) => ({
      label: g.label,
      got: g.ids.reduce((a, rid) => a + scoreOf(rid), 0),
      max: g.ids.length * 2,
    }));
    return {
      graded: true,
      pass,
      headline: headlineFor(pass),
      scoreText: `${total} / ${DISPO_MAX_SCORE}`,
      score100: Math.round((Number(total) / DISPO_MAX_SCORE) * 100),
      whoLabel: "Agent",
      who:
        dispoAgentLabel(draw?.agent) +
        (audience === "admin" && draw?.agent === DISPO_GATE.trapId ? " · THE TRAP" : ""),
      note: score.knockout_reason || null,
      passRule: "Pass needs 21+ with zero boundary breaches",
      bars,
      strengths: known
        .filter((x) => Number(x.score) === 2)
        .map((x) => `${dispoRubricName(x.id)}${x.note ? ` — ${x.note}` : ""}`),
      recommendations: known
        .filter((x) => Number(x.score) < 2)
        .map((x) => `${dispoRubricName(x.id)} (${x.score}/2)${x.note ? ` — ${x.note}` : ""}`),
      flags: (Array.isArray(d.breaches) ? d.breaches : []).map((b: any) => ({
        label: dispoBreachDesc(b.id),
        quote: b.quote || undefined,
      })),
      coaching: d.coaching_note || null,
      extra: (d.buybox_captured ?? []).length
        ? `Buy box captured: ${(d.buybox_captured ?? []).join(" · ")}`
        : null,
    };
  }

  // ---- Versant certification / drill --------------------------------
  if (d) {
    const vItems: any[] = Array.isArray(d.items)
      ? d.items
      : [...(d.part_b ?? []), ...(d.part_c ?? [])];
    const vCrit = d.criteria ?? d.part_d?.criteria ?? {};
    const a = d.part_a ?? {};
    const strengths: string[] = [];
    const recommendations: string[] = [];

    (a.recording_disclosure === true ? strengths : recommendations).push(
      "Recording disclosure in the open"
    );
    (a.source_question === true ? strengths : recommendations).push(
      "Asked how they heard about us"
    );
    (a.name_given === true ? strengths : recommendations).push("Gave their name");
    if (Number(a.delivery) >= 4) strengths.push(`Open delivered close to script (${a.delivery}/5)`);
    else recommendations.push(`Open needs to be closer to the script (${a.delivery ?? "—"}/5)`);

    for (const x of vItems) {
      const label = `“${itemLabel(x.id)}”${x.note ? ` — ${x.note}` : ""}`;
      (x?.pass === true ? strengths : recommendations).push(label);
    }
    for (const c of DRILL_CRITERIA) {
      if (vCrit[c.id] === true) strengths.push(c.label);
      else if (vCrit[c.id] === false) recommendations.push(c.label);
    }

    const bars: ReportBar[] = [
      { label: "The open", got: Number(a.delivery) || 0, max: 5 },
      ...(vItems.length > 0
        ? [
            {
              label: "Seller lines",
              got: vItems.filter((x: any) => x?.pass === true).length,
              max: vItems.length,
            },
          ]
        : []),
      {
        label: "Call handling",
        got: DRILL_CRITERIA.filter((c) => vCrit[c.id] === true).length,
        max: DRILL_CRITERIA.length,
      },
    ];

    return {
      graded: true,
      pass,
      headline: headlineFor(pass),
      scoreText: null,
      score100: roll(bars),
      whoLabel: "Seller",
      who: personaLabel(draw?.persona),
      note: score.knockout_reason || null,
      passRule: "Pass needs the open, 8/10 call handling, and no hard fails",
      bars,
      strengths,
      recommendations,
      flags: (d.hard_fails ?? []).map((h: any) => ({
        label: hardFailLabel(h.rule),
        quote: h.quote || undefined,
      })),
      coaching: d.coaching_note || d.persona_note || d.part_d?.persona_note || null,
      extra: null,
    };
  }

  // ---- Sales practice ("John") --------------------------------------
  if (score?.outcome) {
    const bars: ReportBar[] = [
      { label: "Warmth", got: score.warmth ?? 0, max: 5 },
      { label: "Clarity", got: score.clarity ?? 0, max: 5 },
      { label: "Confidence", got: score.confidence ?? 0, max: 5 },
      { label: "Professional", got: score.professionalism ?? 0, max: 5 },
      { label: "Conversational", got: score.conversational ?? 0, max: 5 },
      { label: "Completeness", got: score.completeness ?? 0, max: 5 },
      { label: "Ending", got: score.ending_handling ?? 0, max: 5 },
    ];
    const avg = bars.reduce((a, b) => a + b.got, 0) / bars.length;
    return {
      graded: true,
      pass,
      headline: `Seller: ${String(score.outcome).replace("_", " ").toLowerCase()}`,
      scoreText: `${avg.toFixed(1)} / 5`,
      score100: roll(bars),
      whoLabel: "Seller",
      who: "John",
      note: score.knockout ? score.knockout_reason || null : null,
      passRule: null,
      bars,
      strengths: [],
      recommendations: [],
      flags: [],
      coaching: score.notes || null,
      extra: null,
    };
  }

  // ---- Scored, but no structured detail ------------------------------
  return {
    graded: !!score,
    pass,
    headline: headlineFor(pass),
    scoreText: null,
    score100: null,
    whoLabel: "Caller",
    who: personaLabel(draw?.persona),
    note: score?.knockout_reason || null,
    passRule: null,
    bars: [],
    strengths: [],
    recommendations: [],
    flags: [],
    coaching: null,
    extra: null,
  };
}
