import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { CALL_SKILL, CALL_SKILL_MAX, PROCESS_COMPLIANCE } from "@/lib/sales-standard";
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
        <table className="table" style={{ marginTop: 10 }}>
          <tbody>
            {CALL_SKILL.map((c) => (
              <tr key={c.id}>
                <td style={{ width: 190 }}>{c.name}</td>
                <td style={{ width: 60 }}>{c.points} pts</td>
                <td className="small muted">{c.looksLike}</td>
              </tr>
            ))}
            <tr>
              <td>{PROCESS_COMPLIANCE.name}</td>
              <td>{PROCESS_COMPLIANCE.points} pts</td>
              <td className="small muted">{PROCESS_COMPLIANCE.note}</td>
            </tr>
          </tbody>
        </table>
        <p className="notice notice-amber small" style={{ marginBottom: 0 }}>
          <strong>These weights are provisional.</strong> They come from the written Phone Academy rules, not
          from analysing real winning calls. Once the game film is in — real recordings with outcome labels —
          the numbers get replaced with what actually separates a won call from a lost one.
        </p>
      </details>

      <GradeClient />
    </main>
  );
}
