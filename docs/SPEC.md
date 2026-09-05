# Versant Phone Academy — Spec

**What this is:** the Phone Academy courseware turned into an AI-run
certification. The old self-graded drill room (trainee checks their own
boxes) is replaced by a Versant-style spoken test: an AI examiner
administers it, an AI grader scores it against the Academy rubric, and the
trainee can't grade themselves. This repo is sales-training only; it was
split out of THB-HR-VOICE (whose `main` remains the HR voice screener),
and the HR/hiring code was removed in the split.

**Who it's for:** the Iriga seller-line team (Thea, Cherry) and any
future seller-line hire. Cherry/Juan review results in admin.

## The learning path (trainee home: /learn/&lt;token&gt;)

Eight gated modules (content ported from the courseware), each completed by
its 4-question server-graded quiz (pass at 3, instantly retakeable).
Quizzes alone gate progression; completing all eight unlocks the
certification calls. Admin can bypass the gate per trainee
(`candidates.skip_modules`) or site-wide with the ADMIN_UNLOCK_CODE
preview cookie.

## The drill room (optional, never graded)

Linked from the learning-path sidebar (`/learn/<token>/drills`), available
anytime. Two modes: **Quick drill** (1 question, ~3 min cap) and **Three in
a row** (~6 min cap). Items draw from the combined course pool (9 pressure
lines + 9 seller questions + 5 call models + 2 endings = 25). The AI plays
each seller line in character, hears the answer, then switches to COACH
voice and gives 2-3 sentences of advice grounded in that item's pass/fail
rule — then the next item, or "DRILL COMPLETE". Runs are saved (transcript
+ audio) for admin review but never scored, never pass/fail, and never
count toward anything.

## The certification call (one realistic inbound call, ~5 min)

No examiner, no sections. The line rings; the trainee answers with the
mandatory open; the AI plays one of the 16 named situational sellers in
`CERT_SELLERS` (all inbound from TV), dealt WITHOUT replacement so the
first 16 calls cover the whole deck. Each seller carries an expected
outcome: book (13 sellers), kind_no (Terri — mobile home; buy box:
California only, no manufactured homes), or escalate (Jonathan — Menlo
Park estate; Juan's personal call, never the desk's). The draw also embeds
2 pressure lines + 2 seller questions (incl. the out-of-state Vegas condo
test) woven in naturally. The call runs to a real ending. Auto-graded on
completion; each pass counts toward the gate. The wider 24-persona deck
remains for module drills only.

Every attempt stores its draw (`interviews.exam_meta`, kind `cert`) so the
grader scores exactly what was dealt, and every call is different.

