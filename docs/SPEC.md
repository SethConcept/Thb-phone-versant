# Versant Phone Academy — Spec

**What this is:** the Phone Academy courseware turned into an AI-run
certification. The old self-graded drill room (trainee checks their own
boxes) is replaced by a Versant-style spoken test: an AI examiner
administers it, an AI grader scores it against the Academy rubric, and the
trainee can't grade themselves. This repo is sales-training only; it was
split out of THB-HR-VOICE (whose `main` remains the HR voice screener),
and the HR/hiring code was removed in the split.

**Who it's for:** the Iriga seller-line team (Thea, Trining, Cherry) and any
future seller-line hire. Cherry/Juan review results in admin.

## The learning path (trainee home: /learn/&lt;token&gt;)

Eight gated modules (content ported from the courseware), each finished by
a 4-question server-graded quiz (pass at 3, retakeable) and — for m2–m8 —
a 2-4 minute voice mini-drill matched to the module's skill:

| Module | Drill |
|--------|-------|
| m1 Start here | quiz only |
| m2 How every call opens | The Open — two incoming calls, deliver the full open |
| m3 Never say this | Pressure lines — 3 of 9 banned-response baits |
| m4 S·P·C·T·A | Seller questions — 3 approved-shape answers |
| m5 The ten call models | Common calls — 3 of 6 (just-looking, investors, realtor, needs-work, email-offer, Juan-only) |
| m6 Hard situations | 3 of 6 (probate, tenants, attorney, speed, lien, fees) |
| m7 Being a person | Empathy persona — grieving / very quiet / elderly |
| m8 The gate and the log | Endings — handoff, not-selling, callback, mailer |

Drills auto-grade on completion (`/api/interviews/complete`): hard fail =
FAIL always; items drills allow one miss; the open requires disclosure +
name + source question + delivery ≥ 3; empathy requires all its criteria.
Passing flips `module_progress.drill_passed`; quiz + drill complete a
module; completing m8 unlocks the certification calls. Admin can bypass
the gate per trainee (`candidates.skip_modules`) or site-wide with the
ADMIN_UNLOCK_CODE preview cookie.

## The certification call (one realistic inbound call, ~5 min)

No examiner, no sections. The line rings; the trainee answers with the
mandatory open; the AI plays a seller dealt from the 24-persona deck. The
draw also embeds 2 pressure lines (pool of 9) + 2 seller questions (pool
of 9) that the persona weaves into the conversation naturally — the
trainee never sees them labeled. The call runs to a real ending (handoff,
two named times, polite close, or the seller walks). Auto-graded on
completion; each pass counts toward the gate.

Every attempt stores its draw (`interviews.exam_meta`, kind `cert`) so the
grader scores exactly what was dealt, and every call is different.

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
