import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SCORING_MODEL } from "@/lib/models";
import { salesScoringPrompt } from "@/lib/sales-prompts";
import { versantScoringPrompt, versantVerdict } from "@/lib/versant-prompts";
import { drillScoringPrompt } from "@/lib/drill-prompts";
import { drillVerdict } from "@/lib/drills";
import { DRILL_CRITERIA } from "@/lib/academy";

// Admin-only: send a session transcript to Gemini with the matching rubric
// (Versant certification or John sales practice), store the result in
// `scores`, and update the trainee's status.
export async function POST(req: Request) {
  // Require a logged-in admin
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interviewId } = await req.json().catch(() => ({}));
  if (!interviewId) return NextResponse.json({ error: "Missing interviewId" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: interview } = await db
    .from("interviews")
    .select("*, candidates(mode)")
    .eq("id", interviewId)
    .single();
  if (!interview?.transcript)
    return NextResponse.json({ error: "No transcript to score" }, { status: 404 });

  const isTraining = (interview as any).candidates?.mode === "training";
  if (isTraining && !interview.exam_meta)
    return NextResponse.json(
      { error: "Missing exam draw on this attempt — cannot grade it" },
      { status: 409 }
    );
  const isDrill = isTraining && interview.exam_meta?.kind === "drill";

  const transcriptText = (interview.transcript as any[])
    .map((t) =>
      isTraining
        ? `${t.role === "agent" ? "EXAMINER/SELLER" : "TRAINEE"}: ${t.text}`
        : `${t.role === "agent" ? "JOHN (seller)" : "TRAINEE (agent)"}: ${t.text}`
    )
    .join("\n");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let result;
  try {
    result = await ai.models.generateContent({
      model: process.env.SCORING_MODEL || SCORING_MODEL,
      contents: isDrill
        ? drillScoringPrompt(transcriptText, interview.exam_meta)
        : isTraining
          ? versantScoringPrompt(transcriptText, interview.exam_meta)
          : salesScoringPrompt(transcriptText),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `Scoring model error: ${e?.message || e}` },
      { status: 502 }
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse((result.text ?? "").replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "AI returned unparseable output — retry" }, { status: 502 });
  }

  let row: Record<string, unknown>;
  let verdict: string;

  if (isDrill) {
    // Mini-drill re-grade — deterministic pass rule per drill kind.
    const v = drillVerdict(interview.exam_meta, parsed);
    verdict = v.pass ? "PASS" : "FAIL";
    row = {
      interview_id: interviewId,
      detail: parsed,
      knockout: (parsed.hard_fails ?? []).length > 0,
      knockout_reason: v.pass ? null : v.reason,
      verdict,
      scored_by: "ai",
      notes: parsed.coaching_note || null,
    };
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
  } else if (isTraining) {
    // Certification call — deterministic verdict, the code decides.
    const v = versantVerdict(parsed);
    verdict = v.verdict;
    const hardFails = Array.isArray(parsed.hard_fails) ? parsed.hard_fails : [];
    row = {
      interview_id: interviewId,
      detail: parsed, // full structured breakdown (open, items, criteria, quotes)
      knockout: hardFails.length > 0 || parsed.part_a?.recording_disclosure !== true,
      knockout_reason: v.reason || null,
      verdict,
      scored_by: "ai",
      notes: [parsed.coaching_note, parsed.summary_note].filter(Boolean).join(" · "),
      // quick-scan columns
      completeness: v.criteriaScore, // call criteria hit, out of DRILL_CRITERIA.length
      conversational: v.itemsPassed, // embedded seller lines passed
    };
  } else {
    // Sales practice ("John") — averaged categories with tunable bands.
    const PASS_BAR = Number(process.env.PASS_BAR || 3.0);
    const BORDERLINE_BAR = Number(process.env.BORDERLINE_BAR || 2.5);
    const cats = [
      parsed.warmth, parsed.clarity, parsed.confidence, parsed.professionalism,
      parsed.conversational, parsed.completeness, parsed.ending_handling,
    ].map(Number);
    const avg = cats.reduce((a, b) => a + b, 0) / cats.length;
    verdict = parsed.flag
      ? "FAIL"
      : avg >= PASS_BAR
        ? "PASS"
        : avg >= BORDERLINE_BAR
          ? "BORDERLINE"
          : "FAIL";
    row = {
      interview_id: interviewId,
      warmth: parsed.warmth,
      clarity: parsed.clarity,
      confidence: parsed.confidence,
      professionalism: parsed.professionalism,
      conversational: parsed.conversational,
      completeness: parsed.completeness,
      ending_handling: parsed.ending_handling,
      outcome: parsed.outcome || "INCOMPLETE",
      knockout: !!parsed.flag,
      knockout_reason: parsed.flag_reason || null,
      verdict,
      scored_by: "ai",
      notes: [parsed.coaching_note, parsed.summary_note].filter(Boolean).join(" · "),
    };
  }

  const { error } = await db.from("scores").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db
    .from("candidates")
    .update({ status: "scored" })
    .eq("id", interview.candidate_id);

  return NextResponse.json({
    ok: true,
    verdict,
    ...(isTraining && !isDrill
      ? { call: `${(row as any).completeness}/${DRILL_CRITERIA.length}` }
      : {}),
  });
}
