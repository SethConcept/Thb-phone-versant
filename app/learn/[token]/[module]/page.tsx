import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SELLER_BRAND } from "@/lib/academy";
import { LEARN_MODULES, getModule } from "@/lib/modules";
import { quizForClient } from "@/lib/quizzes";
import { DISPO_MODULES, getDispoModule, dispoQuizForClient, DISPO_BRAND } from "@/lib/dispo";
import { pathState } from "@/lib/progress";
import { isAdminPreview } from "@/lib/admin-preview";
import Quiz from "./quiz";
import AdminUnlock from "./admin-unlock";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ token: string; module: string }>;
}) {
  const { token, module: moduleId } = await params;

  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, full_name, mode, skip_modules")
    .eq("interview_token", token)
    .single();

  const isDispo = trainee?.mode === "dispo";
  // Each mode has its own track: Versant (m1..m8) or dispositions (d1..d7).
  const modules = isDispo ? DISPO_MODULES : LEARN_MODULES;
  const mod = isDispo ? getDispoModule(moduleId) : getModule(moduleId);
  const brand = isDispo ? DISPO_BRAND : SELLER_BRAND;
  const subtitle = isDispo ? "The Desk · Dispositions" : "Phone Academy";

  if (!trainee || !["training", "dispo"].includes(trainee.mode) || !mod)
    return (
      <div className="candidate-bg">
        <main className="card candidate-card fade-in">
          <h1>Page not found</h1>
          <p>Please check the link you received, or contact {SELLER_BRAND}.</p>
        </main>
      </div>
    );

  const { data: rows } = await db
    .from("module_progress")
    .select("module_id, quiz_score, quiz_total, quiz_passed, drill_passed")
    .eq("candidate_id", trainee.id);

  const state = pathState(rows ?? [], modules);
  const preview = await isAdminPreview();
  const unlockAll = preview || trainee.skip_modules;
  const canView = unlockAll || state.unlocked(moduleId);
  const row = state.byModule[moduleId];
  const quizPassed = !!row?.quiz_passed;
  const isLast = mod.id === modules[modules.length - 1].id;
  const nextModule = modules[mod.num] ?? null; // num is 1-based → next index

  const doneCount = modules.filter((m) => state.moduleComplete(m.id)).length;

  return (
    <div className="learn-shell">
      <aside className="learn-rail">
        <div className="learn-brand">
          {brand}
          <small>{subtitle} · {trainee.full_name}</small>
        </div>
        <div className="learn-progressbar" aria-hidden>
          <i style={{ width: `${Math.round((doneCount / modules.length) * 100)}%` }} />
        </div>
        <p className="small muted" style={{ margin: "4px 14px 10px" }}>
          {doneCount} of {modules.length} modules complete
        </p>
        <nav>
          {modules.map((m) => {
            const open = unlockAll || state.unlocked(m.id);
            const complete = state.moduleComplete(m.id);
            const cls = `learn-navitem ${m.id === moduleId ? "on" : ""} ${!open ? "locked" : ""}`;
            const label = (
              <>
                <span className="learn-navnum">{complete ? "✓" : m.num}</span>
                <span>{m.title}</span>
              </>
            );
            return open ? (
              <Link key={m.id} href={`/learn/${token}/${m.id}`} className={cls}>
                {label}
              </Link>
            ) : (
              <span key={m.id} className={cls} title="Finish the previous module to unlock">
                {label} <span className="learn-lock">🔒</span>
              </span>
            );
          })}
          {!isDispo && (
            <div className="learn-navitem learn-navtest">
              <Link href={`/learn/${token}/drills`} className="learn-testlink">
                🎙 Drill room <span className="small muted">(optional)</span>
              </Link>
            </div>
          )}
          <div className={`learn-navitem learn-navtest ${state.allComplete || unlockAll ? "" : "locked"}`} style={isDispo ? undefined : { borderTop: "none", marginTop: 0, paddingTop: 0 }}>
            {state.allComplete || unlockAll ? (
              <Link href={`/interview/${token}`} className="learn-testlink">
                🏁 Certification calls — unlocked
              </Link>
            ) : (
              <span>🏁 Certification calls <span className="learn-lock">🔒</span></span>
            )}
          </div>
        </nav>
        <AdminUnlock unlocked={unlockAll} />
      </aside>

      <main className="learn-main fade-in">
        {!canView ? (
          <div className="card" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 22 }}>🔒 Not yet</h1>
            <p>Finish the previous module — content and quiz — to unlock this one.</p>
            <Link className="btn btn-secondary" href={`/learn/${token}`}>Go to my current module</Link>
          </div>
        ) : (
          <>
            <div className="learn-modhead">
              <div className="learn-kicker">Module {mod.num} of {modules.length} · {mod.kicker}</div>
              <h1>{mod.title}</h1>
              <p className="learn-lede">{mod.lede}</p>
            </div>

            <div className="ac-content" dangerouslySetInnerHTML={{ __html: mod.html }} />

            <section className="card learn-gate" id="quiz">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ fontSize: 17, margin: 0 }}>📝 Module quiz</h2>
                {quizPassed && <span className="pill pill-green">✓ passed{row?.quiz_score != null ? ` · best ${row.quiz_score}/${row.quiz_total}` : ""}</span>}
              </div>
              <p className="small muted" style={{ marginTop: 6 }}>
                Four questions, pass at three. Retake as many times as you like — your best score counts.
              </p>
              <Quiz token={token} moduleId={moduleId} questions={isDispo ? dispoQuizForClient(moduleId) : quizForClient(moduleId)} />
            </section>

            <div className="row" style={{ marginTop: 20, justifyContent: "space-between" }}>
              <span className="small muted">
                {state.moduleComplete(moduleId)
                  ? isLast
                    ? "Module complete — certification calls are unlocked in the sidebar."
                    : "Module complete."
                  : "To finish this module: pass the quiz."}
              </span>
              {!isLast && nextModule && state.moduleComplete(moduleId) && (
                <Link className="btn" href={`/learn/${token}/${nextModule.id}`}>
                  Next: {nextModule.title} →
                </Link>
              )}
              {isLast && state.allComplete && (
                <Link className="btn" href={`/interview/${token}`}>
                  🏁 Take a certification call
                </Link>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
