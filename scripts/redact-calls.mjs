#!/usr/bin/env node
/**
 * Scrub real REI BlackBook call transcripts down to something safe to commit.
 *
 *   node scripts/redact-calls.mjs <raw-dir> [out-dir]
 *
 * These are real homeowners in real distress. What goes in the repo keeps the
 * SHAPE of the call — the situation, the questions, who said what — and loses
 * everything that points at a person: names, phone numbers, emails, street
 * addresses, spelled-out letters. City and state stay, because the buy box is
 * geographic and a call about Petaluma has to stay a call about Petaluma.
 *
 * Redaction is regex-driven and therefore fallible. It ends by scanning its
 * own output and printing anything that still smells like a person, so a human
 * reviews the leftovers instead of trusting the pass. Never commit output that
 * still has open flags.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const RAW = process.argv[2];
const OUT = process.argv[3] ?? "data/real-calls";
if (!RAW) {
  console.error("usage: node scripts/redact-calls.mjs <raw-dir> [out-dir]");
  process.exit(1);
}

// Staff and company names stay — these calls exist to coach the people on them,
// and the app already shows rep names everywhere. ASR mangles all of them.
const STAFF = [
  "thea", "tia", "dea", "dia", "tea", "lea", "thia",
  "sherry", "cherry", "sheri", "sherrie",
  "juan", "diaz", "mary",
];
const COMPANY = /\b(twin\s*home\s*buy(?:er|ers)?|home\s*buy(?:er|ers)?|homebuyer)\b/gi;

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const STREET_TYPE =
  "street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|court|ct|circle|cir|" +
  "parkway|pkwy|boulevard|blvd|place|pl|terrace|ter|trail|highway|hwy|" +
  "route|loop|alley|walk|row|square|sq";

const STREET_TYPE_CAP = STREET_TYPE.split("|")
  .map((w) => w[0].toUpperCase() + w.slice(1))
  .join("|");

const RULES = [
  // e-mail, written or spoken ("marks d as in dog at aol dot com"). ASR
  // shatters dictated addresses, so anything after "email is" goes too.
  [/\b(?:e-?mail(?:\s+address)?)\s+(?:is|would be|it'?s)[\s:]*[\s\S]{0,90}?(?:com|net|org)\b\.?/gi, "email is [EMAIL]"],
  [/\b[\w.+-]+@[\w-]*[\w.\s]{0,40}?\.(?:com|net|org)\b/gi, "[EMAIL]"],
  [/\b[\w.+-]+@\S*/gi, "[EMAIL]"],
  [/\b[\w .]{2,40}\bat\s+(?:aol|gmail|yahoo|hotmail|outlook|icloud|comcast|sbcglobal|att|me)\s*(?:\.|dot\s+)\s*(?:com|net|org)\b/gi, "[EMAIL]"],

  // phone numbers, including the way people read them aloud
  [/\b\+?1?[\s.\-(]*\d{3}[\s.\-)]*\d{3}[\s.\-]*\d{4}\b/g, "[PHONE]"],
  [/\b\d{3}[\s.\-]+\d{7}\b/g, "[PHONE]"],
  [/\b\d{7,}\b/g, "[PHONE]"],

  // street address: number + name + street type
  [new RegExp(`\\b\\d{1,6}\\.?\\s+(?:[A-Za-z0-9'./]+\\s+){0,3}(?:${STREET_TYPE})\\b\\.?`, "gi"), "[ADDRESS]"],
  // rural style: "Avenue 18 3/4", "Road 26"
  [new RegExp(`\\b(?:${STREET_TYPE})\\s+\\d{1,4}(?:\\s+\\d/\\d)?\\b`, "gi"), "[ADDRESS]"],
  // Bare named street, no number: "Sunrise Parkway". Case-sensitive on the
  // name so "a long road" and "a drive by" survive, hence the capitalised
  // alternation rather than the /i flag.
  [new RegExp(`\\b[A-Z][A-Za-z']{2,}\\s+(?:${STREET_TYPE_CAP})\\b\\.?`, "g"), "[ADDRESS]"],
  // ZIP, and "unit/apt/#"
  [/\b9[0-6]\d{3}(?:-\d{4})?\b/g, "[ZIP]"],
  [/\b(?:apt|apartment|unit|suite|ste)\.?\s*#?\s*[\w-]{1,6}\b/gi, "[UNIT]"],

  // spelled-out surnames: "M A R K S", "B O R D E R", "D as in dog"
  [/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, "[SPELLED]"],
  [/\b[A-Za-z]\s+as\s+in\s+\w+\b/gi, "[SPELLED]"],

  // APN / parcel / case / account numbers
  [/\b(?:apn|parcel|case|account|file|escrow|loan)\s*(?:number|no\.?|#)?\s*[:#]?\s*[\w-]{4,}\b/gi, "[REF]"],
];

// Places stay. The buy box is geographic — a call about Petaluma has to
// remain a call about Petaluma or the corpus stops teaching anything.
const PLACES = new Set(
  `california ca oakland berkeley petaluma vallejo napa sonoma solano richmond
   alameda contra costa marin san francisco jose mateo cruz benito joaquin
   stockton modesto madera fresno sacramento santa rosa hayward fremont
   concord antioch pittsburg vacaville fairfield benicia martinez pinole
   pleasanton livermore dublin danville lafayette orinda albany emeryville
   piedmont alamo moraga rodeo hercules crockett bay area pacific nevada
   arizona texas oregon washington ohio florida nevada york jersey states
   america americas united`.split(/\s+/)
);

const CALENDAR = new Set(
  `monday tuesday wednesday thursday friday saturday sunday january february
   march april may june july august september october november december
   monday's today tomorrow tonight`.split(/\s+/)
);

/**
 * Everything capitalised mid-sentence that is not a place, a weekday, staff or
 * the company is treated as a person's name and removed. Two guards keep that
 * from eating ordinary vocabulary: words that also appear lower-case elsewhere
 * in the corpus are prose, not names ("Property"/"property"), and words in
 * sentence-initial position are ignored as candidates — though once a token is
 * identified as a name anywhere, every occurrence of it goes.
 *
 * Erring toward over-redaction is deliberate. Losing a word costs nothing;
 * leaking a distressed homeowner's name costs a great deal.
 */
export function harvestNames(allText) {
  const lower = new Map();
  for (const m of allText.matchAll(/\b[a-z][a-z']{2,}\b/g))
    lower.set(m[0], (lower.get(m[0]) ?? 0) + 1);

  const names = new Set();
  // capitalised, and NOT the first word of a sentence
  // Lookbehind, not a consuming prefix: back-to-back capitalised words
  // ('Hello Gary') must both be offered as candidates.
  for (const m of allText.matchAll(/(?<=[^.!?\n]\s)\b[A-Z][a-z']{2,}\b/g)) {
    const w = m[0].toLowerCase();
    if (STAFF.includes(w) || PLACES.has(w) || CALENDAR.has(w)) continue;
    // ASR does occasionally lower-case a name, so one or two sightings prove
    // nothing; real vocabulary shows up far more often than that.
    if ((lower.get(w) ?? 0) >= 5) continue;
    if (["home", "buyer", "buyers", "twin", "homebuyer"].includes(w)) continue;
    names.add(w);
  }
  return names;
}

// Names harvested from the CRM record and from the transcript itself.
function nameSet(meta) {
  const found = new Set();
  const add = (s) =>
    String(s || "")
      .split(/[^A-Za-z]+/)
      .filter((w) => w.length > 2 && !STAFF.includes(w.toLowerCase()))
      .forEach((w) => found.add(w.toLowerCase()));

  add(meta.contact_name);
  add(meta.crm_first_name);

  // "my name is X", "this is X", "for X", "speak with X"
  const text = meta.dialogue.map((t) => t.text).join(" ");
  const introRe =
    /\b(?:my name is|name is|this is|i'?m|speak (?:with|to)|calling for|on behalf of|ask for)\s+([A-Z][a-z]{2,})(?:\s+([A-Z][a-z]{2,}))?/g;
  for (const m of text.matchAll(introRe)) {
    if (!STAFF.includes(m[1].toLowerCase())) found.add(m[1].toLowerCase());
    if (m[2] && !STAFF.includes(m[2].toLowerCase())) found.add(m[2].toLowerCase());
  }
  return found;
}

function redact(text, names) {
  let out = text;
  for (const [re, sub] of RULES) out = out.replace(re, sub);
  if (names.size) {
    const re = new RegExp(`\\b(${[...names].map(escape).join("|")})('s)?\\b`, "gi");
    out = out.replace(re, "[NAME]$2");
  }
  return out.replace(COMPANY, "Twin Home Buyer").replace(/\s{2,}/g, " ").trim();
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ASR splits turns mid-sentence, so "497 Amland" / "Drive." lands either side
// of a turn boundary and neither half looks like an address on its own. When a
// turn opens with a bare street type, scrub the number+name off the tail of
// the one before it.
const LEADING_STREET = new RegExp(`^\\s*(?:${STREET_TYPE})\\b\\.?`, "i");
const TRAILING_ADDR = new RegExp(`\\b\\d{1,6}\\.?\\s+(?:[A-Za-z0-9'./]+\\s*){0,3}$`);

function stitchAddresses(dialogue) {
  return dialogue.map((t, i) => {
    const prev = dialogue[i - 1];
    let text = t.text ?? "";
    if (prev && LEADING_STREET.test(text)) text = text.replace(LEADING_STREET, "[ADDRESS]");
    if (dialogue[i + 1] && LEADING_STREET.test(dialogue[i + 1].text ?? ""))
      text = text.replace(TRAILING_ADDR, "[ADDRESS] ");
    return { ...t, text };
  });
}

// ---------------------------------------------------------------------------
// Voicemail / dead-air detection — these are not calls, they are answering
// machines, and they would poison a benchmark of how reps handle people.
// ---------------------------------------------------------------------------

const VM = /(record your (?:name|message)|leave (?:your |a )?message|has been forwarded to voicemail|is not available at the tone|can'?t take your call|reached the voicemail|after the tone|press \d after)/i;

function isVoicemail(dialogue) {
  const head = dialogue.slice(0, 3).map((t) => t.text).join(" ");
  if (!VM.test(head)) return false;
  // a machine that was reached and then a real conversation started is fine
  const body = dialogue.map((t) => t.text).join(" ");
  return body.length < 900 || dialogue.length < 8;
}

// ---------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
const files = readdirSync(RAW).filter((f) => f.endsWith(".json") && f !== "index.json");

const kept = [];
const dropped = [];

// One pass over everything first: names are harvested corpus-wide, so a person
// named only in passing on one call is still scrubbed from the call where they
// introduced themselves.
const loaded = files.map((f) => ({
  f,
  meta: JSON.parse(readFileSync(join(RAW, f), "utf8")),
}));
const corpusNames = harvestNames(
  loaded.flatMap(({ meta }) => (meta.dialogue ?? []).map((t) => t.text ?? "")).join(" \n ")
);
console.log(`harvested ${corpusNames.size} candidate names corpus-wide`);

for (const { f, meta } of loaded) {
  const dialogue = stitchAddresses(meta.dialogue ?? []);

  if (isVoicemail(dialogue)) {
    dropped.push({ file: f, why: "voicemail" });
    continue;
  }
  if (dialogue.length < 6) {
    dropped.push({ file: f, why: `only ${dialogue.length} turns` });
    continue;
  }

  const names = new Set([...nameSet(meta), ...corpusNames]);
  const id = basename(f, ".json");

  kept.push({
    id,
    when: meta.when,
    direction: meta.direction,
    duration_sec: meta.duration_sec,
    campaign: meta.campaign ?? null,
    // Deliberately NOT carried over: contact_name, phone, line, audio link,
    // contact_id, call_id, recording_id. The corpus must not be a key back
    // into the CRM.
    turns: dialogue.map((t) => ({
      speaker: t.label ?? `Speaker ${t.speakerTag ?? "?"}`,
      text: redact(t.text ?? "", names),
    })),
    crm_summary: redact(meta.summary ?? "", names) || null,
  });
}

kept.sort((a, b) => a.when.localeCompare(b.when));
kept.forEach((c, i) => (c.id = `call-${String(i + 1).padStart(2, "0")}`));

writeFileSync(join(OUT, "corpus.json"), JSON.stringify(kept, null, 1) + "\n");

// Readable companion, for humans reviewing the redaction.
const md = kept
  .map(
    (c) =>
      `## ${c.id} — ${c.when} — ${c.direction} — ${Math.floor(c.duration_sec / 60)}:${String(
        c.duration_sec % 60
      ).padStart(2, "0")}\n` +
      (c.campaign ? `_campaign: ${c.campaign}_\n` : "") +
      "\n" +
      c.turns.map((t) => `**${t.speaker}:** ${t.text}`).join("\n\n")
  )
  .join("\n\n---\n\n");
writeFileSync(join(OUT, "corpus.md"), `# Real call corpus (redacted)\n\n${md}\n`);

// ---------------------------------------------------------------------------
// Leftover scan — what the regexes may have missed
// ---------------------------------------------------------------------------

const SUSPECT = [
  [/\b\d{3}[\s.-]?\d{4}\b/g, "7-digit run"],
  [/\b\d{5}\b/g, "5-digit run"],
  [/@/g, "at-sign"],
  [new RegExp(`\\b[A-Z][A-Za-z']{2,}\\s+(?:${STREET_TYPE_CAP})\\b`, "g"), "named street"],
  [new RegExp(`(?:^|\\.\\s+)(?:${STREET_TYPE_CAP})\\b`, "g"), "orphan street word"],
];

let flags = 0;
for (const c of kept) {
  for (const t of c.turns) {
    for (const [re, why] of SUSPECT) {
      for (const m of t.text.matchAll(re)) {
        flags++;
        console.log(`FLAG ${c.id} [${why}] …${t.text.slice(Math.max(0, m.index - 45), m.index + 45)}…`);
      }
    }
  }
}

console.log(`\nkept ${kept.length}, dropped ${dropped.length}`);
for (const d of dropped) console.log(`  drop ${d.file} (${d.why})`);
console.log(flags ? `\n${flags} FLAGS — review before committing.` : "\nno flags.");
