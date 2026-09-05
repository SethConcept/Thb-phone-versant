# THB Phone Academy — Versant Training

AI voice training and certification for the Twin Home Buyer seller line
(Iriga desk). A gated learning path that ends in a Versant-style
certification test, plus a sales practice mode and the courseware:

1. **📚 Learning path** (`/learn/<token>` — the trainee's home): sidebar of
   8 modules ported from the Phone Academy. Each module = content → a
   **4-question quiz** (pass at 3, graded server-side, instantly
   retakeable). Quizzes alone unlock the next module; finishing all 8
   unlocks the certification calls. A **🎙 Drill room** in the sidebar is
   optional, ungated, never-graded coached practice: 1 question or 3 in a
   row from the whole course pool, with the AI coach giving spoken advice
   right after each answer. Two admin bypasses for dry runs: the
   per-trainee "skip module gate" checkbox in admin, and the global
   `ADMIN_UNLOCK_CODE` (env var) — type it once under "Admin" at the
   bottom of any learning-path sidebar and that device gets a 30-day
   preview cookie unlocking everything on every trainee link, without
   touching trainee records.

2. **📞 The certification call** — ONE realistic inbound call, ~5 minutes,
   auto-graded the moment it ends. The line rings, the trainee answers with
   the mandatory open, and the AI plays one of **19 named situational
   sellers** (all "saw the TV commercial"): Dolores (grieving), Marcus
   (probate from Texas), Renee (divorce deadline), Dave (relocating), Gloria
   (behind on payments), Sam (tired landlord), Priya (embarrassed
   inheritor), Victor (Zillow anchor), Larry (inherited his father's place —
   the cooperative demo caller), Ray (angry, hounded by wholesalers),
   Marguerite (answers in two words — tests silence), Curtis (shopping
   several cash buyers), Yvette (three siblings on title, one refuses),
   Denise (a Realtor calling IN, asks how her commission is handled), Terri
   (mobile home — the correct outcome is a KIND, CLEAR NO per the buy box),
   and Jonathan (Menlo Park estate — the correct outcome is CAPTURE AND
   ESCALATE to Juan, never a desk decision). Three more come straight out of
   the real-call corpus: Warren (calling for a brother-in-law in a care home
   — trust, POA, squatters, a red-tagged house), Arthur & Camille (two
   siblings on the line, three on the title, who take the "as-is means
   as-is" question apart), and Minh (a bad line and a second language, where
   the whole call is won or lost on patience and confirming back). Sellers
   are dealt **without replacement**, so the first 19 calls cover all 19.
   Each call also *secretly weaves in* 2 pressure lines and 2 seller
   questions at natural moments. No examiner, no sections: every skill is
   tested inside the call where it actually lives.

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

3. **🏷 Dispositions certification** (mode `dispo`) — the Equity Track
   dispo track, fully separate content: a 7-module learning path (what a
   wholesale is, the two-numbers rule, the fence, the script, objections,
   the record, the 8-hour day) with the same quiz gating, then
   **outbound** certification calls. The trainee opens a dialer, places
   the call, hears real ringback, and one of **six Bay Area agents**
   answers "Hello?": Mike (busy), Sandra (hates wholesalers), Danielle
   (chatty, hides her buy box), Tom (hard no), Priya (grills on numbers),
   and Gary — THE TRAP, who warmly tries to pull the rep across the
   licensing line (ballpark a list price, gossip about the seller, get
   paid directly, "represent my buyer"). Agents deal without replacement;
   dialing one by name is ungraded-toward-the-gate practice. Grading:
   12-item rubric (0–2 each, pass ≥ 21/24) and **any licensing-boundary
   breach is an automatic FAIL** with the rep's words quoted back —
   claiming to be an agent, setting a list price, negotiating, inventing
   numbers, discussing the seller, off-the-books pay, accepting an offer.
   **Gate: 5 passed calls, one of which must be THE TRAP.** Courseware at
   `/dispo.html`.

4. **📞 Sales practice call** — the AI plays "John", a homeowner lead; the
   trainee runs the outbound follow-up script. Easy/hard difficulty,
   engagement-meter behavior, AI-scored (max 3 attempts per link).

5. **🗂 Real call library + grader** (`/admin/calls`, `/admin/grade`) — 52
   real Twin Home Buyer calls pulled from REI BlackBook and scrubbed of
   names, numbers and addresses, readable in the app and gradeable against
   the **THB Sales Standard**. That standard is *role-aware*: the intake
   desk and acquisitions are scored on different rubrics, because quoting a
   number is an automatic fail in one seat and the entire job in the other.
   `/admin/grade` scores any pasted transcript the same way. What the corpus
   changed, and why, is written up in `docs/CALL-FINDINGS.md`.

6. **📖 Courseware** — the Phone Academy study course at `/academy.html`
   and the Dispositions Training course at `/dispo.html`.

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
- [ ] Quiz grades, stores best score, and unlocks the next module
- [ ] Drill room coach gives spoken advice after each answer, then ends
- [ ] Locked modules/test actually block (and `skip_modules` bypasses)
- [ ] Certification call rings, trainee speaks first, seller stays in character
- [ ] Embedded pressure lines/questions actually get woven into the call
- [ ] "CALL/DRILL COMPLETE" markers auto-end the session
- [ ] Audio .webm uploads and plays back in admin
- [ ] Scoring returns valid JSON; hard fails quote the trainee's words
- [ ] A run with a deliberate price quote comes back FAIL
- [ ] Model name still current (`lib/models.ts` — Live model names rotate)

## Refreshing the real-call corpus

```bash
npm run calls:pull   -- --cookies ./cookies.txt --contacts 20248727,20405298
npm run calls:redact -- ./raw-calls data/real-calls
npm run calls:stats
```

REI BlackBook has no API key — log in through a browser, export the cookie
jar, point the puller at it. Raw pulls contain real seller names, phone
numbers, addresses and medical details; they are gitignored and must never be
committed. The redactor scans its own output and prints anything that still
looks like a person — **never commit output with open flags.**
