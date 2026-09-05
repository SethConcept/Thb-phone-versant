import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { LEARN_MODULES } from "@/lib/modules";
import { DISPO_MODULES, DISPO_BRAND, DISPO_GATE } from "@/lib/dispo";
import { pathState, type ModuleProgressRow } from "@/lib/progress";
import { buildCallReport, personaLabel, dispoAgentLabel } from "@/lib/call-report";
import ResultsClient, { type CallRow, type Turn } from "./results-client";

// The trainee's own call review — their whole history, the same coach
// reports their reviewer sees. Token-authenticated: their link IS their
// identity (same rule as every other /learn page), and it only ever reads
// their own calls.

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

      // transcript → offsets from the first turn, flagging quoted moments
      const raw: any[] = Array.isArray(iv.transcript) ? iv.transcript : [];
      const firstTs = raw.length ? Number(raw[0].ts) || 0 : 0;
      const quotes = (report?.flags ?? [])
        .map((f) => (f.quote || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").trim())
        .filter((q) => q.length > 8);
      const transcript: Turn[] = raw.map((t) => {
        const text = String(t.text ?? "");
        const norm = text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
        return {
          role: t.role === "agent" ? "agent" : "candidate",
          text,
          offset: Math.max(0, Math.round(((Number(t.ts) || firstTs) - firstTs) / 1000)),
          flagged:
            t.role !== "agent" &&
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
