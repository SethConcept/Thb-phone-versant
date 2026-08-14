import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SCORING_MODEL } from "@/lib/models";
import { drillScoringPrompt } from "@/lib/drill-prompts";
import { drillVerdict } from "@/lib/drills";

// Called by the session page when it ends (complete or aborted).
// Saves transcript + audio recording, marks the trainee as interviewed.
// Mini-drills are auto-graded here so the trainee gets an instant result
// and the learning path can gate on it; full tests and sales calls stay
// admin-graded via /api/score.
export async function POST(req: Request) {
  const form = await req.formData();
  const interviewId = String(form.get("interviewId") || "");
  const transcriptRaw = String(form.get("transcript") || "[]");
  const completed = String(form.get("completed")) === "true";
  const audio = form.get("audio") as File | null;
  const candidateNotes = String(form.get("notes") || "").trim();

  if (!interviewId) return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: interview } = await db
    .from("interviews")
    .select("*, candidates(mode)")
    .eq("id", interviewId)
    .single();
  if (!interview) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (interview.completed) return NextResponse.json({ error: "Already completed" }, { status: 409 });

  const isTraining = (interview as any).candidates?.mode === "training";
  const isDrill = interview.exam_meta?.kind === "drill";

  let audio_url: string | null = null;
  if (audio && audio.size > 0) {
    const path = `${interview.candidate_id}/${interviewId}.webm`;
    const { error: upErr } = await db.storage
      .from("interview-audio")
      .upload(path, audio, { contentType: audio.type || "audio/webm", upsert: true });
    if (!upErr) audio_url = path;
  }

  let transcript: any[] = [];
  try {
    const parsed = JSON.parse(transcriptRaw);
    if (Array.isArray(parsed)) transcript = parsed;
  } catch {}

  await db
    .from("interviews")
    .update({
      ended_at: new Date().toISOString(),
      transcript,
      audio_url,
      completed,
      ...(candidateNotes ? { candidate_notes: candidateNotes } : {}),
    })
    .eq("id", interviewId);

  // Sales practice links expire once all 3 attempts are used. Training links
  // never expire — trainees run drills and tests as often as it takes.
  const { count: attemptsUsed } = await db
    .from("interviews")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", interview.candidate_id)
    .eq("completed", true);

  await db
    .from("candidates")
    .update({
      status: "interviewed",
      ...(!isTraining && (attemptsUsed ?? 0) >= 3
        ? { token_expires_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", interview.candidate_id);

  // ---- Drill auto-grading ----
  if (isDrill && transcript.length >= 2) {
    const transcriptText = transcript
      .map((t) => `${t.role === "agent" ? "EXAMINER/SELLER" : "TRAINEE"}: ${t.text}`)
      .join("\n");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const result = await ai.models.generateContent({
        model: process.env.SCORING_MODEL || SCORING_MODEL,
        contents: drillScoringPrompt(transcriptText, interview.exam_meta),
      });
      const parsed = JSON.parse((result.text ?? "").replace(/```json|```/g, "").trim());
      const v = drillVerdict(interview.exam_meta, parsed);

      // audit record for admin
      await db.from("scores").insert({
        interview_id: interviewId,
        detail: parsed,
        knockout: (parsed.hard_fails ?? []).length > 0,
        knockout_reason: v.pass ? null : v.reason,
        verdict: v.pass ? "PASS" : "FAIL",
        scored_by: "ai",
        notes: parsed.coaching_note || null,
      });

      // gate progress: drill_passed only ever flips forward
      if (v.pass) {
        const { data: existing } = await db
          .from("module_progress")
          .select("id, quiz_score, quiz_total, quiz_passed")
          .eq("candidate_id", interview.candidate_id)
          .eq("module_id", interview.exam_meta.module)
          .maybeSingle();
        await db.from("module_progress").upsert(
          {
            candidate_id: interview.candidate_id,
            module_id: interview.exam_meta.module,
            quiz_score: existing?.quiz_score ?? null,
            quiz_total: existing?.quiz_total ?? null,
            quiz_passed: existing?.quiz_passed ?? false,
            drill_passed: true,
            drill_interview_id: interviewId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "candidate_id,module_id" }
        );
      }

      return NextResponse.json({
        ok: true,
        drill: {
          graded: true,
          pass: v.pass,
          reason: v.reason,
          summary: v.summary,
          coaching: parsed.coaching_note || "",
        },
      });
    } catch (e: any) {
      // Grading failed (quota, parse error) — the attempt is saved; the
      // trainee can rerun the drill, or an admin can grade it manually.
      return NextResponse.json({
        ok: true,
        drill: { graded: false, pass: false, reason: "", summary: "", coaching: "" },
      });
    }
  }

  return NextResponse.json({ ok: true, attemptsUsed: attemptsUsed ?? 0 });
}
