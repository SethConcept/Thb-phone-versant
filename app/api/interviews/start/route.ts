import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LIVE_MODEL } from "@/lib/models";
import { johnSystemPrompt } from "@/lib/sales-prompts";
import { versantSystemPrompt } from "@/lib/versant-prompts";
import { drawExam, currentCycleSeen } from "@/lib/academy";
import { drawPractice, PRACTICE_MODES } from "@/lib/drills";
import { drillSystemPrompt } from "@/lib/drill-prompts";
import { pathState } from "@/lib/progress";
import { isAdminPreview } from "@/lib/admin-preview";

// Trainee clicked "start". Validates the link token, logs consent, creates
// the session row, and mints a single-use ephemeral token so the
// GEMINI_API_KEY never reaches the browser.
//
// Sessions:
//   training + drill  — the OPTIONAL drill room (coached practice, ungated,
//                       never graded; drill = 'one' | 'three')
//   training          — a certification call (requires all module quizzes,
//                       unless the trainee has the skip_modules override)
//   sales             — practice call vs "John" (max 3 attempts, easy/hard)
export async function POST(req: Request) {
  const { token, drill, persona } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: candidate } = await db
    .from("candidates")
    .select("*")
    .eq("interview_token", token)
    .single();

  if (!candidate) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const isTraining = candidate.mode === "training";
  const isDrill = isTraining && typeof drill === "string" && drill.length > 0;

  if (!isTraining) {
    if (candidate.token_expires_at && new Date(candidate.token_expires_at) < new Date())
      return NextResponse.json({ error: "This link has expired" }, { status: 410 });
    if (["hired", "declined"].includes(candidate.status))
      return NextResponse.json({ error: "This link is closed" }, { status: 409 });
  }

  // Sales practice: up to 3 attempts (abandoned/errored sessions don't burn
  // one). Training: unlimited — certification needs repeated passes.
  const MAX_ATTEMPTS = 3;
  const { count: attemptsUsed } = await db
    .from("interviews")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", candidate.id)
    .eq("completed", true);
  if (!isTraining && (attemptsUsed ?? 0) >= MAX_ATTEMPTS)
    return NextResponse.json({ error: "All attempts have been used" }, { status: 409 });

  // Learning-path gates (admin preview cookie bypasses them)
  const preview = await isAdminPreview();
  let examMeta: any = null;
  if (isDrill) {
    // Drill room is optional and ungated — anyone with a training link can
    // practice anytime. Never graded, never counts toward anything.
    if (!PRACTICE_MODES[drill])
      return NextResponse.json({ error: "Unknown drill mode" }, { status: 404 });
    examMeta = drawPractice(drill);
  } else if (isTraining) {
    if (!candidate.skip_modules && !preview) {
      const { data: rows } = await db
        .from("module_progress")
        .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
        .eq("candidate_id", candidate.id);
      const state = pathState(rows ?? []);
      if (!state.allComplete)
        return NextResponse.json(
          { error: "Finish all modules in the learning path to unlock certification calls" },
          { status: 409 }
        );
    }
    // Deal the seller without replacement: exclude personas already seen in
    // the trainee's current cycle so the first 10 calls cover all 10 sellers.
    // A specific dialed seller (persona param) becomes a practice call.
    const { data: past } = await db
      .from("interviews")
      .select("exam_meta, started_at")
      .eq("candidate_id", candidate.id)
      .not("exam_meta", "is", null)
      .order("started_at", { ascending: true });
    const personaHistory = (past ?? [])
      .map((r: any) => r.exam_meta)
      .filter((m: any) => m && m.kind !== "drill" && m.persona && !m.picked)
      .map((m: any) => m.persona as string);
    examMeta = drawExam(
      currentCycleSeen(personaHistory),
      typeof persona === "string" && persona ? persona : undefined
    );
  }

  const { data: interview, error } = await db
    .from("interviews")
    .insert({
      candidate_id: candidate.id,
      consent_given: true,
      consent_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      ...(examMeta ? { exam_meta: examMeta } : {}),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ephemeral token: single session, expires in 15 minutes.
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const authToken = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      httpOptions: { apiVersion: "v1alpha" },
    },
  });

  return NextResponse.json({
    interviewId: interview.id,
    ephemeralToken: authToken.name,
    // LIVE_MODEL env var overrides the default — lets us switch Live model
    // names from Vercel settings without a code change (they rotate often)
    model: process.env.LIVE_MODEL || LIVE_MODEL,
    systemPrompt: isDrill
      ? drillSystemPrompt(candidate.full_name, examMeta)
      : isTraining
        ? versantSystemPrompt(candidate.full_name, examMeta)
        : johnSystemPrompt(candidate.difficulty === "hard" ? "hard" : "easy"),
    mode: isDrill ? "drill" : candidate.mode || "sales",
    attempt: (attemptsUsed ?? 0) + 1,
    maxAttempts: isTraining ? null : MAX_ATTEMPTS,
  });
}
