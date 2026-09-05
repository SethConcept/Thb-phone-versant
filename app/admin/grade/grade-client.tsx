"use client";

import { useState } from "react";
import { ReportView, type ReportData } from "@/components/report-view";

const SAMPLE = `REP: Thank you for calling Twin Home Buyer, this is Thea. This call is recorded for quality. Are you calling about a property you're thinking about selling?
SELLER: Yes, I saw your commercial. I have a house in Richmond I've been thinking about selling.
REP: …`;

type Role = "intake" | "acquisition";

// The two seats on this phone are graded against different rubrics — the desk
// must never quote a number, acquisitions has to. Picking the wrong one gives
// a meaningless grade, so it sits at the top of the form, not hidden in a
// dropdown. See docs/CALL-FINDINGS.md §1.
const ROLES: { id: Role; name: string; hint: string }[] = [
  {
    id: "intake",
    name: "Intake desk",
    hint: "Answered the line, qualified, booked the visit. Never gives a number.",
  },
  {
    id: "acquisition",
    name: "Acquisitions",
    hint: "Took the handoff after the visit. Presents the offer and the math behind it.",
  },
];

export default function GradeClient() {
  const [transcript, setTranscript] = useState("");
  const [context, setContext] = useState("");
  const [role, setRole] = useState<Role>("intake");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);

  async function grade(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/grade-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, context, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Grading failed");
      setReport(data.report);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const lines = transcript.trim() ? transcript.trim().split("\n").length : 0;

  return (
    <>
      <form onSubmit={grade} className="card" style={{ marginTop: 14 }}>
        <fieldset className="seat-pick">
          <legend className="small muted">Which seat was on this call?</legend>
          {ROLES.map((r) => (
            <label key={r.id} className={`seat ${role === r.id ? "on" : ""}`}>
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={role === r.id}
                onChange={() => setRole(r.id)}
              />
              <span>
                <strong>{r.name}</strong>
                <em className="small muted">{r.hint}</em>
              </span>
            </label>
          ))}
        </fieldset>

        <label className="small muted" style={{ display: "block", marginBottom: 6 }}>
          Paste the transcript. Label each turn — <code>REP:</code> and <code>SELLER:</code> is ideal, but any
          consistent labels work.
        </label>
        <textarea
          className="input"
          rows={14}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={SAMPLE}
          style={{ fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 13, resize: "vertical" }}
        />
        <label className="small muted" style={{ display: "block", margin: "12px 0 6px" }}>
          Context for the grader (optional) — who the rep was, the channel, what the outcome actually was.
        </label>
        <input
          className="input"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. Kristine, PPC lead, first contact — no appointment was set"
        />
        <div className="row" style={{ marginTop: 14, justifyContent: "space-between" }}>
          <span className="small muted">
            {lines > 0 ? `${lines} line${lines === 1 ? "" : "s"}` : "Nothing pasted yet"}
          </span>
          <button className="btn" disabled={busy || transcript.trim().length < 80}>
            {busy ? "Grading…" : "Grade this call"}
          </button>
        </div>
        {error && (
          <p className="small" style={{ color: "var(--red)", marginBottom: 0 }}>
            {error}
          </p>
        )}
      </form>

      {busy && (
        <div className="card" style={{ marginTop: 14, textAlign: "center" }}>
          <div className="spinner" />
          <p className="muted small">Scoring against the THB Sales Standard…</p>
        </div>
      )}

      {report && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Result</h2>
          <div className={`score-card ${report.pass ? "score-pass" : "score-fail"}`}>
            <ReportView data={report} />
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            This grade is not saved — it&apos;s a one-off review. Copy anything you want to keep.
          </p>
        </section>
      )}
    </>
  );
}
