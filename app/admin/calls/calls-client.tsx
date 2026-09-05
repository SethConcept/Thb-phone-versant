"use client";

// Two-pane reader for the real-call corpus: the call list on the left, the
// selected call's transcript and grade on the right. Reuses the .cr-* layout
// from the trainee results page so the two read the same way.
//
// Receives only the redacted corpus as plain props — no lib imports, so no
// persona content can reach this bundle.

import { useRef, useState } from "react";
import { ReportView, type ReportData } from "@/components/report-view";

export type CorpusCall = {
  id: string;
  when: string;
  direction: string;
  duration_sec: number;
  campaign: string | null;
  turns: { speaker: string; text: string }[];
  crm_summary: string | null;
};

type Role = "intake" | "acquisition";

const mmss = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

const day = (iso: string) =>
  new Date(iso.replace(" ", "T")).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });

/** Transcript speaker → who that is. Speaker 1 answers on an inbound call. */
const who = (speaker: string, direction: string) => {
  const n = /(\d+)/.exec(speaker)?.[1];
  if (!n) return speaker;
  const repIsFirst = direction === "inbound";
  if (n === "1") return repIsFirst ? "Rep" : "Seller";
  if (n === "2") return repIsFirst ? "Seller" : "Rep";
  return `Speaker ${n}`;
};

export default function CallsClient({ calls }: { calls: CorpusCall[] }) {
  const [selectedId, setSelectedId] = useState(calls[0]?.id ?? "");
  const [role, setRole] = useState<Role>("intake");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const call = calls.find((c) => c.id === selectedId) ?? calls[0];
  if (!call) return null;

  function select(id: string) {
    setSelectedId(id);
    setReport(null);
    setError("");
    if (typeof window !== "undefined" && window.innerWidth < 980)
      setTimeout(
        () => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        60
      );
  }

  async function grade() {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const transcript = call.turns
        .map((t) => `${who(t.speaker, call.direction).toUpperCase()}: ${t.text}`)
        .join("\n");
      const res = await fetch("/api/grade-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          role,
          context: `Real ${call.direction} call, ${mmss(call.duration_sec)}${
            call.campaign ? `, campaign: ${call.campaign}` : ""
          }. Redacted — [NAME]/[ADDRESS]/[PHONE]/[EMAIL] are removals, not things the rep failed to say.`,
        }),
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

  return (
    <div className="cr-wrap">
      <aside className="card cr-list">
        <h2 className="cr-h">The corpus</h2>
        <div className="cr-tablewrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Call</th>
                <th>When</th>
                <th className="cr-hide-sm">Direction</th>
                <th>Length</th>
                <th className="cr-hide-sm">Turns</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c) => (
                <tr
                  key={c.id}
                  className={c.id === call.id ? "on" : ""}
                  onClick={() => select(c.id)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && select(c.id)}
                >
                  <td className="cr-who">{c.id}</td>
                  <td className="muted">{day(c.when)}</td>
                  <td className="cr-hide-sm muted">{c.direction}</td>
                  <td className="cr-num">{mmss(c.duration_sec)}</td>
                  <td className="cr-hide-sm muted cr-num">{c.turns.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>

      <section className="card cr-detail" ref={detailRef}>
        <h2 className="cr-h" style={{ marginBottom: 10 }}>
          {call.id}
          <span className="muted" style={{ fontWeight: 400 }}>
            {" "}· {day(call.when)} · {call.direction} · {mmss(call.duration_sec)}
          </span>
        </h2>

        {call.campaign && (
          <div className="cr-meta">
            <div><span>Campaign</span><b>{call.campaign}</b></div>
          </div>
        )}

        <fieldset className="seat-pick">
          <legend className="small muted">Grade this call as</legend>
          <label className={`seat ${role === "intake" ? "on" : ""}`}>
            <input type="radio" checked={role === "intake"} onChange={() => setRole("intake")} />
            <span>
              <strong>Intake desk</strong>
              <em className="small muted">Answered, qualified, booked. Never gives a number.</em>
            </span>
          </label>
          <label className={`seat ${role === "acquisition" ? "on" : ""}`}>
            <input
              type="radio"
              checked={role === "acquisition"}
              onChange={() => setRole("acquisition")}
            />
            <span>
              <strong>Acquisitions</strong>
              <em className="small muted">Took the handoff. Presents the offer and the math.</em>
            </span>
          </label>
        </fieldset>

        <div className="row" style={{ gap: 8, marginBottom: 12 }}>
          <button className="btn" onClick={grade} disabled={busy}>
            {busy ? "Grading…" : "Grade this call"}
          </button>
          {error && <span className="small" style={{ color: "var(--red)" }}>{error}</span>}
        </div>

        {report && (
          <div className={`score-card ${report.pass ? "score-pass" : "score-fail"}`} style={{ marginBottom: 14 }}>
            <ReportView data={report} />
          </div>
        )}

        {call.crm_summary && (
          <details className="notice notice-gray small" style={{ marginBottom: 12 }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>REI BlackBook&apos;s own summary</summary>
            <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{call.crm_summary}</p>
          </details>
        )}

        <h3 className="cr-h3">Transcript</h3>
        <div className="cr-tr no-ts">
          {call.turns.map((t, i) => {
            const label = who(t.speaker, call.direction);
            return (
              <div key={i} className="cr-turn">
                <span className={`cr-role ${label === "Rep" ? "me" : ""}`}>{label}</span>
                <span className="cr-say">{t.text}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
