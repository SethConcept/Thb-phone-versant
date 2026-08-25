import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { gradeQuiz } from "@/lib/quizzes";
import { getModule } from "@/lib/modules";
import { getDispoModule, gradeDispoQuiz } from "@/lib/dispo";

// Trainee submits a module quiz. Token-authenticated (their link IS their
// identity), graded server-side so answer keys never ship to the browser.
// Best score wins — retakes never lower stored progress. Each mode grades
// against its own track: training → m1..m8, dispo → d1..d7.
export async function POST(req: Request) {
  const { token, moduleId, answers } = await req.json().catch(() => ({}));
  if (!token || !moduleId || !Array.isArray(answers))
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, mode")
    .eq("interview_token", token)
    .single();
  if (!trainee || !["training", "dispo"].includes(trainee.mode))
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const isDispo = trainee.mode === "dispo";
  if (isDispo ? !getDispoModule(moduleId) : !getModule(moduleId))
    return NextResponse.json({ error: "Unknown module" }, { status: 404 });

  const graded = isDispo
    ? gradeDispoQuiz(moduleId, answers.map(Number))
    : gradeQuiz(moduleId, answers.map(Number));

  const { data: existing } = await db
    .from("module_progress")
    .select("id, quiz_score, quiz_passed")
    .eq("candidate_id", trainee.id)
    .eq("module_id", moduleId)
    .maybeSingle();

  const bestScore = Math.max(graded.score, existing?.quiz_score ?? 0);
  const passed = graded.passed || !!existing?.quiz_passed;

  const { error } = await db.from("module_progress").upsert(
    {
      candidate_id: trainee.id,
      module_id: moduleId,
      quiz_score: bestScore,
      quiz_total: graded.total,
      quiz_passed: passed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "candidate_id,module_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    score: graded.score,
    total: graded.total,
    passed: graded.passed,
    results: graded.results,
  });
}
