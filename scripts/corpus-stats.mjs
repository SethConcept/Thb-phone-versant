#!/usr/bin/env node
/**
 * Measure the real-call corpus. No API key, no model — just counting, so the
 * claims in docs/CALL-FINDINGS.md can be re-checked by anyone and re-run when
 * the corpus is refreshed.
 *
 *   node scripts/corpus-stats.mjs [data/real-calls/corpus.json]
 *
 * These are regex counts over ASR output, so treat them as close-enough, not
 * exact. Where a number here disagrees with the write-up, this is right and
 * the write-up needs updating.
 */
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "data/real-calls/corpus.json";
const calls = JSON.parse(readFileSync(file, "utf8"));

const first = (c, n = 2) => c.turns.slice(0, n).map((t) => t.text).join(" ");
const all = (c) => c.turns.map((t) => t.text).join(" ");

// Greeting rules only apply to calls the company ANSWERED — scoring an
// outbound follow-up for not saying "thank you for calling" is meaningless.
const INBOUND_ONLY = new Set([
  "branded open ('thank you for calling …')",
  "gave a first name in the open",
  "AI receptionist answered",
]);

const PATTERNS = {
  "branded open ('thank you for calling …')": (c) =>
    /thank you for calling/i.test(first(c, 3)),
  "gave a first name in the open": (c) =>
    /\bthis is\s+\w+|you'?re speaking with/i.test(first(c, 3)),
  "disclosed the call is recorded": (c) => /recorded|recording this/i.test(all(c)),
  "AI receptionist answered": (c) => /voice ai agent/i.test(first(c, 2)),
  "asked how they heard about us": (c) =>
    /how did you (hear|find|come across)|where did you (hear|find)|how'?d you (hear|find)/i.test(all(c)),
  "asked who is on title / who signs": (c) =>
    /on the title|on title|who'?s on the deed|power of attorney|\btrustee\b/i.test(all(c)),
  "a trust, estate or POA came up": (c) =>
    /\btrust\b|\bprobate\b|\bestate\b|power of attorney|\btrustee\b|passed away|deceased/i.test(all(c)),
  "more than one decision-maker": (c) =>
    /my (brother|sister|wife|husband|son|daughter)|siblings?\b|co-?trustee|both of (us|you)/i.test(all(c)),
  "a dollar figure was said": (c) => /\$\s?\d|\b\d{3},\d{3}\b|\b\d\.\d{1,3}\s?(m|million)\b/i.test(all(c)),
  "'as is' was discussed": (c) => /\bas[- ]is\b/i.test(all(c)),
  "a competing buyer came up": (c) =>
    /another (offer|buyer|investor|company)|other offers?|someone else (is|has)|buys? houses\b/i.test(all(c)),
  "escrow / title company discussed": (c) => /\bescrow\b|title company/i.test(all(c)),
  "a lien or payoff came up": (c) => /\blien\b|\bpayoff\b|back taxes/i.test(all(c)),
  "the line broke up or was repeated back": (c) =>
    /can you (hear|say|repeat)|you got cut off|say (that )?again|hear me now/i.test(all(c)),
};

const pct = (n, of) => `${Math.round((n / of) * 100)}%`.padStart(4);

const totalSec = calls.reduce((a, c) => a + c.duration_sec, 0);
const inbound = calls.filter((c) => c.direction === "inbound").length;

console.log(`\n${file}`);
console.log(`${calls.length} calls · ${(totalSec / 3600).toFixed(1)}h · ${inbound} inbound, ${calls.length - inbound} outbound`);
console.log(`median length ${(() => {
  const d = calls.map((c) => c.duration_sec).sort((a, b) => a - b);
  const m = d[Math.floor(d.length / 2)];
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
})()}\n`);

for (const [label, test] of Object.entries(PATTERNS)) {
  const scope = INBOUND_ONLY.has(label) ? calls.filter((c) => c.direction === "inbound") : calls;
  const hits = scope.filter(test);
  const tag = INBOUND_ONLY.has(label) ? " (inbound only)" : "";
  console.log(
    `${String(hits.length).padStart(3)} / ${String(scope.length).padStart(2)}  ${pct(hits.length, scope.length)}  ${label}${tag}`
  );
}

console.log("\nby campaign:");
const byCampaign = new Map();
for (const c of calls) byCampaign.set(c.campaign ?? "—", (byCampaign.get(c.campaign ?? "—") ?? 0) + 1);
for (const [k, v] of [...byCampaign].sort((a, b) => b[1] - a[1]))
  console.log(`${String(v).padStart(3)}  ${k}`);
