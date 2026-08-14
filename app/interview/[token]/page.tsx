import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InterviewClient from "./interview-client";
import { SELLER_BRAND } from "@/lib/academy";
import { CALL_SCRIPT } from "@/lib/sales-prompts";
import { DRILLS } from "@/lib/drills";
import { pathState } from "@/lib/progress";
import { isAdminPreview } from "@/lib/admin-preview";

export default async function InterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ drill?: string }>;
}) {
  const { token } = await params;
  const { drill } = await searchParams;
  const db = supabaseAdmin();
  const { data: candidate } = await db
    .from("candidates")
    .select("id, full_name, status, token_expires_at, mode, difficulty, skip_modules")
    .eq("interview_token", token)
    .single();

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="candidate-bg">
      <main className="card candidate-card fade-in">{children}</main>
    </div>
  );

  if (!candidate)
    return <Shell><h1>Link not found</h1><p>Please check the link you received, or contact {SELLER_BRAND}.</p></Shell>;

  const isTraining = candidate.mode === "training";
  const drillDef = isTraining && drill ? DRILLS[drill] : undefined;

  const { count: attemptsUsed } = await db
    .from("interviews")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", candidate.id)
    .eq("completed", true);

  // Training links never expire and have no attempt cap — certification
  // takes as many runs as it takes. Sales practice keeps the 3-attempt cap.
  if (!isTraining) {
    const expired = candidate.token_expires_at && new Date(candidate.token_expires_at) < new Date();
    const closed = ["hired", "declined"].includes(candidate.status);
    if (expired || closed || (attemptsUsed ?? 0) >= 3)
      return <Shell><h1>Link unavailable</h1><p>This practice link was already used or has expired. If you believe this is a mistake, contact {SELLER_BRAND}.</p></Shell>;
  }

  // The full certification test is gated behind the learning path.
  const preview = await isAdminPreview();
  if (isTraining && !drillDef && !candidate.skip_modules && !preview) {
    const { data: rows } = await db
      .from("module_progress")
      .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
      .eq("candidate_id", candidate.id);
    const state = pathState(rows ?? []);
    if (!state.allComplete)
      return (
        <Shell>
          <h1>🔒 Certification calls locked</h1>
          <p>Finish all eight modules in your learning path — content, quizzes, and voice drills — and the certification calls unlock automatically.</p>
          <Link className="btn" href={`/learn/${token}`}>Go to my learning path</Link>
        </Shell>
      );
  }

  return (
    <InterviewClient
      token={token}
      candidateName={candidate.full_name}
      attemptsUsed={attemptsUsed ?? 0}
      mode={drillDef ? "drill" : isTraining ? "training" : "sales"}
      script={isTraining ? "" : CALL_SCRIPT}
      drillModule={drillDef ? drill! : ""}
      drillTitle={drillDef ? drillDef.title : ""}
      drillIntro={drillDef ? drillDef.intro : ""}
    />
  );
}
