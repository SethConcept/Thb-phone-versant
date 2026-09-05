import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SCORING_MODEL } from "@/lib/models";
import { salesStandardPrompt, type CallRole } from "@/lib/sales-standard";
import { buildStandardReport } from "@/lib/call-report";

// Admin-only: grade ANY pasted call transcript against the THB Sales
// Standard. No persona, no draw, no answer key — this is the path for real
// recorded calls, and the same route a real-call monitoring pipeline would
// use once transcripts arrive automatically.
export async function POST(req: Request) {
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

  const { transcript, context, role: rawRole } = await req.json().catch(() => ({}));
  // Which seat was on the call decides the whole rubric — the desk must never
  // quote a price, acquisitions has to. See docs/CALL-FINDINGS.md §1.
  const role: CallRole = rawRole === "acquisition" ? "acquisition" : "intake";
  const text = String(transcript || "").trim();
  if (text.length < 80)
    return NextResponse.json(
      { error: "Paste a longer transcript — there isn't enough here to grade." },
      { status: 400 }
    );
  if (text.length > 120_000)
    return NextResponse.json({ error: "That transcript is too long to grade in one pass." }, { status: 400 });

  let result;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    result = await ai.models.generateContent({
      model: process.env.SCORING_MODEL || SCORING_MODEL,
      contents: salesStandardPrompt(
        text,
        typeof context === "string" ? context.slice(0, 500) : undefined,
        role
      ),
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Scoring model error: ${e?.message || e}` }, { status: 502 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse((result.text ?? "").replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "The grader returned unreadable output — try again." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, report: buildStandardReport(parsed, role) });
}
