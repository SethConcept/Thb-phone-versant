import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { DRILL_POOL, PRACTICE_MODES } from "@/lib/drills";

// The drill room — optional coached practice. No pass/fail, no gates,
// nothing counted: a coach fires seller lines from the whole course pool
// and gives spoken advice right after each answer.
export default async function DrillRoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, full_name, mode")
    .eq("interview_token", token)
    .single();

  if (!trainee || trainee.mode !== "training")
    return (
      <div className="candidate-bg">
        <main className="card candidate-card fade-in">
          <h1>Page not found</h1>
          <p>Please check the link you received, or contact {SELLER_BRAND}.</p>
        </main>
      </div>
    );

  return (
    <div className="candidate-bg">
      <main className="card candidate-card fade-in" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 24 }}>🎙 Drill room</h1>
        <p>
          Optional practice — <strong>no pass, no fail, nothing counted</strong>. The coach throws you real seller lines from anywhere in the course ({DRILL_POOL.length} in the pool), you answer like you&apos;re live, and you get spoken feedback right after each answer.
        </p>
        <div className="stack" style={{ marginTop: 16 }}>
          <Link className="btn btn-lg" href={`/interview/${token}?drill=one`}>
            ⚡ {PRACTICE_MODES.one.title} — 1 question
          </Link>
          <Link className="btn btn-secondary btn-lg" href={`/interview/${token}?drill=three`}>
            🔁 {PRACTICE_MODES.three.title} — 3 questions
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: 16 }}>
          Come here any time — before a quiz, after a failed certification call, or just to warm up before a shift.
        </p>
        <p style={{ marginTop: 8 }}>
          <Link href={`/learn/${token}`} className="small">← Back to my learning path</Link>
        </p>
      </main>
    </div>
  );
}
