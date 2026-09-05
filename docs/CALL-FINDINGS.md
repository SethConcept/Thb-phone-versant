# What the real calls say

Fifty-two real Twin Home Buyer calls (2026-03 → 2026-09, ~5 hours, pulled from
REI BlackBook, redacted, committed at `data/real-calls/`) read end to end. This
is the game film the Sales Standard was waiting for. Everything below is
evidence from those calls, not from the written Academy rules — where the two
disagree, that disagreement is the finding.

Call ids below (`call-07`) refer to `data/real-calls/corpus.md`.

## The numbers

`node scripts/corpus-stats.mjs` — reproducible, no API key, re-run it whenever
the corpus is refreshed. These are regex counts over ASR output, so read them
as close-enough rather than exact; where one disagrees with the prose below,
the count is right.

```
52 calls · 4.7h · 30 inbound, 22 outbound · median 4:47

 20 / 30   67%  branded open ("thank you for calling …")   (inbound only)
 17 / 30   57%  gave a first name in the open              (inbound only)
  1 / 52    2%  disclosed the call is recorded
  1 / 52    2%  asked how they heard about us
  5 / 52   10%  asked who is on title / who signs
 18 / 52   35%  more than one decision-maker was involved
 12 / 52   23%  a dollar figure was said out loud
 10 / 52   19%  the line broke up or had to be repeated back
```

The two lines to look at together are the last-but-three and the one above it:
**more than one person had to agree on 35% of calls, and somebody asked who
signs on 10%.**

---

## 1. There are two jobs on this phone, and one rubric can't grade both

This is the biggest single error in what we built. The corpus divides cleanly:

| | **Intake desk** (Thea) | **Acquisitions** (Cherry) |
|---|---|---|
| Answers the line | yes, every inbound | rarely — takes transfers |
| Qualifies | address, condition, occupancy, timeline, motivation, authority | re-qualifies on the gaps |
| Books the visit | yes — this is the job | no |
| Quotes a number | **never should** | **always does** |
| Negotiates | no | yes, to a floor |
| Explains escrow / title / liens | no | yes, at length |
| Owns the file after contract | sends and chases documents | closing, extensions, keys |

Juan sits above both: property visit, final number, escalations.

The single rubric in `lib/sales-standard.ts` scored everyone as though they were
Cherry. It penalised Thea for not discovering motivation on a call that was
purely a signature chase (`call-39`), and it would have hard-failed Cherry on
nearly every call she ever made well. **Fixed:** the standard now takes a
`role`, and the rules differ by role.

## 2. Nobody discloses that the call is recorded — and the calls are recorded

`MANDATORY_OPEN` says *"This call is recorded for quality."* Across 52 calls,
**not one human said it** — the single hit in the counts above is a machine.
The actual open, used on two thirds of inbound calls and word-for-word between
both desk reps, is:

> "Hi, thank you for calling Twin Home Buyer. This is Thea. How may I help you?"

The only recording disclosure in the whole corpus comes from the AI receptionist
that started answering the line in late August (`call-40`, `call-52`):

> "Thanks for calling Twin Home Buyer. You're speaking with our voice AI agent,
> and this call may be recorded."

California is a two-party-consent state and every one of these calls was
recorded and transcribed. **This is a legal exposure, not a training nit, and
it is not ours to decide.** The rule stays in the standard; what changed is that
the app now reports it as a *policy breach at team level* rather than silently
failing every individual trainee for something the whole company does. Juan
should rule on it — either the line goes into the open, or the recording
practice changes.

## 3. "Never quote a price" is a desk rule that the company does not follow

The hard-fail list forbids quoting any figure. In the real calls:

- **Thea, to a cold postcard lead** (`call-28`): *"as a cash buyer, we usually
  buy properties 60 to 80% of the market value."*
- **Cherry, routinely**, gives the entire model out loud (`call-34`): ARV
  ~$400K → rehab $100K → required margin $50K → **offer $220K**. Then negotiates
  to $230K including a $3K water lien (`call-35`, `call-36`).
- **Cherry** also explains the cost of capital (`call-34`): *"we have a hard
  money lender… we're paying 10% for every purchase… that's part of the
  calculation on how we come up with a 220."*

Sellers respond *well* to this. The two-brothers deal closed precisely because
Cherry showed her arithmetic. So the rule is right for intake and wrong for
acquisitions — which is finding #1 again. The 60–80% line is the one that needs
Juan's ruling: it is currently being said by the desk, to strangers, before any
visit, and it anchors every later conversation.

## 4. The objections that actually come in

Ranked by frequency across the corpus, with how they were handled:

1. **"As-is means as-is — so why do you inspect?"** (`call-28`, `call-29`,
   `call-31`) — the most damaging objection in the corpus. Two siblings took it
   apart with a used-car analogy and the desk could not answer:
   *"I'm sorry, I can't dive into that because I'm not the one who ran the
   numbers… I'm not really into that department."* Their brother:
   *"you really didn't kind of answer my questions."*
   Cherry's answer on the follow-up call is now the canonical one, and it works:
   > "We buy it in its current condition. The inspection is how we determine the
   > value *in* that condition. We inspect **first**, then offer — so there's no
   > going back and forth. What we could do over the phone is a range, but I
   > don't do that; it's not fair to your house to get a final offer without
   > seeing it."
