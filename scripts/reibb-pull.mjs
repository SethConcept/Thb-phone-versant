#!/usr/bin/env node
/**
 * Pull real seller-call transcripts out of REI BlackBook.
 *
 *   node scripts/reibb-pull.mjs --cookies ./cookies.txt \
 *        --contacts 20248727,20405298 --out ./raw-calls
 *
 * REI BlackBook has no API key. The React front end talks to a set of
 * /profitdial endpoints with the ordinary session cookie, and that is what
 * this uses: log in through the browser, export the cookie jar, point this at
 * it. The session expires — when it does every call comes back as the login
 * page and the script says so rather than writing empty files.
 *
 * The three endpoints, in the order the UI itself calls them:
 *
 *   contacts/getContactById            contact_id=<id>
 *   contacts/getActivity/<id>/past     limit=<n>      ← "past", not "chat"
 *   calls/getCallDetails               callId, recordingId
 *
 * Two things cost an afternoon to find and are worth writing down:
 *   • the timeline segment is `past`. chat/calls/all/activity all return 200
 *     with a zero-byte body, which reads exactly like an auth failure.
 *   • `page` and `offset` are ignored on getActivity; `limit` is honoured.
 *
 * getCallDetails returns recordings_data[recordingId] carrying the S3 audio
 * link, AWS's speaker-labelled `transcription.dialogue`, and REI's own
 * summary and action items.
 *
 * Output is RAW and contains real names, phone numbers and addresses. It does
 * not go in git. Run scripts/redact-calls.mjs over it first.
 */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "https://my.reiblackbook.com";

// ---------------------------------------------------------------------------

function args() {
  const out = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const k = process.argv[i].replace(/^--/, "");
    out[k] = process.argv[i + 1];
  }
  return out;
}

const { cookies: cookieFile, contacts, out = "raw-calls", min = "60" } = args();
if (!cookieFile || !contacts) {
  console.error(
    "usage: node scripts/reibb-pull.mjs --cookies <jar> --contacts <id,id,…> [--out dir] [--min seconds]"
  );
  process.exit(1);
}

/** Netscape cookie jar (what curl and most browser extensions export). */
function cookieHeader(path) {
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split("\t"))
    .filter((f) => f.length >= 7)
    .map((f) => `${f[5]}=${f[6]}`)
    .join("; ");
}

const COOKIE = cookieHeader(cookieFile);
const MIN_SEC = Number(min);

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      Cookie: COOKIE,
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const text = await res.text();
  if (/<!DOCTYPE|<html/i.test(text))
    throw new Error(
      `${path} returned an HTML page — the session has expired. Log in again and re-export the cookie jar.`
    );
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path} returned unparseable output: ${text.slice(0, 200)}`);
  }
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ---------------------------------------------------------------------------

mkdirSync(out, { recursive: true });
let written = 0;

for (const id of contacts.split(",").map((s) => s.trim()).filter(Boolean)) {
  const c = (await post("/profitdial/contacts/getContactById", `contact_id=${id}`)) ?? {};
  const contact = c.contact ?? c;
  const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || `contact ${id}`;
  console.log(`\n=== ${name} (${id})`);

  const act = await post(`/profitdial/contacts/getActivity/${id}/past`, "limit=200");
  const rows = act?.activity ?? [];
  if (!rows.length) console.log("  (no past activity)");

  for (const row of rows) {
    if (row.type !== "call" || !row.recordings) continue;
    const recId = String(row.recordings).split(":")[0];

    const detail = await post(
      "/profitdial/calls/getCallDetails",
      `callId=${row.id}&recordingId=${recId}`
    );
    const call = detail?.call;
    if (!call) continue;

    const dur = Number(call.duration) || 0;
    const rec = call.recordings_data?.[recId] ?? {};
    const dialogue = rec.transcription?.dialogue ?? [];

    const keep = dialogue.length > 0 && dur >= MIN_SEC;
    console.log(
      `  ${keep ? "OK " : "   "}${call.created_at}  ${String(call.direction).padEnd(17)} ` +
        `${mmss(dur).padStart(6)}  turns=${dialogue.length}`
    );
    if (!keep) continue;

    const text = (v) =>
      typeof v?.text === "string"
        ? v.text
        : Array.isArray(v)
          ? v.map((x) => (typeof x?.text === "string" ? x.text : String(x))).join("\n")
          : "";

    const slug = name.toLowerCase().replace(/\W+/g, "_").replace(/^_|_$/g, "");
    const stem = `${slug}_${call.created_at.slice(0, 10)}_${row.id}`;
    writeFileSync(
      join(out, `${stem}.json`),
      JSON.stringify(
        {
          contact_id: id,
          contact_name: name,
          phone: call.from_number,
          line: call.to_number,
          campaign: call.nick_name ?? null,
          call_id: row.id,
          recording_id: recId,
          when: call.created_at,
          direction: call.direction,
          duration_sec: dur,
          audio: rec.link ?? null,
          summary: text(rec.summary),
          action_items: text(rec.action_items),
          dialogue,
        },
        null,
        1
      )
    );
    written++;
  }
}

console.log(`\n${written} transcripts → ${out}`);
console.log("RAW — contains real seller PII. Run scripts/redact-calls.mjs before committing.");
