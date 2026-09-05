import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { LEARN_MODULES } from "@/lib/modules";
import { DISPO_MODULES, DISPO_BRAND, DISPO_GATE } from "@/lib/dispo";
import { pathState, type ModuleProgressRow } from "@/lib/progress";
import { CallReport, verdictClass } from "@/components/call-report";

// The trainee's own results — their whole call history, the same coach
// reports their reviewer sees, plus where they stand on certification.
// Token-authenticated: their link IS their identity (same rule as every
// other /learn page). Only ever shows THEIR OWN calls.

const GATE_PASSES = 12;
const GATE_TYPES = 6;

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

  // Signed URLs so they can listen back to their own calls
  const withAudio = await Promise.all(
    (interviews ?? []).map(async (iv) => {
      let signedUrl: string | null = null;
      if (iv.audio_url) {
        const { data } = await db.storage
          .from("interview-audio")
          .createSignedUrl(iv.audio_url, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...iv, signedUrl };
    })
  );

  const latestScore = (iv: any) => {
    const arr = (iv.scores ?? [])
      .slice()
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return arr[arr.length - 1];
  };

  const calls = withAudio.filter((iv) => (iv.exam_meta as any)?.kind !== "drill");
  const drills = withAudio.filter((iv) => (iv.exam_meta as any)?.kind === "drill");
  const gateCalls = calls.filter((iv) => !(iv.exam_meta as any)?.picked);
  const passed = gateCalls.filter((iv) => latestScore(iv)?.verdict === "PASS");

  // Gate progress (mode-specific)
  const sellersPassed = new Set(
    passed.map((iv) => (iv.exam_meta as any)?.persona).filter(Boolean)
  );
  const trapCleared = passed.some((iv) => (iv.exam_meta as any)?.agent === DISPO_GATE.trapId);
  const passesNeeded = isDispo ? DISPO_GATE.passesNeeded : GATE_PASSES;
  const gateMet = isDispo
    ? passed.length >= DISPO_GATE.passesNeeded && trapCleared
    : passed.length >= GATE_PASSES && sellersPassed.size >= GATE_TYPES;

  return (
    <div className="candidate-bg">
      <main className="card fade-in" style={{ maxWidth: 860, width: "100%", textAlign: "left" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>📊 My results</h1>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {trainee.full_name} · {brand}
            </p>
          </div>
          <Link className="btn btn-secondary" href={`/learn/${token}`}>← My learning path</Link>
        </div>

        {/* Where they stand */}
        <section className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Where I stand</h2>
          <div className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
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
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
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
            <span className={`pill ${trainee.status === "certified" ? "pill-green" : gateMet ? "pill-green" : "pill-amber"}`}>
              {trainee.status === "certified"
                ? "🏅 Certified"
                : gateMet
                  ? "✓ Ready to certify"
                  : "In training"}
            </span>
          </div>
          {path.allComplete && (
            <p style={{ marginTop: 12, marginBottom: 0 }}>
              <Link className="btn" href={`/interview/${token}`}>
                ☎️ {isDispo ? "Dial another call" : "Take another call"}
              </Link>
            </p>
          )}
        </section>

        {/* Every graded call */}
        <h2 style={{ fontSize: 16, margin: "22px 0 6px" }}>
          My calls {calls.length > 0 && <span className="small muted">({calls.length})</span>}
        </h2>

        {calls.length === 0 && (
          <div className="card muted">
            No calls yet. Finish your modules and take your first certification call — your
            results will show up here.
          </div>
        )}

        {calls.map((iv, idx) => {
          const s = latestScore(iv);
          const draw = iv.exam_meta as any;
          const practice = !!draw?.picked;
          return (
            <section key={iv.id} className="card" style={{ marginTop: 14 }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: 15, margin: 0 }}>
                  {practice ? "📞 Practice call" : "🏁 Certification call"} {calls.length - idx}
                  <span className="muted small" style={{ fontWeight: 400 }}>
                    {" "}· {iv.started_at ? new Date(iv.started_at).toLocaleString() : ""}
                  </span>
                </h3>
                {practice && (
                  <span className="pill pill-blue">practice — doesn&apos;t count</span>
                )}
              </div>

              {iv.signedUrl && (
                <>
                  <p className="small muted" style={{ margin: "8px 0 4px" }}>
                    🎧 Listen back to yourself — it&apos;s the fastest way to improve.
                  </p>
                  <audio controls src={iv.signedUrl} style={{ width: "100%" }} />
                </>
              )}

              {s ? (
                <div className={`score-card ${verdictClass(s.verdict)}`}>
                  <CallReport score={s} draw={draw} audience="trainee" />
                </div>
              ) : (
                <p className="notice notice-gray small" style={{ marginTop: 8 }}>
                  {iv.completed
                    ? "This call is saved and waiting to be graded."
                    : "This call ended early, so it wasn't graded."}
                </p>
              )}

              {Array.isArray(iv.transcript) && (iv.transcript as any[]).length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                    Read the transcript
                  </summary>
                  <div className="small" style={{ marginTop: 8 }}>
                    {(iv.transcript as any[]).map((t, i) => (
                      <p key={i} style={{ margin: "5px 0" }}>
                        <strong style={{ color: t.role === "agent" ? "var(--brand-ink)" : "var(--ink)" }}>
                          {t.role === "agent" ? (isDispo ? "Agent" : "Caller") : "Me"}:
                        </strong>{" "}
                        {t.text}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </section>
          );
        })}

        {drills.length > 0 && (
          <>
            <h2 style={{ fontSize: 16, margin: "22px 0 6px" }}>
              🎙 Drill room <span className="small muted">({drills.length} — coached practice, never graded)</span>
            </h2>
            {drills.map((iv) => (
              <div key={iv.id} className="card" style={{ marginTop: 10 }}>
                <p className="small muted" style={{ margin: 0 }}>
                  {iv.started_at ? new Date(iv.started_at).toLocaleString() : ""}
                </p>
                {iv.signedUrl && <audio controls src={iv.signedUrl} style={{ width: "100%", marginTop: 8 }} />}
              </div>
            ))}
          </>
        )}

        <p className="small muted" style={{ marginTop: 22 }}>
          Only you and the {brand} team can see this page.
        </p>
      </main>
    </div>
  );
}
