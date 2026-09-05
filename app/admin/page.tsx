import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { buildCallReport, aggregateBars } from "@/lib/call-report";
import { WeakSpots } from "@/components/trend";

async function addTrainee(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const rawMode = String(formData.get("mode") || "");
  const mode = ["sales", "dispo"].includes(rawMode) ? rawMode : "training";
  const { error } = await supabase.from("candidates").insert({
    full_name: String(formData.get("full_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    role_applied:
      mode === "training"
        ? "Versant certification"
        : mode === "dispo"
          ? "Dispositions certification"
          : "Sales practice",
    mode,
    difficulty: mode === "sales" && formData.get("difficulty") === "hard" ? "hard" : "easy",
    // training/dispo links never expire — certification takes repeated runs
    ...(mode !== "sales" ? { token_expires_at: null } : {}),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

const STATUS_PILL: Record<string, string> = {
  invited: "pill-blue",
  interviewed: "pill-amber",
  scored: "pill-amber",
  certified: "pill-green",
  passed: "pill-green",
  failed: "pill-red",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { mode: modeFilter } = await searchParams;
  let query = supabase.from("candidates").select("*").order("created_at", { ascending: false });
  if (modeFilter && ["training", "sales", "dispo"].includes(modeFilter))
    query = query.eq("mode", modeFilter);
  const { data: trainees } = await query;

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

  // Team roll-up: where the whole desk is weakest, across every graded
  // certification call. A category everyone misses is a training-content
  // problem, not five separate people problems.
  const { data: allAttempts } = await supabase
    .from("interviews")
    .select("exam_meta, scores(*)")
    .not("exam_meta", "is", null)
    .order("started_at", { ascending: false })
    .limit(400);
  const teamReports = (allAttempts ?? [])
    .filter((iv: any) => (iv.exam_meta as any)?.kind !== "drill" && (iv.scores ?? []).length > 0)
    .map((iv: any) => {
      const latest = [...iv.scores].sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[iv.scores.length - 1];
      return buildCallReport(latest, iv.exam_meta, "admin");
    });
  const teamWeak = aggregateBars(teamReports);

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className={`pill ${active ? "pill-green" : "pill-gray"}`}
      style={{ textDecoration: "none", padding: "6px 14px" }}
    >
      {label}
    </Link>
  );

  return (
    <main className="fade-in">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Trainees</h1>
        <div className="row">
          {tab("/admin", "All", !modeFilter)}
          {tab("/admin?mode=training", "🎧 Versant", modeFilter === "training")}
          {tab("/admin?mode=dispo", "🏷 Dispo", modeFilter === "dispo")}
          {tab("/admin?mode=sales", "📞 Sales practice", modeFilter === "sales")}
          <span className="pill pill-gray">{(trainees ?? []).length}</span>
          <Link href="/admin/grade" className="pill pill-green" style={{ textDecoration: "none", padding: "6px 14px" }}>
            🎧 Grade a real call
          </Link>
          <Link href="/admin/calls" className="pill pill-green" style={{ textDecoration: "none", padding: "6px 14px" }}>
            🗂 Call library
          </Link>
          <a href="/academy.html" target="_blank" className="pill pill-blue" style={{ textDecoration: "none", padding: "6px 14px" }}>
            📖 Academy
          </a>
          <a href="/dispo.html" target="_blank" className="pill pill-blue" style={{ textDecoration: "none", padding: "6px 14px" }}>
            📖 Dispo course
          </a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 14, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>
          Add trainee
        </h2>
        <form action={addTrainee} className="row">
          <input name="full_name" placeholder="Full name" required className="input" style={{ flex: 2, minWidth: 160 }} />
          <input name="email" placeholder="Email (optional)" className="input" style={{ flex: 2, minWidth: 160 }} />
          <input name="phone" placeholder="Phone (optional)" className="input" style={{ flex: 1, minWidth: 120 }} />
          <select name="mode" className="input" style={{ width: "auto" }} defaultValue={["sales", "dispo"].includes(modeFilter ?? "") ? modeFilter : "training"}>
            <option value="training">🎧 Versant certification</option>
            <option value="dispo">🏷 Dispositions certification</option>
            <option value="sales">📞 Sales practice call</option>
          </select>
          <select name="difficulty" className="input" style={{ width: "auto" }} title="Difficulty (sales practice only)">
            <option value="easy">Easy John</option>
            <option value="hard">Hard John</option>
          </select>
          <button className="btn">Add + generate link</button>
        </form>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Versant and dispo links never expire — trainees retake until they certify. Difficulty applies to sales practice only.
        </p>
      </div>

      {teamWeak.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 15, margin: 0 }}>Where the team is weakest</h2>
            <span className="pill pill-gray">{teamReports.length} graded calls</span>
          </div>
          <p className="small muted" style={{ margin: "4px 0 10px" }}>
            Worst first, across everyone. A category the whole desk misses is a training problem, not five
            people problems.
          </p>
          <WeakSpots rows={teamWeak} />
        </section>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Trainee link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(trainees ?? []).map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                <td>
                  <span className={`pill ${c.mode === "sales" ? "pill-blue" : "pill-gray"}`}>
                    {c.mode === "sales"
                      ? `📞 ${c.difficulty === "hard" ? "hard" : "easy"} John`
                      : c.mode === "dispo"
                        ? "🏷 Dispo"
                        : "🎧 Versant"}
                  </span>
                </td>
                <td>
                  <span className={`pill ${STATUS_PILL[c.status] || "pill-gray"}`}>{c.status}</span>
                </td>
                <td style={{ maxWidth: 320 }}>
                  <code className="linkbox">
                    {c.mode === "sales"
                      ? `${base}/interview/${c.interview_token}`
                      : `${base}/learn/${c.interview_token}`}
                  </code>
                </td>
                <td>
                  <Link href={`/admin/candidates/${c.id}`}>Open →</Link>
                </td>
              </tr>
            ))}
            {(trainees ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">No trainees yet — add one above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
