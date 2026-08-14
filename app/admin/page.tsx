import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

async function addTrainee(formData: FormData) {
  "use server";
  const supabase = await supabaseServer();
  const mode = formData.get("mode") === "sales" ? "sales" : "training";
  const { error } = await supabase.from("candidates").insert({
    full_name: String(formData.get("full_name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    role_applied: mode === "training" ? "Versant certification" : "Sales practice",
    mode,
    difficulty: mode === "sales" && formData.get("difficulty") === "hard" ? "hard" : "easy",
    // training links never expire — certification takes repeated runs
    ...(mode === "training" ? { token_expires_at: null } : {}),
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
  if (modeFilter === "training" || modeFilter === "sales") query = query.eq("mode", modeFilter);
  const { data: trainees } = await query;

  const base = process.env.NEXT_PUBLIC_APP_URL || "";

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
          {tab("/admin?mode=sales", "📞 Sales practice", modeFilter === "sales")}
          <span className="pill pill-gray">{(trainees ?? []).length}</span>
          <a href="/academy.html" target="_blank" className="pill pill-blue" style={{ textDecoration: "none", padding: "6px 14px" }}>
            📖 Academy
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
          <select name="mode" className="input" style={{ width: "auto" }} defaultValue={modeFilter === "sales" ? "sales" : "training"}>
            <option value="training">🎧 Versant certification</option>
            <option value="sales">📞 Sales practice call</option>
          </select>
          <select name="difficulty" className="input" style={{ width: "auto" }} title="Difficulty (sales practice only)">
            <option value="easy">Easy John</option>
            <option value="hard">Hard John</option>
          </select>
          <button className="btn">Add + generate link</button>
        </form>
        <p className="small muted" style={{ margin: "8px 0 0" }}>
          Versant links never expire — trainees retake until they certify. Difficulty applies to sales practice only.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Test link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(trainees ?? []).map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.full_name}</td>
                <td>
                  <span className={`pill ${c.mode === "sales" ? "pill-blue" : "pill-gray"}`}>
                    {c.mode === "sales" ? `📞 ${c.difficulty === "hard" ? "hard" : "easy"} John` : "🎧 Versant"}
                  </span>
                </td>
                <td>
                  <span className={`pill ${STATUS_PILL[c.status] || "pill-gray"}`}>{c.status}</span>
                </td>
                <td style={{ maxWidth: 320 }}>
                  <code className="linkbox">{`${base}/interview/${c.interview_token}`}</code>
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
