import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Called by the session page when it ends (complete or aborted).
// Saves transcript + audio recording, marks the trainee as interviewed.
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

  let audio_url: string | null = null;
  if (audio && audio.size > 0) {
    const path = `${interview.candidate_id}/${interviewId}.webm`;
    const { error: upErr } = await db.storage
      .from("interview-audio")
      .upload(path, audio, { contentType: audio.type || "audio/webm", upsert: true });
    if (!upErr) audio_url = path;
  }

  let transcript: unknown = [];
  try {
    transcript = JSON.parse(transcriptRaw);
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
  // never expire — trainees run the test as often as it takes to certify.
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

  return NextResponse.json({ ok: true, attemptsUsed: attemptsUsed ?? 0 });
}
