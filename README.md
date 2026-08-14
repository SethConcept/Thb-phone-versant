# THB Phone Academy — Versant Training

AI voice training and certification for the Twin Home Buyer seller line
(Iriga desk). A gated learning path that ends in a Versant-style
certification test, plus a sales practice mode and the courseware:

1. **📚 Learning path** (`/learn/<token>` — the trainee's home): sidebar of
   8 modules ported from the Phone Academy. Each module = content → a
   **4-question quiz** (pass at 3, graded server-side, instantly
   retakeable) → a **voice mini-drill** matched to that module's skill
   (the open, pressure lines, seller questions, common calls, hard
   situations, empathy personas, endings). Drills are auto-graded the
   moment they end — hard fails always fail. Quiz + drill unlock the next
   module; finishing all 8 unlocks the certification test. Two admin
   bypasses for dry runs: the per-trainee "skip module gate" checkbox in
   admin, and the global `ADMIN_UNLOCK_CODE` (env var) — type it once
   under "Admin" at the bottom of any learning-path sidebar and that
   device gets a 30-day preview cookie unlocking everything on every
   trainee link, without touching trainee records.

2. **🎧 Versant certification test** — a four-part spoken test administered
   and graded by AI, modeled on the Versant format but scored on THB call
   rules instead of English fluency:
   - **Part A** — answer an incoming call with the mandatory open (name,
     recording disclosure, how-did-you-hear).
   - **Part B** — three randomly drawn seller *pressure lines* engineered to
     bait a banned response (price fishing, Zillow, mailer amounts…).
   - **Part C** — three randomly drawn common seller questions (fees, speed,
     how offers work…).
   - **Part D** — a full call against one of 24 seller personas, open to
     agreed next step.

   Grading is deterministic where it matters: any of the 7 **hard fails**
   (quoting a price, promising an on-the-spot offer, stating own location,
   discussing a mailer amount, inventing stats, manufacturing urgency,
   "the offer is your check") = automatic FAIL with the offending line
   quoted back. Missing the recording disclosure = automatic FAIL. Otherwise
   Part D needs 8/10 Academy criteria and at most one miss across B+C.

   **Certification gate** (tracked per trainee in admin): 12 passed tests
   across at least 6 different seller personas.

3. **📞 Sales practice call** — the AI plays "John", a homeowner lead; the
   trainee runs the outbound follow-up script. Easy/hard difficulty,
   engagement-meter behavior, AI-scored (max 3 attempts per link).

4. **📖 Phone Academy courseware** — the full study course (8 modules,
   banned lines, S·P·C·T·A, desk card, self-study drills and written exam)
   served at `/academy.html`.

**Stack:** Next.js · Gemini Live API · Supabase · Vercel.

## Setup

This repo runs on its own dedicated Supabase and Vercel projects — fully
separate from the THB HR voice-screen stack. Nothing here touches it.

1. **Supabase** — in the dedicated project (Asia-Pacific region — the
   trainees are the heavy users):
   - SQL Editor → run `supabase/setup.sql` (one file, everything).
   - Storage → New bucket → name `interview-audio` → **uncheck Public**.
   - Authentication → Users → Add admin users (email+password).
     Disable public signups (Auth → Providers → Email → turn off signup).
2. **Google AI Studio** (aistudio.google.com): create an API key in its own
   AI Studio project so the free-tier quota isn't shared with the HR
   screener's key.
3. **Local:**
   ```bash
   cp .env.example .env.local   # fill in values from the new projects
   npm install
   npm run dev
   ```
4. **Vercel** — Add New → Project → import **this** repo (root directory is
   the repo root; production branch is `main` — both defaults) → add the
   env vars from the dedicated Supabase project (set `NEXT_PUBLIC_APP_URL`
   to the deployed URL) → in Settings → Functions, set the region to
   Singapore (`sin1`) so the servers sit next to the database → redeploy.

## Flow

Admin adds a trainee at `/admin` (Versant or sales practice) → copies the
generated link (training links go to `/learn/<token>`) → trainee works
through the module path: read → quiz → voice drill (consent logged, CA
two-party; drills auto-graded) → all 8 done unlocks `/interview/<token>`,
the full certification test → admin clicks **Score with AI** on tests →
structured verdict → module progress and the certification gate show on
the trainee's admin page.

Versant links never expire and have no attempt cap; each drill and test
draws fresh random material. Sales practice links allow 3 attempts.

## Security notes

- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only. The
  browser gets a single-use **ephemeral token** (15-min expiry) per session.
- RLS is on; anonymous users can touch nothing directly.

## Verify during dry run

- [ ] Live session connects with ephemeral token (`v1alpha` API)
- [ ] Quiz grades, stores best score, and unlocks the drill on pass
- [ ] Drill auto-grades on completion and flips the module gate
- [ ] Locked modules/test actually block (and `skip_modules` bypasses)
- [ ] Examiner announces "Part A…D" and the screen tracker follows
- [ ] "TEST/CALL/DRILL COMPLETE" markers auto-end the session
- [ ] Audio .webm uploads and plays back in admin
- [ ] Scoring returns valid JSON; hard fails quote the trainee's words
- [ ] A run with a deliberate price quote comes back FAIL
- [ ] Model name still current (`lib/models.ts` — Live model names rotate)
