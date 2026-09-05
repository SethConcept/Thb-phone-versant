import Link from "next/link";
import { redirect } from "next/navigation";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { supabaseServer } from "@/lib/supabase/server";
import CallsClient, { type CorpusCall } from "./calls-client";

// The real-call library: the redacted corpus of actual Twin Home Buyer calls,
// readable in the app and gradeable against the same standard the practice
// calls use. This is the game film — what the desk really sounds like, next to
// what we train.
//
// The corpus is a committed file, not a database table: it is a fixed
// reference set that the whole rubric was calibrated against, and it should
// change only when someone deliberately refreshes it (scripts/reibb-pull.mjs
// → scripts/redact-calls.mjs). Read at request time rather than imported so a
// refreshed corpus doesn't need a rebuild.

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  let calls: CorpusCall[] = [];
  let loadError: string | null = null;
  try {
    const raw = await readFile(join(process.cwd(), "data/real-calls/corpus.json"), "utf8");
    calls = JSON.parse(raw);
  } catch {
    loadError =
      "data/real-calls/corpus.json isn't readable from here. Rebuild it with scripts/reibb-pull.mjs then scripts/redact-calls.mjs.";
  }

  const totalMin = Math.round(calls.reduce((a, c) => a + c.duration_sec, 0) / 60);
  const inbound = calls.filter((c) => c.direction === "inbound").length;

  return (
    <main className="fade-in">
      <Link href="/admin" className="small">← All trainees</Link>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Real call library</h1>
        <Link className="btn btn-secondary" href="/admin/grade">Grade a pasted transcript →</Link>
      </div>
      <p className="muted small" style={{ maxWidth: "72ch" }}>
        {calls.length} real calls ({inbound} inbound, {calls.length - inbound} outbound,{" "}
        {Math.floor(totalMin / 60)}h {totalMin % 60}m), pulled from REI BlackBook and scrubbed of names,
        numbers and addresses. This is the set the THB Sales Standard was calibrated against — pick any
        call, read it, and grade it against the seat that was actually on it.
      </p>

      <p className="notice notice-gray small">
        <strong>Redacted, but still real.</strong> These are real homeowners in real trouble.
        <code>[NAME]</code>, <code>[ADDRESS]</code>, <code>[PHONE]</code> and <code>[EMAIL]</code> mark what
        was removed. Don&apos;t paste them anywhere outside this tool.
      </p>

      {loadError ? (
        <div className="notice notice-amber small">{loadError}</div>
      ) : (
        <CallsClient calls={calls} />
      )}
    </main>
  );
}
