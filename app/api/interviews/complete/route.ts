import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SCORING_MODEL } from "@/lib/models";
import { versantScoringPrompt, versantVerdict } from "@/lib/versant-prompts";
import { resolveDraw } from "@/lib/academy";
import { dispoScoringPrompt, dispoVerdict } from "@/lib/dispo-prompts";
import { getDispoAgent, DISPO_MAX_SCORE } from "@/lib/dispo";

// Called by the session page when it ends (complete or aborted).
// Saves transcript + audio recording, marks the trainee as interviewed.
// Certification calls are auto-graded here (instant result). Drill-room
// runs are OPTIONAL coached practice — saved for admin review, never
// graded (the coaching happened live, on the call). Sales calls stay
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
  const isDispo = (interview as any).candidates?.mode === "dispo";
  const isDrill = interview.exam_meta?.kind === "drill";
  const isCert = isTraining && !isDrill && !!interview.exam_meta;
  const isDispoCall = isDispo && interview.exam_meta?.kind === "dispo";

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
      ...(!isTraining && !isDispo && (attemptsUsed ?? 0) >= 3
        ? { token_expires_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", interview.candidate_id);

  // Drill-room runs: never graded — the coach already gave advice on the
  // call itself. Saved (transcript + audio) for admin review only.
  if (isDrill) {
    return NextResponse.json({ ok: true, drill: { practice: true } });
  }

  // ---- Dispo-call auto-grading (12-item rubric, breaches = fail) ----
  if (isDispoCall && transcript.length >= 4) {
    const transcriptText = transcript
      .map((t) => `${t.role === "agent" ? "AGENT" : "REP"}: ${t.text}`)
      .join("\n");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const result = await ai.models.generateContent({
        model: process.env.SCORING_MODEL || SCORING_MODEL,
        contents: dispoScoringPrompt(transcriptText, interview.exam_meta),
      });
      const parsed = JSON.parse((result.text ?? "").replace(/```json|```/g, "").trim());
      parsed.kind = "dispo"; // discriminator for the admin score renderer
      const v = dispoVerdict(parsed);

      await db.from("scores").insert({
        interview_id: interviewId,
        detail: parsed,
        knockout: v.breaches.length > 0,
        knockout_reason: v.verdict === "PASS" ? null : v.reason,
        verdict: v.verdict,
        scored_by: "ai",
        notes: [parsed.coaching_note, parsed.summary_note].filter(Boolean).join(" · "),
        completeness: v.total,
      });
      await db.from("candidates").update({ status: "scored" }).eq("id", interview.candidate_id);

      return NextResponse.json({
        ok: true,
        cert: {
          graded: true,
          pass: v.verdict === "PASS",
          reason: v.reason,
          summary: `scored ${v.total}/${DISPO_MAX_SCORE}`,
          coaching: parsed.coaching_note || "",
          picked: !!interview.exam_meta.picked,
          who: getDispoAgent(interview.exam_meta.agent)?.label ?? "",
        },
      });
    } catch {
      return NextResponse.json({
        ok: true,
        cert: { graded: false, pass: false, reason: "", summary: "", coaching: "" },
      });
    }
  }

  // ---- Certification-call auto-grading ----
  if (isCert && transcript.length >= 4) {
    const transcriptText = transcript
      .map((t) => `${t.role === "agent" ? "SELLER" : "TRAINEE"}: ${t.text}`)
      .join("\n");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const result = await ai.models.generateContent({
        model: process.env.SCORING_MODEL || SCORING_MODEL,
        contents: versantScoringPrompt(transcriptText, interview.exam_meta),
      });
      const parsed = JSON.parse((result.text ?? "").replace(/```json|```/g, "").trim());
      const v = versantVerdict(parsed);

      await db.from("scores").insert({
        interview_id: interviewId,
        detail: parsed,
        knockout: (parsed.hard_fails ?? []).length > 0,
        knockout_reason: v.verdict === "PASS" ? null : v.reason,
        verdict: v.verdict,
        scored_by: "ai",
        notes: [parsed.coaching_note, parsed.summary_note].filter(Boolean).join(" · "),
        completeness: v.criteriaScore,
        conversational: v.itemsPassed,
      });
      await db.from("candidates").update({ status: "scored" }).eq("id", interview.candidate_id);

      return NextResponse.json({
        ok: true,
        cert: {
          graded: true,
          pass: v.verdict === "PASS",
          reason: v.reason,
          summary: `call ${v.criteriaScore}/10 · seller lines ${v.itemsPassed}/${v.itemsTotal}`,
          coaching: parsed.coaching_note || "",
          picked: !!interview.exam_meta.picked,
          who: resolveDraw(interview.exam_meta).persona.label,
        },
      });
    } catch (e: any) {
      // Grading failed — attempt saved; admin can grade it via Score with AI.
      return NextResponse.json({
        ok: true,
        cert: { graded: false, pass: false, reason: "", summary: "", coaching: "" },
      });
    }
  }

  return NextResponse.json({ ok: true, attemptsUsed: attemptsUsed ?? 0 });
}