**Property registry:** every seller carries a structured property record
(address, city/state, type, beds/baths, price tier) that feeds both the
caller (speaks only from it, reveals one fact per question, John-style
vague opener + engagement meter) and the grader (ground truth). ALL TEN
are REAL active Redfin listings kept in the clearly-marked REAL_LISTINGS
swap block in `lib/academy.ts` — trainees look the address up mid-call on
every single call so verification becomes a habit; three of them change
the outcome (Terri's Vallejo park double-wide → kind no, Marcus's Dallas
TX house → kind no, Jonathan's ~$3M Menlo Park listing → escalate).
Refresh listings when they go stale (any equivalents work).

## Grading (deterministic where it matters)

- The AI grader returns structured JSON (`scores.detail`); the **code**
  computes the verdict:
  - Any of the 7 hard fails → FAIL, offending quote stored.
  - No recording disclosure, or never asked how-did-you-hear → FAIL.
  - Open delivery < 3/5 → FAIL.
  - More than 1 miss across the embedded lines → FAIL.
  - Call handling < 8/10 Academy criteria → FAIL.
  - Otherwise PASS.
- ESL/ASR fairness rules carried over from the hiring-era rubric: accent and
  transcription artifacts are not scoring factors.

## Certification gate (mirrors the Academy)

12 passed tests across ≥ 6 different seller personas → "ready to certify"
badge in admin; a human flips status to `certified`. Module reading and the
written exam live in the courseware (`/academy.html`).

## The dispositions track (mode `dispo`, added later)

A second, fully separate certification for the Equity Track dispo desk —
selling OUR CONTRACT to licensed agents/investors without ever acting like
an agent. Content lives in `lib/dispo.ts` (+ `lib/dispo-prompts.ts`);
courseware reading copy at `/dispo.html` (persona scripts stripped — they
stay server-only). Structure mirrors Versant:

- **Learning path** d1–d7 (culture, what a wholesale is, the fence, the
  script, objections, the record, the 8-hour day), 4-question quizzes,
  same `module_progress` table and admin bypasses. No drill room.
- **Certification call**: OUTBOUND. The trainee opens a Google-Voice-style
  dialer, places the call (real ringback), the agent answers "Hello?" and
  the trainee runs the Equity Track opener. Six agents
  (`DISPO_AGENTS`), dealt without replacement; dialing one by name =
  practice (`picked`, never gate-counted). `exam_meta` kind `dispo`.
- **Grading**: `dispoScoringPrompt` returns 12 rubric items (0–2) +
  boundary breaches with quotes; `dispoVerdict` is deterministic — any
  canonical breach = FAIL, else pass at ≥ 21/24 (85%). Grader output is
  filtered to canonical ids and deduped. `scores.detail.kind = "dispo"`
  discriminates the admin renderer; `completeness` stores the total.
- **Gate**: 5 passed calls, one of which must be Gary ("THE TRAP" —
  friendly pull-you-across-the-line agent). Admin shows calls-passed and
  trap-cleared pills.

## Real-call grading (the THB Sales Standard)

`lib/sales-standard.ts` is a SECOND rubric, for real recorded calls that
have no persona and no answer key. Weighted per the ops spec and split in
two on purpose: **call skill** (80 pts — rapport, motivation, qualification,
price, objections, next step) is everything a recording can prove;
**process compliance** (20 pts — response time, CRM routing, whether the
follow-up happened) is RESERVED and not scored from audio, because it isn't
in the audio. Weights are provisional until real game film replaces them.

`/admin/grade` scores any pasted transcript against it — no telephony
needed. `/api/grade-transcript` is the same path a real-call monitoring
pipeline would use.

## Progress tracking

`components/trend.tsx` draws score-over-time (inline SVG), a
last-5-vs-previous-5 delta, and weak-spot bars. Shown per trainee in admin,
on the trainee's own results page, and rolled up across the whole team on
`/admin`. Computed from existing score rows — no schema change.
`lib/practice-map.ts` turns a report's recommendations into "practice this"
links to the callers who drill that weakness.

## Code map (repo root)

- `lib/academy.ts` — ALL content: open, 9 pressure lines, 7 short answers,
  24 personas, 10 criteria, 7 hard fails, exam draw helpers. Single source
  of truth; keep in sync with `public/academy.html` if rules change.
- `lib/versant-prompts.ts` — examiner system prompt (Live) + grading prompt
  + `versantVerdict()` (deterministic verdict).
- `lib/sales-prompts.ts` — the "John" practice call (kept from before).
- `lib/models.ts` — Gemini model names (env-overridable).
- `app/api/interviews/start` — draws the exam, stores `exam_meta`, mints
  ephemeral token. Training links: no expiry, unlimited attempts.
- `app/api/score` — grades either mode; training verdicts are deterministic.
- `app/interview/[token]` — trainee UX; training mode is closed-book with a
  live Part A–D tracker (client watches for "Part X." announcements).
- `app/admin` — trainee list + per-trainee gate progress and full score
  breakdowns (hard-fail quotes included).
- `supabase/setup.sql` — the entire database schema, one run.

## Removed in the split from THB-HR-VOICE

Hiring/HR screening: the interviewer/scoring prompts, the batch score
route, hiring UI branches, the old HR spec docs, "Equity Track" branding.