2. **"You'll drop the price after the inspection, like the last people did"**
   (`call-16`, `call-22`, `call-31`) — learned behaviour. A competitor really did
   this to two of these sellers. The winning counter is the non-contingent offer,
   said plainly: *"we don't do that here."*
3. **"Don't bother coming out below $X"** (`call-10`) — the seller sets a floor
   before anyone has seen the house.
4. **"I have two other offers; one wants me to sign today"** (`call-12`,
   `call-13`, `call-14`) — Cherry's counter is excellent and teachable: don't
   trash the competitor, teach the seller what to check — earnest money size,
   contingency clauses, proof of funds.
5. **"Give me your number before I give you mine"** (`call-06`).
6. **"Your industry is notoriously bad about following up"** (`call-06`) —
   said by a seller who then praised the fast callback. Speed to lead is the one
   process-compliance item that IS audible in a recording.

## 5. Ownership is almost never one person on title

Of the substantive seller calls, the majority involve a trust, an estate, a
power of attorney, or multiple siblings:

- deaf principal in a nursing home, wife holds POA, two beneficiaries (`call-01`)
- co-trustee who declined to serve, funds distribution across sisters (`call-05`)
- deceased mother's family trust, **three** siblings, one at work (`call-34`–`36`)
- father's estate, brother living in the house, sister holding a second set of
  keys, a car in the garage still in the dead father's name (`call-48`, `call-49`)

The training deck had one persona (Yvette) covering this. It should be the
default, not the exception. "Who is on title?" and "who else has to agree?" are
the two highest-value questions on this phone: **a second decision-maker turns
up on 35% of calls and somebody asks who can sign on 10%.** Usually the answer
arrives late, volunteered by the seller, after a visit has already been booked
with someone who cannot sell.

## 6. Half the sellers are ESL, and the reps are too

`call-18`, `call-21`, `call-44`, `call-45`, `call-52` are conversations where
both sides are working in a second language, over a bad line, about escrow
mechanics. They are slower, full of repeats and confirmations, and they close.
Nothing in the training deck rehearses this. Grading must never treat it as a
deficiency — the ESL/ASR fairness rule in the prompt matters more than we
thought, and it now cuts both ways.

## 7. What separates the calls that closed

Cherry's repeatable moves, in rough order of how often they show up:

- **Show the arithmetic.** Comps, rehab, margin, cost of capital — out loud.
- **State the sequence, then keep it.** Inspect → offer → non-contingent → no
  renegotiation. Say "we don't do that here" and mean it.
- **Arm the seller against the competition** instead of attacking it.
- **Establish authority early** — title, trust, POA, who else must agree.
- **Get every decision-maker on the call**, or explicitly plan how they will be.
- **Never leave the next step vague** — a named person and a named time, always.

## 8. What consistently goes wrong

- **Transferring instead of answering.** The desk's reflex under pressure is
  "let me have my colleague call you back." Sometimes correct; in `call-28` it
  lost control of a live, interested, sceptical seller.
- **The source question is asked once in 52 calls** (`call-18`, 2%) — and the
  answer was *"I tried the AI"*, which is a genuinely valuable attribution
  signal that nearly went uncaptured.
- **Dead air.** Long "let me just check here" stretches with nothing narrated.
- **Over-apologising** (`call-26`: *"All I can say is that just to keep
  apologizing to you"*) — it reads as fault where none exists.
- **Answering a question the seller didn't ask** while leaving theirs open.

---

## What changed in the codebase because of this

| Finding | Change |
|---|---|
| Two roles (#1) | `lib/sales-standard.ts` is now role-aware: `intake` and `acquisition` weightings and rules; `/admin/grade` picks the role. |
| Recording disclosure (#2) | Reported as a team-level policy alert, not a silent individual fail. |
| Price rules (#3) | Price hard-fails apply to `intake` only; `acquisition` is graded on whether the number was *justified*, not whether it was said. |
| Real objections (#4) | Six new pressure lines drawn verbatim from the corpus. |
| Title complexity (#5) | Three new certification sellers built on real ownership structures. |
| ESL (#6) | Explicit in the grading prompt for both roles. |
| Strong/weak patterns (#7, #8) | New rubric criteria: `authority`, `sequence_discipline`, `arithmetic`. |

## Refreshing this corpus

```bash
node scripts/reibb-pull.mjs   --cookies <jar> --contacts 20248727,20405298,…
node scripts/redact-calls.mjs <raw-dir> data/real-calls
node scripts/bench.mjs        # needs GEMINI_API_KEY
```

`redact-calls.mjs` prints every string that still looks like a person and exits
loudly. **Never commit output that still has open flags.**
