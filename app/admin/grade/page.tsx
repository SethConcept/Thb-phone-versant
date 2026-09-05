import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import {
  ROLE_SKILL,
  ROLE_LABEL,
  ROLE_BLURB,
  CALL_SKILL_MAX,
  PROCESS_COMPLIANCE,
  type CallRole,
} from "@/lib/sales-standard";
import GradeClient from "./grade-client";

// Grade a real recorded call against the THB Sales Standard, by pasting its
// transcript. No telephony required — this is how real calls get scored
// today, and the same standard a monitoring pipeline will use later.
export default async function GradePage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <main className="fade-in">
      <Link href="/admin" className="small">← All trainees</Link>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Grade a real call</h1>
        <span className="pill pill-gray">THB Sales Standard</span>
      </div>
      <p className="muted small" style={{ maxWidth: "70ch" }}>
        Paste the transcript of an actual seller call — one of Juan&apos;s, or any rep&apos;s — and score it
        against the same standard the practice calls use. Nothing is saved; this is for review and for
        checking the standard itself against real calls.
      </p>

      <details className="card" style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
          What the standard scores ({CALL_SKILL_MAX} points from the call, {PROCESS_COMPLIANCE.points} reserved)
        </summary>
        {(["intake", "acquisition"] as CallRole[]).map((role) => (
          <div key={role} style={{ marginTop: 14 }}>
            <h3 style={{ fontSize: 14, margin: "0 0 2px" }}>{ROLE_LABEL[role]}</h3>
            <p className="small muted" style={{ margin: "0 0 8px", maxWidth: "70ch" }}>
              {ROLE_BLURB[role]}
            </p>
            <table className="table">
              <tbody>
                {ROLE_SKILL[role].map((c) => (
                  <tr key={c.id}>
                    <td style={{ width: 190 }}>{c.name}</td>
                    <td style={{ width: 60 }}>{c.points} pts</td>
                    <td className="small muted">{c.looksLike}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <table className="table" style={{ marginTop: 10 }}>
          <tbody>
            <tr>
              <td style={{ width: 190 }}>{PROCESS_COMPLIANCE.name}</td>
              <td style={{ width: 60 }}>{PROCESS_COMPLIANCE.points} pts</td>
              <td className="small muted">{PROCESS_COMPLIANCE.note}</td>
            </tr>
          </tbody>
        </table>
        <p className="notice notice-blue small" style={{ marginBottom: 0 }}>
          <strong>Calibrated against 52 real calls</strong> (September 2026) — read them at{" "}
          <Link href="/admin/calls">the call library</Link>, and the reasoning in{" "}
          <code>docs/CALL-FINDINGS.md</code>. The headline change: the desk and acquisitions are graded
          differently, because quoting a number is a hard fail in one seat and the job in the other.
        </p>
      </details>

      <GradeClient />
    </main>
  );
}
