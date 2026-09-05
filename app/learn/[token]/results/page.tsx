import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { LEARN_MODULES } from "@/lib/modules";
import { DISPO_MODULES, DISPO_BRAND, DISPO_GATE } from "@/lib/dispo";
import { pathState, type ModuleProgressRow } from "@/lib/progress";
import { buildCallReport, aggregateBars, personaLabel, dispoAgentLabel } from "@/lib/call-report";
import { TrendChart, TrendDelta, WeakSpots, type TrendPoint } from "@/components/trend";
import ResultsClient, { type CallRow, type Turn } from "./results-client";

// The trainee's own call review — their whole history, the same coach
// reports their reviewer sees. Token-authenticated: their link IS their
// identity (same rule as every other /learn page), and it only ever reads
// their own calls.

// Always render per request: this page carries one trainee's recordings and
// transcripts, so nothing about it may be cached or shared between requests.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GATE_PASSES = 12;
const GATE_TYPES = 6;

const shortName = (label: string) => label.split(" — ")[0];

export default async function MyResultsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, full_name, mode, status")
    .eq("interview_token", token)
    .single();

  if (!trainee || !["training", "dispo"].includes(trainee.mode))
    return (
      <div className="candidate-bg">
        <main className="card candidate-card fade-in">
          <h1>Page not found</h1>
          <p>Please check the link you received, or contact {SELLER_BRAND}.</p>
        </main>
      </div>
    );

  const isDispo = trainee.mode === "dispo";
  const modules = isDispo ? DISPO_MODULES : LEARN_MODULES;
  const brand = isDispo ? DISPO_BRAND : SELLER_BRAND;

  const [{ data: progressRows }, { data: interviews }] = await Promise.all([
    db
      .from("module_progress")
      .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
      .eq("candidate_id", trainee.id),
    db
      .from("interviews")
      .select("*, scores(*)")
      .eq("candidate_id", trainee.id)
      .order("started_at", { ascending: false }),
  ]);

  const path = pathState((progressRows ?? []) as ModuleProgressRow[], modules);
  const modulesDone = modules.filter((m) => path.moduleComplete(m.id)).length;

  const latestScore = (iv: any) => {
    const arr = (iv.scores ?? [])
      .slice()
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return arr[arr.length - 1];
  };

  // ---- build one row per call (newest first) -------------------------
  const rows: CallRow[] = await Promise.all(
    (interviews ?? []).map(async (iv: any) => {
      const draw = iv.exam_meta as any;
      const isDrill = draw?.kind === "drill";
      const picked = !!draw?.picked;
      const s = latestScore(iv);
      const report = s && !isDrill ? buildCallReport(s, draw, "trainee") : null;

      let audioUrl: string | null = null;
      if (iv.audio_url) {
        const { data } = await db.storage
          .from("interview-audio")
          .createSignedUrl(iv.audio_url, 3600);
        audioUrl = data?.signedUrl ?? null;
      }

      // Transcript. Newer calls store `offset` (seconds from the start of the
      // recording) on each turn; older ones only have wall-clock `ts`, so fall
      // back to measuring from the first turn.
      const raw: any[] = Array.isArray(iv.transcript) ? iv.transcript : [];
      const firstTs = raw.length ? Number(raw[0].ts) || 0 : 0;
      const quotes = (report?.flags ?? [])
        .map((f) => (f.quote || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())
        .filter((q) => q.length > 8);

      const cleaned = raw
        .map((t) => ({
          role: (t.role === "agent" ? "agent" : "candidate") as Turn["role"],
          text: String(t.text ?? "").trim(),
          offset:
            typeof t.offset === "number" && Number.isFinite(t.offset)
              ? Math.max(0, Math.round(t.offset))
              : Math.max(0, Math.round(((Number(t.ts) || firstTs) - firstTs) / 1000)),
        }))
        // drop ASR noise stored by older sessions (stray non-Latin glyphs)
        .filter((t) => t.text.replace(/[^a-zA-Z0-9]/g, "").length >= 2);

      // Merge consecutive turns from the same speaker into one block —
      // the model flushes in fragments and it reads badly split up.
      const merged: { role: Turn["role"]; text: string; offset: number }[] = [];
      for (const t of cleaned) {
        const prev = merged[merged.length - 1];
        if (prev && prev.role === t.role && t.offset - prev.offset < 30)
          prev.text = `${prev.text} ${t.text}`.replace(/\s+/g, " ");
        else merged.push({ ...t });
      }

      const transcript: Turn[] = merged.map((t) => {
        const norm = t.text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
        return {
          ...t,
          flagged:
            t.role === "candidate" &&
            quotes.some((q) => norm.includes(q.slice(0, 40)) || q.includes(norm.slice(0, 40))),
        };
      });

      const durationSec =
        iv.started_at && iv.ended_at
          ? Math.max(0, (new Date(iv.ended_at).getTime() - new Date(iv.started_at).getTime()) / 1000)
          : transcript.length
            ? transcript[transcript.length - 1].offset
            : null;

      const who = isDispo
        ? shortName(dispoAgentLabel(draw?.agent))
        : draw?.persona
          ? shortName(personaLabel(draw.persona))
          : isDrill
            ? "Drill coach"
            : "Unknown caller";

      const outcome: CallRow["outcome"] = isDrill
        ? { label: "Coached practice", tone: "gray" }
        : !s
          ? iv.completed
            ? { label: "Not graded yet", tone: "gray" }
            : { label: "Ended early", tone: "gray" }
          : report?.pass
            ? { label: picked ? "Passed (practice)" : "Passed", tone: "green" }
            : { label: "Keep training", tone: "amber" };

      return {
        id: iv.id,
        startedAt: iv.started_at ?? null,
        who,
        kind: isDrill ? "drill" : picked ? "practice" : "cert",
        durationSec,
        score100: report?.score100 ?? null,
        outcome,
        audioUrl,
        transcript,
        report,
        ungraded: isDrill
          ? "Drill-room runs are coached practice — the feedback happened live on the call, nothing is scored."
          : !s
            ? iv.completed
              ? "This call is saved and waiting to be graded."
              : "This call ended early, so it wasn't graded."
            : null,
      } as CallRow;
    })
  );

  // ---- certification gate -------------------------------------------
  const gateRows = rows.filter((r) => r.kind === "cert");
  const passed = gateRows.filter((r) => r.outcome.tone === "green");
  const passedDraws = (interviews ?? []).filter(
    (iv: any) =>
      (iv.exam_meta as any)?.kind !== "drill" &&
      !(iv.exam_meta as any)?.picked &&
      latestScore(iv)?.verdict === "PASS"
  );
  const sellersPassed = new Set(
    passedDraws.map((iv: any) => (iv.exam_meta as any)?.persona).filter(Boolean)
  );
  const trapCleared = passedDraws.some(
    (iv: any) => (iv.exam_meta as any)?.agent === DISPO_GATE.trapId
  );
  // My progress over time — oldest call on the left
  const graded = [...rows].reverse().filter((r) => r.kind !== "drill" && r.report);
  const trendPoints: TrendPoint[] = graded.map((r, i) => ({
    score: r.report?.score100 ?? 0,
    when: r.startedAt,
    label: r.startedAt ? new Date(r.startedAt).toLocaleDateString() : `Call ${i + 1}`,
  }));
  const myWeakSpots = aggregateBars(graded.map((r) => r.report!)).slice(0, 5);

  const passesNeeded = isDispo ? DISPO_GATE.passesNeeded : GATE_PASSES;
  const gateMet = isDispo
    ? passed.length >= DISPO_GATE.passesNeeded && trapCleared
    : passed.length >= GATE_PASSES && sellersPassed.size >= GATE_TYPES;

  return (
    <div className="cr-page">
      <header className="cr-top">
        <div>
          <h1>📊 My results</h1>
          <p className="small muted" style={{ margin: "2px 0 0" }}>
            {trainee.full_name} · {brand} · every call, with the recording and the coach&apos;s notes
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {path.allComplete && (
            <Link className="btn" href={`/interview/${token}`}>
              ☎️ {isDispo ? "Dial another call" : "Take another call"}
            </Link>
          )}
          <Link className="btn btn-secondary" href={`/learn/${token}`}>← My learning path</Link>
        </div>
      </header>

      <section className="card cr-stand">
        <h2 className="cr-h">Where I stand</h2>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {modules.map((m) => {
            const row = path.byModule[m.id];
            const complete = path.moduleComplete(m.id);
            return (
              <span
                key={m.id}
                className={`pill ${complete ? "pill-green" : row ? "pill-amber" : "pill-gray"}`}
                title={m.title}
              >
                {complete ? "✓ " : ""}{isDispo ? "D" : "M"}{m.num}
              </span>
            );
          })}
          <span className="pill pill-gray">{modulesDone}/{modules.length} modules</span>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className={`pill ${passed.length >= passesNeeded ? "pill-green" : "pill-gray"}`}>
            Calls passed: {passed.length} / {passesNeeded}
          </span>
          {isDispo ? (
            <span className={`pill ${trapCleared ? "pill-green" : "pill-gray"}`}>
              {trapCleared ? "✓ Toughest agent cleared" : "Toughest agent not cleared yet"}
            </span>
          ) : (
            <span className={`pill ${sellersPassed.size >= GATE_TYPES ? "pill-green" : "pill-gray"}`}>
              Different sellers passed: {sellersPassed.size} / {GATE_TYPES}
            </span>
          )}
          <span className={`pill ${trainee.status === "certified" || gateMet ? "pill-green" : "pill-amber"}`}>
            {trainee.status === "certified" ? "🏅 Certified" : gateMet ? "✓ Ready to certify" : "In training"}
          </span>
        </div>
      </section>

      {trendPoints.length > 1 && (
        <section className="card cr-stand" style={{ marginTop: 14 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <h2 className="cr-h" style={{ marginBottom: 0 }}>Am I getting better?</h2>
            <TrendDelta points={trendPoints} />
          </div>
          <TrendChart points={trendPoints} height={110} />
          {myWeakSpots.length > 0 && (
            <>
              <h3 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--muted)", margin: "14px 0 6px" }}>
                What to work on next
              </h3>
              <WeakSpots rows={myWeakSpots} />
            </>
          )}
        </section>
      )}

      {rows.length === 0 ? (
        <div className="card muted" style={{ marginTop: 14 }}>
          No calls yet. Finish your modules and take your first certification call — your results
          will show up here.
        </div>
      ) : (
        <ResultsClient calls={rows} isDispo={isDispo} />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        Only you and the {brand} team can see this page.
      </p>
    </div>
  );
}
