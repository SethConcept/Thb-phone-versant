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

## The test (one continuous voice session, ~10 min)

| Part | Format | Drawn from | Tests |
|------|--------|-----------|-------|
| A | Answer an incoming call | fixed | The mandatory open: real first name, recording disclosure (CA law — automatic fail if missed), how-did-you-hear question |
| B | 3 seller pressure lines | pool of 9 | The banned-line reflexes: no price/range/comp, no Zillow stats, no on-the-spot promise, office-not-location, mailer hard stop, truthful fees, no manufactured urgency, no lien promises, two named times |
| C | 3 seller questions | pool of 7 | Approved answer shapes: scam challenge, closing speed, offer calculation, spouse, attorney, fairness, Juan-only callers |
| D | Full call, open → next step | 1 of 24 personas | The whole job: S·P·C·T·A, motivation, empathy (grief/quiet/elderly), escalation, the 10 Academy drill criteria |

Every attempt stores its draw (`interviews.exam_meta`) so the grader scores
exactly what was administered, and every retake is a different test.

## Grading (deterministic where it matters)

- The AI grader returns structured JSON (`scores.detail`); the **code**
  computes the verdict:
  - Any of the 7 hard fails → FAIL, offending quote stored.
  - No recording disclosure in Part A → FAIL.
  - Part D < 8/10 criteria → FAIL.
  - More than 1 miss across B+C → FAIL.
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
