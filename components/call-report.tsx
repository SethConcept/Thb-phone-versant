// Shared coach-report rendering for a graded call.
//
// Used by BOTH the admin trainee page and the trainee's own "My results"
// page so the two never drift. Server components only — this file imports
// lib/academy and lib/dispo, whose persona scripts must never reach the
// browser.
//
// `audience` controls the few things only a reviewer should see (e.g. that
// Gary is THE TRAP, and who/what scored the run).

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
const dispoRubricName = (id: string) =>
  DISPO_RUBRIC.find((r) => r.id === id)?.name ?? id;
const dispoBreachDesc = (id: string) =>
  DISPO_BREACHES.find((b) => b.id === id)?.desc ?? id;

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

export function ReportBars({ bars }: { bars: { label: string; got: number; max: number }[] }) {
  return (
    <div className="rpt-bars">
      {bars.map((b) => {
        const ratio = b.max > 0 ? b.got / b.max : 0;
        const tone = ratio >= 0.75 ? "rpt-good" : ratio >= 0.5 ? "rpt-mid" : "rpt-low";
        return (
          <div key={b.label} className="rpt-bar">
            <span className="lbl">{b.label}</span>
            <span className="rpt-track">
              <span className={`rpt-fill ${tone}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
            </span>
            <span className="rpt-n">{b.got} / {b.max}</span>
          </div>
        );
      })}
    </div>
  );
}

function PassPill({ pass }: { pass: boolean }) {
  return (
    <span className={`pill ${pass ? "pill-green" : "pill-amber"}`}>
      {pass ? "✓ Passed — counts toward certification" : "Keep training — see recommendations"}
    </span>
  );
}

function DispoBody({ s, d, draw, audience }: { s: any; d: any; draw: any; audience: Audience }) {
  const items: any[] = Array.isArray(d.items) ? d.items : [];
  const scoreOf = (rid: string) =>
    Math.max(0, Math.min(2, Number(items.find((x) => x?.id === rid)?.score) || 0));
  const total = s.completeness ?? DISPO_RUBRIC.reduce((sum, r) => sum + scoreOf(r.id), 0);
  const known = items.filter((x) => DISPO_RUBRIC.some((r) => r.id === x?.id));
  const strengths = known.filter((x) => Number(x.score) === 2);
  const recs = known.filter((x) => Number(x.score) < 2);
  const breaches: any[] = Array.isArray(d.breaches) ? d.breaches : [];
  const pass = s.verdict === "PASS";
  const who =
    dispoAgentLabel(draw?.agent) +
    (audience === "admin" && draw?.agent === DISPO_GATE.trapId ? " · THE TRAP" : "");

  return (
    <>
      <div className="rpt-head">
        <span className="rpt-score">{total}<small> / {DISPO_MAX_SCORE}</small></span>
        <PassPill pass={pass} />
        <span className="small muted">
          {audience === "admin" ? `(${s.scored_by}) · ` : ""}pass needs 21+ with zero boundary breaches
        </span>
      </div>
      <p className="small muted" style={{ margin: "4px 0 0" }}>Agent: {who}</p>
      <ReportBars
        bars={DISPO_GROUPS.map((g) => ({
          label: g.label,
          got: g.ids.reduce((a, rid) => a + scoreOf(rid), 0),
          max: g.ids.length * 2,
        }))}
      />
      <div className="rpt-cols">
        <div className="good">
          <h4>Strengths</h4>
          <ul>
            {strengths.length === 0 && <li className="muted">None yet — see recommendations.</li>}
            {strengths.map((x: any, i: number) => (
              <li key={i}>
                {dispoRubricName(x.id)}
                {x.note && <span className="muted"> — {x.note}</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="work">
          <h4>Recommendations</h4>
          <ul>
            {breaches.map((b: any, i: number) => (
              <li key={`b${i}`} className="rpt-breach">
                Boundary: {dispoBreachDesc(b.id)}
                {b.quote && <> — “{b.quote}”</>}
              </li>
            ))}
            {recs.map((x: any, i: number) => (
              <li key={i}>
                {dispoRubricName(x.id)} ({x.score}/2)
                {x.note && <span className="muted"> — {x.note}</span>}
              </li>
            ))}
            {breaches.length === 0 && recs.length === 0 && (
              <li className="muted">Nothing — clean call.</li>
            )}
          </ul>
        </div>
      </div>
      {(d.buybox_captured ?? []).length > 0 && (
        <div className="small" style={{ marginTop: 10 }}>
          <strong>Buy box captured:</strong> {(d.buybox_captured ?? []).join(" · ")}
        </div>
      )}
      {d.coaching_note && (
        <div className="rpt-coach"><strong>Coaching:</strong> {d.coaching_note}</div>
      )}
    </>
  );
}

function VersantBody({ s, d, draw, audience }: { s: any; d: any; draw: any; audience: Audience }) {
  const vItems: any[] = Array.isArray(d.items)
    ? d.items
    : [...(d.part_b ?? []), ...(d.part_c ?? [])];
  const vCrit = d.criteria ?? d.part_d?.criteria ?? {};
  const a = d.part_a ?? {};
  const pass = s.verdict === "PASS";

  // Strengths / recommendations from the same facts the bars summarize
  const strengths: string[] = [];
  const recs: string[] = [];
  (a.recording_disclosure === true ? strengths : recs).push("Recording disclosure in the open");
  (a.source_question === true ? strengths : recs).push("Asked how they heard about us");
  (a.name_given === true ? strengths : recs).push("Gave their name");
  if (Number(a.delivery) >= 4) strengths.push(`Open delivered close to script (${a.delivery}/5)`);
  else recs.push(`Open needs to be closer to the script (${a.delivery ?? "—"}/5)`);
  for (const x of vItems) {
    const label = `“${itemLabel(x.id)}”${x.note ? ` — ${x.note}` : ""}`;
    (x?.pass === true ? strengths : recs).push(label);
  }
  for (const c of DRILL_CRITERIA) {
    if (vCrit[c.id] === true) strengths.push(c.label);
    else if (vCrit[c.id] === false) recs.push(c.label);
  }

  return (
    <>
      <div className="rpt-head">
        <PassPill pass={pass} />
        {audience === "admin" && <span className="small muted">({s.scored_by})</span>}
      </div>
      <p className="small muted" style={{ margin: "4px 0 0" }}>Seller: {personaLabel(draw?.persona)}</p>
      {s.knockout_reason && (
        <p className="small" style={{ margin: "6px 0 0" }}>
          <strong>Recommendation:</strong> {s.knockout_reason}
        </p>
      )}
      <ReportBars
        bars={[
          { label: "The open", got: Number(a.delivery) || 0, max: 5 },
          ...(vItems.length > 0
            ? [{ label: "Seller lines", got: vItems.filter((x: any) => x?.pass === true).length, max: vItems.length }]
            : []),
          { label: "Call handling", got: DRILL_CRITERIA.filter((c) => vCrit[c.id] === true).length, max: DRILL_CRITERIA.length },
        ]}
      />
      {(d.hard_fails ?? []).length > 0 && (
        <div className="notice notice-gray small" style={{ margin: "8px 0", color: "var(--red)" }}>
          {(d.hard_fails ?? []).map((h: any, i: number) => (
            <div key={i}>
              🚫 <strong>{hardFailLabel(h.rule)}</strong>
              {h.quote && <> — “{h.quote}”</>}
            </div>
          ))}
        </div>
      )}
      <div className="rpt-cols">
        <div className="good">
          <h4>Strengths</h4>
          <ul>
            {strengths.length === 0 && <li className="muted">None yet — see recommendations.</li>}
            {strengths.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        <div className="work">
          <h4>Recommendations</h4>
          <ul>
            {recs.length === 0 && <li className="muted">Nothing — clean call.</li>}
            {recs.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      </div>
      {(d.persona_note ?? d.part_d?.persona_note) && (
        <p className="small muted" style={{ marginTop: 8 }}>{d.persona_note ?? d.part_d?.persona_note}</p>
      )}
      {d.coaching_note && (
        <div className="rpt-coach"><strong>Coaching:</strong> {d.coaching_note}</div>
      )}
    </>
  );
}

/** One graded call, rendered as a coach report. */
export function CallReport({
  score,
  draw,
  audience = "trainee",
}: {
  score: any;
  draw: any;
  audience?: Audience;
}) {
  const d = score.detail as any;
  if (!d) {
    // Sales practice ("John") — averaged categories
    if (score.outcome)
      return (
        <>
          <div className="rpt-head">
            <span className="rpt-score">
              {(((score.warmth ?? 0) + (score.clarity ?? 0) + (score.confidence ?? 0) + (score.professionalism ?? 0) + (score.conversational ?? 0) + (score.completeness ?? 0) + (score.ending_handling ?? 0)) / 7).toFixed(1)}
              <small> / 5</small>
            </span>
            <span className={`pill ${score.outcome === "INTERESTED" ? "pill-green" : score.outcome === "NOT_INTERESTED" ? "pill-amber" : "pill-gray"}`}>
              Seller: {String(score.outcome).replace("_", " ")}
            </span>
          </div>
          <ReportBars
            bars={[
              { label: "Warmth", got: score.warmth ?? 0, max: 5 },
              { label: "Clarity", got: score.clarity ?? 0, max: 5 },
              { label: "Confidence", got: score.confidence ?? 0, max: 5 },
              { label: "Professional", got: score.professionalism ?? 0, max: 5 },
              { label: "Conversational", got: score.conversational ?? 0, max: 5 },
              { label: "Completeness", got: score.completeness ?? 0, max: 5 },
              { label: "Ending", got: score.ending_handling ?? 0, max: 5 },
            ]}
          />
          {score.knockout && score.knockout_reason && (
            <p className="small" style={{ marginTop: 6 }}>
              <strong>Recommendation:</strong> {score.knockout_reason}
            </p>
          )}
        </>
      );
    return (
      <>
        <PassPill pass={score.verdict === "PASS"} />
        {score.knockout_reason && (
          <p className="small" style={{ margin: "6px 0 0" }}>
            <strong>Recommendation:</strong> {score.knockout_reason}
          </p>
        )}
      </>
    );
  }
  if (d.kind === "dispo") return <DispoBody s={score} d={d} draw={draw} audience={audience} />;
  return <VersantBody s={score} d={d} draw={draw} audience={audience} />;
}
