import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ScoreButton from "./score-button";
import { LEARN_MODULES } from "@/lib/modules";
import { DISPO_MODULES, DISPO_GATE } from "@/lib/dispo";
import { pathState, type ModuleProgressRow } from "@/lib/progress";
import {
  CallReport,
  ReportBars,
  verdictClass,
  itemLabel,
  personaLabel,
  hardFailLabel,
  dispoAgentLabel,
} from "@/components/call-report";

const STATUSES = ["invited", "interviewed", "scored", "certified", "passed", "failed"];

// Certification gate (mirrors the Phone Academy): this many passed tests,
// across at least this many different seller personas.
const GATE_PASSES = 12;
const GATE_TYPES = 6;

async function setStatus(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("candidates")
    .update({ status: String(formData.get("status")) })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/candidates/${id}`);
}

async function toggleSkip(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("candidates")
    .update({ skip_modules: formData.get("skip") === "on" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/candidates/${id}`);
}

// Latest score row of an attempt (rescores supersede earlier rows)
function latestScore(iv: any) {
  const arr = (iv.scores ?? [])
    .slice()
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return arr[arr.length - 1];
}

export default async function TraineePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: trainee } = await supabase.from("candidates").select("*").eq("id", id).single();
  if (!trainee) return <main>Trainee not found.</main>;

  const isTraining = trainee.mode === "training";
  const isDispo = trainee.mode === "dispo";

  const { data: interviews } = await supabase
    .from("interviews")
    .select("*, scores(*)")
    .eq("candidate_id", id)
    .order("started_at", { ascending: false });

  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
    .eq("candidate_id", id);
  const modules = isDispo ? DISPO_MODULES : LEARN_MODULES;
  const path = pathState((progressRows ?? []) as ModuleProgressRow[], modules);

  // Signed URL for audio playback (private bucket)
  const admin = supabaseAdmin();
  const withAudio = await Promise.all(
    (interviews ?? []).map(async (iv) => {
      let signedUrl: string | null = null;
      if (iv.audio_url) {
        const { data } = await admin.storage.from("interview-audio").createSignedUrl(iv.audio_url, 3600);
        signedUrl = data?.signedUrl ?? null;
      }
      return { ...iv, signedUrl };
    })
  );

  // Certification progress: passed CERT CALLS (practice calls excluded)
  const testAttempts = withAudio.filter((iv) => (iv.exam_meta as any)?.kind !== "drill");
  const gateAttempts = testAttempts.filter((iv) => !(iv.exam_meta as any)?.picked);
  const passedTests = gateAttempts.filter((iv) => latestScore(iv)?.verdict === "PASS");
  const personasPassed = new Set(
    passedTests.map((iv) => (iv.exam_meta as any)?.persona).filter(Boolean)
  );
  const gateMet = passedTests.length >= GATE_PASSES && personasPassed.size >= GATE_TYPES;

  // Dispo gate (from the courseware): 5 passed calls, one of which must be
  // Gary — THE TRAP, the agent who tries to pull the rep across the line.
  const dispoPasses = gateAttempts.filter(
    (iv) => (iv.exam_meta as any)?.kind === "dispo" && latestScore(iv)?.verdict === "PASS"
  );
  const trapCleared = dispoPasses.some(
    (iv) => (iv.exam_meta as any)?.agent === DISPO_GATE.trapId
  );
  const dispoGateMet = dispoPasses.length >= DISPO_GATE.passesNeeded && trapCleared;

  return (
    <main className="fade-in">
      <Link href="/admin" className="small">← All trainees</Link>

      <div className="card" style={{ marginTop: 12, marginBottom: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>{trainee.full_name}</h1>
          <span className={`pill ${isTraining || isDispo ? "pill-gray" : "pill-blue"}`}>
            {isTraining
              ? "🎧 Versant certification"
              : isDispo
                ? "🏷 Dispositions certification"
                : `📞 Sales practice · ${trainee.difficulty === "hard" ? "Hard" : "Easy"} John`}
          </span>
        </div>
        <p className="muted" style={{ marginTop: 4 }}>
          {trainee.email || "no email"} · {trainee.phone || "no phone"}
        </p>

        {(isTraining || isDispo) && (
          <>
            <div className="row" style={{ gap: 6, margin: "8px 0", flexWrap: "wrap" }}>
              {modules.map((m) => {
                const row = path.byModule[m.id];
                const complete = path.moduleComplete(m.id);
                const started = !!row;
                return (
                  <span
                    key={m.id}
                    className={`pill ${complete ? "pill-green" : started ? "pill-amber" : "pill-gray"}`}
                    title={`${m.title} — quiz ${row?.quiz_passed ? "✓" : row?.quiz_score != null ? `${row.quiz_score}/${row.quiz_total}` : "—"}`}
                  >
                    {complete ? "✓" : ""} {isDispo ? "D" : "M"}{m.num}
                  </span>
                );
              })}
              <span className="pill pill-gray">
                {modules.filter((m) => path.moduleComplete(m.id)).length}/{modules.length} modules
              </span>
            </div>
            {isDispo ? (
              <div className="row" style={{ gap: 10, margin: "8px 0" }}>
                <span className={`pill ${dispoPasses.length >= DISPO_GATE.passesNeeded ? "pill-green" : "pill-gray"}`}>
                  Calls passed: {dispoPasses.length} / {DISPO_GATE.passesNeeded}
                </span>
                <span className={`pill ${trapCleared ? "pill-green" : "pill-gray"}`}>
                  {trapCleared ? "✓ THE TRAP cleared" : "THE TRAP not cleared yet"}
                </span>
                <span className={`pill ${dispoGateMet ? "pill-green" : "pill-amber"}`}>
                  {dispoGateMet ? "✓ Gate met — ready to certify" : "In training"}
                </span>
              </div>
            ) : (
              <div className="row" style={{ gap: 10, margin: "8px 0" }}>
                <span className={`pill ${passedTests.length >= GATE_PASSES ? "pill-green" : "pill-gray"}`}>
                  Tests passed: {passedTests.length} / {GATE_PASSES}
                </span>
                <span className={`pill ${personasPassed.size >= GATE_TYPES ? "pill-green" : "pill-gray"}`}>
                  Different sellers passed: {personasPassed.size} / {GATE_TYPES}
                </span>
                <span className={`pill ${gateMet ? "pill-green" : "pill-amber"}`}>
                  {gateMet ? "✓ Gate met — ready to certify" : "In training"}
                </span>
              </div>
            )}
          </>
        )}

        <div className="row" style={{ gap: 18 }}>
          <form action={setStatus} className="row">
            <input type="hidden" name="id" value={trainee.id} />
            <label className="small muted">Status:</label>
            <select name="status" defaultValue={trainee.status} className="input" style={{ width: "auto" }}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="btn btn-secondary">Save</button>
          </form>
          {(isTraining || isDispo) && (
            <form action={toggleSkip} className="row">
              <input type="hidden" name="id" value={trainee.id} />
              <label className="small muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" name="skip" defaultChecked={!!trainee.skip_modules} />
                Skip module gate (dry runs)
              </label>
              <button className="btn btn-secondary">Apply</button>
            </form>
          )}
        </div>
      </div>

      {withAudio.length === 0 && (
        <div className="card muted">No attempts yet. Send them their link.</div>
      )}

      {withAudio.map((iv, idx) => {
        const draw = iv.exam_meta as any;
        const isDrillAttempt = draw?.kind === "drill";
        return (
        <section key={iv.id} className="card" style={{ marginTop: 16 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, margin: 0 }}>
              {isDrillAttempt
                ? "🎙 Drill room (coached practice — not graded)"
                : `${isTraining || isDispo ? (draw?.picked ? "📞 Practice call" : "🏁 Certification call") : "Attempt"} ${withAudio.length - idx}`}
              {!isDrillAttempt && isTraining && draw?.persona && (
                <span className="pill pill-gray" style={{ marginLeft: 8, fontWeight: 400 }}>
                  Seller: {personaLabel(draw.persona)}
                </span>
              )}
              {!isDrillAttempt && isDispo && draw?.agent && (
                <span className="pill pill-gray" style={{ marginLeft: 8, fontWeight: 400 }}>
                  Agent: {dispoAgentLabel(draw.agent)}
                  {draw.agent === DISPO_GATE.trapId && " · THE TRAP"}
                </span>
              )}
              {isDrillAttempt && draw?.persona && (
                <span className="pill pill-gray" style={{ marginLeft: 8, fontWeight: 400 }}>
                  Seller: {personaLabel(draw.persona)}
                </span>
              )}
              <span className="muted small" style={{ fontWeight: 400 }}>
                {" "}· {iv.started_at ? new Date(iv.started_at).toLocaleString() : "not started"}
              </span>
            </h2>
            <span className={`pill ${iv.completed ? "pill-green" : "pill-gray"}`}>
              {iv.completed ? "✓ completed" : "ended early"}
            </span>
          </div>
          <p className="small muted" style={{ margin: "6px 0" }}>
            Consent: {iv.consent_given ? `yes (${new Date(iv.consent_at).toLocaleString()})` : "NO"}
          </p>

          {!iv.completed && (
            <p className="notice notice-gray small" style={{ margin: "8px 0" }}>
              ⚠️ Ended early.
              {Array.isArray(iv.transcript) && (iv.transcript as any[]).length >= 4
                ? " Partial transcript available — you can grade it if there's enough to judge."
                : " Too little transcript to grade."}
            </p>
          )}

          {iv.signedUrl && <audio controls src={iv.signedUrl} style={{ width: "100%", margin: "8px 0" }} />}

          {iv.candidate_notes && (
            <details style={{ marginTop: 6 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Their prep notes</summary>
              <p className="notice notice-gray small" style={{ whiteSpace: "pre-wrap" }}>{iv.candidate_notes}</p>
            </details>
          )}

          {(iv.scores ?? [])
            .slice()
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((s: any, sIdx: number, arr: any[]) => {
              const d = s.detail as any; // structured breakdown
              return (
              <div key={s.id} className={`score-card ${verdictClass(s.verdict)}`}>
                <div className="small muted" style={{ marginBottom: 4 }}>
                  Score #{sIdx + 1}{sIdx === arr.length - 1 ? " (latest)" : " (superseded)"} · {new Date(s.created_at).toLocaleString()}
                </div>

                {d && isDrillAttempt ? (
                  <>
                    <strong>{s.verdict}</strong> ({s.scored_by})
                    {s.knockout_reason && (
                      <span style={{ marginLeft: 8, color: "var(--red)" }}>— {s.knockout_reason}</span>
                    )}
                    {(d.hard_fails ?? []).length > 0 && (
                      <div className="notice notice-gray small" style={{ margin: "8px 0", color: "var(--red)" }}>
                        {(d.hard_fails ?? []).map((h: any, i: number) => (
                          <div key={i}>🚫 <strong>{hardFailLabel(h.rule)}</strong>{h.quote && <> — “{h.quote}”</>}</div>
                        ))}
                      </div>
                    )}
                    {d.part_a && (
                      <div className="small" style={{ marginTop: 6 }}>
                        {d.part_a.name_given ? "✓ name" : "✗ name"} ·{" "}
                        {d.part_a.recording_disclosure ? "✓ recording disclosure" : "✗ RECORDING DISCLOSURE"} ·{" "}
                        {d.part_a.source_question ? "✓ how-did-you-hear" : "✗ how-did-you-hear"} ·{" "}
                        delivery {d.part_a.delivery ?? "—"}/5
                        {d.part_a.note && <span className="muted"> — {d.part_a.note}</span>}
                      </div>
                    )}
                    {(d.items ?? []).map((item: any, i: number) => (
                      <div key={i} className="small" style={{ marginLeft: 12 }}>
                        {item.pass ? "✓" : "✗"} “{itemLabel(item.id)}”
                        {item.note && <span className="muted"> — {item.note}</span>}
                      </div>
                    ))}
                    {d.persona_note && <div className="small muted" style={{ marginLeft: 12 }}>{d.persona_note}</div>}
                  </>
                ) : (
                  <CallReport score={s} draw={draw} audience="admin" />
                )}
                {s.notes && d?.kind !== "dispo" && (
                  <div className="small" style={{ marginTop: 4 }}>Notes: {s.notes}</div>
                )}
              </div>
            );})}

          {!isDrillAttempt && Array.isArray(iv.transcript) && (iv.transcript as any[]).length >= 4 && (
            <ScoreButton interviewId={iv.id} rescore={(iv.scores ?? []).length > 0} />
          )}

          {iv.transcript && (
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Transcript</summary>
              <div className="small" style={{ marginTop: 8 }}>
                {(iv.transcript as any[]).map((t, i) => (
                  <p key={i} style={{ margin: "5px 0" }}>
                    <strong style={{ color: t.role === "agent" ? "var(--brand-ink)" : "var(--ink)" }}>
                      {t.role === "agent" ? "AI" : "Trainee"}:
                    </strong>{" "}
                    {t.text}
                  </p>
                ))}
              </div>
            </details>
          )}
        </section>
      );})}
    </main>
  );
}
