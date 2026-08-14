import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { pathState } from "@/lib/progress";

// Learning path home: send the trainee to their first incomplete module.
export default async function LearnHome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, mode")
    .eq("interview_token", token)
    .single();

  if (!trainee || trainee.mode !== "training")
    return (
      <div className="candidate-bg">
        <main className="card candidate-card fade-in">
          <h1>Link not found</h1>
          <p>Please check the link you received, or contact {SELLER_BRAND}.</p>
        </main>
      </div>
    );

  const { data: rows } = await db
    .from("module_progress")
    .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
    .eq("candidate_id", trainee.id);

  const state = pathState(rows ?? []);
  redirect(`/learn/${token}/${state.firstIncomplete ?? "m1"}`);
}
