"use client";

// Call review, two panes: the call list on the left, the selected call's
// full record on the right — recording, transcript, coach report. Collapses
// to a single column on narrow screens (list first, detail below).
//
// Receives only plain data (ReportData built server-side), so no persona
// content ever reaches the browser.

import { useRef, useState } from "react";
import { ReportView, type ReportData } from "@/components/report-view";

export type Turn = { role: "agent" | "candidate"; text: string; offset: number; flagged: boolean };

export type PracticeSuggestion = { id: string; label: string; because: string };

export type CallRow = {
  id: string;
  startedAt: string | null;
  who: string;
  practice?: PracticeSuggestion[];
  kind: "cert" | "practice" | "drill";
  durationSec: number | null;
  score100: number | null;
  outcome: { label: string; tone: "green" | "amber" | "gray" };
  audioUrl: string | null;
  transcript: Turn[];
  report: ReportData | null;
  ungraded: string | null;
};

const mmss = (sec: number | null) =>
  sec == null ? "—" : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

const whenLabel = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today ${time}`;
  if (d.toDateString() === yest.toDateString()) return `Yesterday ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
};

const kindLabel = (k: CallRow["kind"]) =>
  k === "cert" ? "Certification" : k === "practice" ? "Practice" : "Drill room";

export default function ResultsClient({
  calls,
  isDispo,
  token,
}: {
  calls: CallRow[];
  isDispo: boolean;
  token: string;
}) {
  const [selectedId, setSelectedId] = useState(calls[0]?.id ?? "");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioDur, setAudioDur] = useState(0);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const call = calls.find((c) => c.id === selectedId) ?? calls[0];
  if (!call) return null;

  function select(id: string) {
    setSelectedId(id);
    setAudioDur(0);
    // on phones the detail sits below the list — bring it into view
    if (typeof window !== "undefined" && window.innerWidth < 980)
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function seekTo(offset: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = offset;
    el.play().catch(() => {});
  }

  // Flagged moments become ticks over the recording
  const total = audioDur || call.durationSec || 0;
  const ticks = call.transcript.filter((t) => t.flagged && total > 0 && t.offset <= total);

  return (
    <div className="cr-wrap">
      {/* ---------------- list ---------------- */}
      <aside className="card cr-list">
        <h2 className="cr-h">Recent calls</h2>
        <div className="cr-tablewrap">
          <table className="cr-table">
            <thead>
              <tr>
                <th>When</th>
                <th>{isDispo ? "Agent" : "Caller"}</th>
                <th className="cr-hide-sm">Type</th>
                <th className="cr-hide-sm">Talk</th>
                <th>Score</th>
                <th>Outcome</th>
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
                  <td className="muted" suppressHydrationWarning>{whenLabel(c.startedAt)}</td>
                  <td className="cr-who">{c.who}</td>
                  <td className="cr-hide-sm muted">{kindLabel(c.kind)}</td>
                  <td className="cr-hide-sm muted cr-num">{mmss(c.durationSec)}</td>
                  <td className="cr-num">
                    {c.score100 == null ? <span className="muted">—</span> : <strong>{c.score100}</strong>}
                  </td>
                  <td>
                    <span className={`cr-dot cr-${c.outcome.tone}`} /> {c.outcome.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>

      {/* ---------------- detail ---------------- */}
      <section className="card cr-detail" ref={detailRef}>
        <h2 className="cr-h" style={{ marginBottom: 10 }}>
          {call.who}
          <span className="muted" style={{ fontWeight: 400 }} suppressHydrationWarning>
            {" "}· {whenLabel(call.startedAt)}
          </span>
        </h2>

        <div className="cr-meta">
          <div><span>Type</span><b>{kindLabel(call.kind)}</b></div>
          <div><span>Duration</span><b>{mmss(call.durationSec)}</b></div>
          <div><span>{isDispo ? "Agent" : "Caller"}</span><b>{call.who}</b></div>
          <div><span>Score</span><b>{call.score100 == null ? "—" : `${call.score100} / 100`}</b></div>
          <div><span>Outcome</span><b>{call.outcome.label}</b></div>
        </div>

        {call.audioUrl ? (
          <div className="cr-player">
            <audio
              ref={audioRef}
              controls
              src={call.audioUrl}
              style={{ width: "100%" }}
              onLoadedMetadata={(e) => {
                const dur = (e.target as HTMLAudioElement).duration;
                if (Number.isFinite(dur)) setAudioDur(dur);
              }}
            />
            {ticks.length > 0 && (
              <>
                <div className="cr-tickrail" aria-hidden>
                  {ticks.map((t, i) => (
                    <button
                      key={i}
                      className="cr-tick"
                      style={{ left: `${Math.min(99, (t.offset / total) * 100)}%` }}
                      title={`Jump to ${mmss(t.offset)}`}
                      onClick={() => seekTo(t.offset)}
                    />
                  ))}
                </div>
                <p className="cr-hint">Red ticks mark the moments the coach flagged. Click one to jump.</p>
              </>
            )}
          </div>
        ) : (
          <p className="small muted">No recording saved for this call.</p>
        )}

        {call.transcript.length > 0 && (
          <>
            <h3 className="cr-h3">Transcript</h3>
            <div className="cr-tr">
              {call.transcript.map((t, i) => (
                <div
                  key={i}
                  className={`cr-turn ${t.flagged ? "flagged" : ""}`}
                  onClick={() => call.audioUrl && seekTo(t.offset)}
                >
                  <span className="cr-t">{mmss(t.offset)}</span>
                  <span className={`cr-role ${t.role === "candidate" ? "me" : ""}`}>
                    {t.role === "agent" ? (isDispo ? "Agent" : "Caller") : "Me"}
                  </span>
                  <span className="cr-say">{t.text}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {call.report ? (
          <>
            <h3 className="cr-h3">Coach</h3>
            <div className={`score-card ${call.report.pass ? "score-pass" : "score-fail"}`}>
              <ReportView data={call.report} />
            </div>
            {(call.practice ?? []).length > 0 && (
              <div className="cr-practice">
                <strong>Practice this</strong>
                <p className="small muted" style={{ margin: "2px 0 8px" }}>
                  These callers will make you do the thing you missed. Practice calls are graded but
                  don&apos;t count toward certification.
                </p>
                <div className="row" style={{ gap: 8 }}>
                  {(call.practice ?? []).map((p) => (
                    <a key={p.id} className="btn btn-secondary" href={`/interview/${token}`} title={p.because}>
                      ☎️ {p.label.split(" — ")[0]} — {p.because}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="notice notice-gray small" style={{ marginTop: 12 }}>
            {call.ungraded ?? "Not graded."}
          </p>
        )}
      </section>
    </div>
  );
}
