import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { LIVE_MODEL } from "@/lib/models";
import { johnSystemPrompt } from "@/lib/sales-prompts";
import { versantSystemPrompt } from "@/lib/versant-prompts";
import { drawExam } from "@/lib/academy";

// Trainee clicked "start". Validates the link token, logs consent, creates
// the session row, and mints a single-use ephemeral token so the
// GEMINI_API_KEY never reaches the browser.
//
// Modes:
//   'training' — Versant certification test. Unlimited attempts; the exam
//                draw (personas/items) is stored on the row for scoring.
//   'sales'    — practice call vs "John" (max 3 attempts, easy/hard).
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: candidate } = await db
    .from("candidates")
    .select("*")
    .eq("interview_token", token)
    .single();

  if (!candidate) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const isTraining = candidate.mode === "training";

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

  // Training: draw this run's exam (3 pressure lines, 3 questions, 1 seller
  // persona) and persist the draw so the scorer grades the same material.
  const examMeta = isTraining ? drawExam() : null;

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
    systemPrompt: isTraining
      ? versantSystemPrompt(candidate.full_name, examMeta!)
      : johnSystemPrompt(candidate.difficulty === "hard" ? "hard" : "easy"),
    mode: candidate.mode || "sales",
    attempt: (attemptsUsed ?? 0) + 1,
    maxAttempts: isTraining ? null : MAX_ATTEMPTS,
  });
}
