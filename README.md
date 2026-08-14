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

2. **📞 The certification call** — ONE realistic inbound call, ~5 minutes,
   auto-graded the moment it ends. The line rings, the trainee answers with
   the mandatory open, and the AI plays one of **10 named situational
   sellers** (all "saw the TV commercial"): Dolores (grieving), Marcus
   (probate from Texas), Renee (divorce deadline), Dave (relocating), Gloria
   (behind on payments), Sam (tired landlord), Priya (embarrassed
   inheritor), Victor (Zillow anchor), Terri (mobile home — the correct
   outcome is a KIND, CLEAR NO per the buy box), and Jonathan (Menlo Park
   estate — the correct outcome is CAPTURE AND ESCALATE to Juan, never a
   desk decision). Sellers are dealt **without replacement**, so the first
   10 calls cover all 10. Each call also *secretly weaves in* 2 pressure
   lines and 2 seller questions at natural moments. No examiner, no
   sections: every skill is tested inside the call where it actually lives.

   Buy-box rules baked into grading: California only; no manufactured or
   mobile homes (park or owned land); high-end heavy-rehab properties get
   escalated to Juan, not decided at the desk.

   Grading is deterministic: any of the 7 **hard fails** (quoting a price,
   promising an on-the-spot offer, stating own location, discussing a
   mailer amount, inventing stats, manufacturing urgency, "the offer is
   your check") = automatic FAIL with the offending line quoted back.
   Missing the recording disclosure or the how-did-you-hear question =
   automatic FAIL. Otherwise: open delivery ≥ 3/5, at most one miss across
   the embedded lines, and 8/10 Academy call criteria.

   **Certification gate** (tracked per trainee in admin): 12 passed calls
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
two-party) → all 8 done unlocks `/interview/<token>`, the certification
calls. Drills AND certification calls are auto-graded on completion —
structured verdicts, module progress, and the certification gate all show
on the trainee's admin page (Score with AI remains for re-grades and
sales-practice calls).

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
- [ ] Certification call rings, trainee speaks first, seller stays in character
- [ ] Embedded pressure lines/questions actually get woven into the call
- [ ] "CALL/DRILL COMPLETE" markers auto-end the session
- [ ] Audio .webm uploads and plays back in admin
- [ ] Scoring returns valid JSON; hard fails quote the trainee's words
- [ ] A run with a deliberate price quote comes back FAIL
- [ ] Model name still current (`lib/models.ts` — Live model names rotate)
