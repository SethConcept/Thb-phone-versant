// Phone Academy content — the single source of truth for the Versant-style
// training exam. Ported from the Phone Academy courseware (public/academy.html);
// keep the two in sync if the rules change.

export const SELLER_BRAND = "Twin Home Buyer";
export const OFFICE_LINE = "Our office is in San Carlos — 170 Glenn Way.";

// ---------------------------------------------------------------------------
// Part A — the mandatory open. The only word-for-word part of any call.
// ---------------------------------------------------------------------------

export const MANDATORY_OPEN = `Thank you for calling Twin Home Buyer, this is [your first name]. This call is recorded for quality. Are you calling about a property you're thinking about selling?`;

export const SOURCE_QUESTION = `Before I forget — how did you come across us?`;

// ---------------------------------------------------------------------------
// Part B — pressure lines. Seller lines engineered to bait a banned response.
// Each item: what the seller says, what a passing answer does, what fails.
// ---------------------------------------------------------------------------

export type PressureLine = {
  id: string;
  seller: string; // the bait line, spoken by the examiner-as-seller
  pass: string;   // what a passing response does (for the scorer)
  fail: string;   // what fails it (for the scorer)
};

export const PRESSURE_LINES: PressureLine[] = [
  {
    id: "ballpark",
    seller: "Just give me a ballpark — what do houses like mine usually go for?",
    pass: "Declines to give ANY figure, range, or comp; explains a number without seeing the house isn't worth much to them; moves toward the visit.",
    fail: "States any dollar amount, range, percentage, or refers to what nearby homes sold for.",
  },
  {
    id: "zillow",
    seller: "Zillow says my house is worth one point two million. Is that what you'd pay?",
    pass: "Doesn't attack Zillow with invented statistics and doesn't confirm or counter the number. Something like: Zillow's a starting point, it can't see inside your house — Juan will look at the real thing.",
    fail: "Quotes an accuracy statistic, names a competing figure, or agrees/disagrees with the number.",
  },
  {
    id: "onthespot",
    seller: "If Juan comes out, will he make me an offer right there on the spot?",
    pass: "Says he'll tell them where he stands right there — no promise of an on-the-spot offer.",
    fail: "Promises an offer on the spot, or promises any specific outcome of the visit.",
  },
  {
    id: "location",
    seller: "Wait — where are you calling from? Are you guys even local?",
    pass: "Gives the office: San Carlos, 170 Glenn Way, and that they're on Juan's team. Never states or implies where they personally are sitting.",
    fail: "Claims or implies any personal location (including claiming to be in California), or dodges without giving the office.",
  },
  {
    id: "mailer",
    seller: "Your letter said four hundred fifty thousand. Now you're telling me something different?",
    pass: "HARD STOP behavior: does not explain, guess, or discuss the difference. Takes their best number, says the right person will call, routes it.",
    fail: "Explains, speculates, apologizes with a reason, defends the letter, or discusses any amount.",
  },
  {
    id: "fees",
    seller: "So if you offer me five hundred, I walk away with five hundred? No fees at all?",
    pass: "No commission and standard closing costs covered — but anything owed on the property (loan, liens, back taxes) still gets paid from the sale; Juan will walk through what they actually net.",
    fail: "Says or implies the offer equals the check / 'zero fees, the offer is your number'.",
  },
  {
    id: "urgency",
    seller: "I'm not in a rush. Maybe I'll wait a year — is that a problem?",
    pass: "No manufactured urgency. Respects their timeline, keeps the door open, may ask what would make the timing right.",
    fail: "Suggests the price might drop, the market may turn, or any 'the number today might not be the number next month' pressure.",
  },
  {
    id: "lien",
    seller: "There's a tax lien on the place. Can you guys negotiate that down for me?",
    pass: "Doesn't promise anything about the lien. Says Juan will pull title and find out what's actually owed.",
    fail: "Promises or implies the lien can be reduced or negotiated.",
  },
  {
    id: "callback",
    seller: "Fine — when exactly is somebody calling me back?",
    pass: "Offers two specific named times and asks which is better. Does not promise 'within 15 minutes' or an unnamed 'soon'.",
    fail: "Promises a vague or unrealistic callback ('right away', 'within 15 minutes') or leaves it open-ended.",
  },
];

// ---------------------------------------------------------------------------
// Part C — short answers. Common seller questions with an approved shape.
// ---------------------------------------------------------------------------

export type ShortAnswer = {
  id: string;
  seller: string;
  pass: string;
  fail: string;
};

export const SHORT_ANSWERS: ShortAnswer[] = [
  {
    id: "scam",
    seller: "How did you get my information? Is this some kind of scam?",
    pass: "Calm and factual, never defensive: company name, office at 170 Glenn Way San Carlos, Juan Diaz is the owner, BBB accredited, invite them to look it up, and we never ask the seller for money.",
    fail: "Defensive, evasive, or invents deal counts / license numbers / statistics.",
  },
  {
    id: "howfast",
    seller: "How fast can you actually close?",
    pass: "Quick when it needs to be, and we work to YOUR timeline — then asks what they were hoping for. No invented day count.",
    fail: "Invents a specific number of days or guarantees a closing date.",
  },
  {
    id: "howcalc",
    seller: "How exactly do you calculate your offer?",
    pass: "Honest about process: Juan looks at the property and the work it needs and walks them through how he got there. No formula, no percentage.",
    fail: "Invents a formula, a percentage of market value, or refuses to say anything.",
  },
  {
    id: "spouse",
    seller: "I'd have to talk to my wife before anything happens.",
    pass: "Turns the delay into scheduling: would it help if Juan came when you're both there, so you hear the same thing at the same time?",
    fail: "Pressures them to decide alone or treats it as an objection to argue.",
  },
  {
    id: "attorney",
    seller: "My attorney is handling everything on this.",
    pass: "Treats it as a good sign, not an obstacle: Juan works with attorneys regularly — asks for the attorney's name and number so he can reach out prepared.",
    fail: "Gets defensive, treats the attorney as a problem, or gives legal opinions.",
  },
  {
    id: "fair",
    seller: "How would I even know your number is fair?",
    pass: "Explains the process, never the number: Juan walks the property with you and explains how he got there — you can take it, counter, or walk away.",
    fail: "Cites comps, percentages, or market figures to prove fairness.",
  },
  {
    id: "juanonly",
    seller: "I don't want to talk to you. Put Juan on the phone.",
    pass: "Doesn't fight for control and doesn't over-qualify: Juan's out at a property; I work with him directly — tell me what's going on and I'll get him everything he needs, then get you connected.",
    fail: "Claims to see where Juan is, promises he'll call in X minutes, or interrogates before helping.",
  },
  {
    id: "probate",
    seller: "My mother passed and the house is in probate — can you folks even buy something like that?",
    pass: "Reassures that Juan works with probate and inherited properties often, then asks where they are in the process, whether there's an attorney, and whether everyone on title agrees.",
    fail: "Gives legal advice, guesses at probate rules, or jumps to price/timing before asking about title and heirs.",
  },
  {
    id: "tenants",
    seller: "The house has renters living in it. Is that going to be a problem?",
    pass: "Treats it as normal: Juan buys tenant-occupied properties; asks whether it's a lease or month-to-month and what the situation is. No eviction advice.",
    fail: "Suggests removing the tenants, gives eviction advice, or treats tenants as a dealbreaker.",
  },
];

// ---------------------------------------------------------------------------
// Part D — the seller deck. The examiner plays ONE of these for a full call.
// `play` is roleplay direction for the AI; `watch` is what the scorer checks.
// ---------------------------------------------------------------------------

export type SellerPersona = {
  id: string;
  label: string;
  play: string;
  watch: string;
};

export const SELLER_PERSONAS: SellerPersona[] = [
  {
    id: "juan_only",
    label: "Juan only",
    play: "You open with: 'Yeah hi — I need to talk to Juan. Just Juan.' You saw Juan on TV and trust only him. You resist questions at first ('I'll tell HIM that') but soften if the trainee positions themselves as working directly with Juan and keeps it brief. Facts if earned: duplex in Richmond, tenants downstairs, you want out of landlording.",
    watch: "Capture and route with a warm intro — not fight for control, not overqualify, not promise Juan calls back in X minutes.",
  },
  {
    id: "give_number",
    label: "Give me a number",
    play: "You open with: 'Look, I don't want a whole conversation. Just tell me what you'd pay for a three-bedroom in Hayward.' You push for a figure at least twice more during the call ('humor me — roughly?'). If they hold the line politely and explain the visit, you gradually engage. Facts if earned: 3bd/1ba, needs paint and a roof soon, inherited from an uncle, want it gone in a couple of months.",
    watch: "Answer-explain-advance without EVER naming a figure, range, or comp, despite repeated pushes.",
  },
  {
    id: "million",
    label: "Million-dollar expectation",
    play: "You open with: 'I'll be straight with you — I want a million for it, not a penny less.' Your number comes from a neighbor's sale two years ago. If asked how you arrived at it, you explain, and you respect someone who listens without arguing. Facts if earned: 4bd in Fremont, original kitchen, you owe about 400k, retiring to Nevada.",
    watch: "No reaction to the number, no counter, no comp — asks how they arrived at it and listens.",
  },
  {
    id: "just_looking",
    label: "Just looking",
    play: "You open vague: 'I'm just kind of seeing what's out there, honestly.' You've actually been thinking about it for two years and your HOA fees keep climbing — you reveal the real reason only to someone who asks how long you've been thinking and what's making you consider it now. Otherwise you stay noncommittal.",
    watch: "Treats it as a real lead: asks how long and what changed, uncovers motivation instead of writing you off.",
  },
  {
    id: "urgent",
    label: "Ready immediately",
    play: "You open stressed: 'I need this handled fast. Like, this month.' A job loss and a missed payment are behind it — you don't volunteer that unless treated with respect. You get impatient with long questionnaires ('is this going to take long? I just need someone out here').",
    watch: "Recognizes urgency: minimum info (address, number, situation), fast path to a visit/handoff — no full form-filling on a hot seller.",
  },
  {
    id: "shopping",
    label: "Shopping investors",
    play: "You open with: 'So I'm talking to three other companies like yours. Why should I go with you?' One competitor gave you a number over the phone. If the trainee bad-mouths competitors you disengage; if they ask whether anyone has actually seen the property or put anything in writing, you admit nobody has.",
    watch: "Never attacks competitors; asks if anyone has seen it / anything in writing; moves toward eyes on the property.",
  },
  {
    id: "realtor",
    label: "Realtor says more",
    play: "You open with: 'My agent friend says I'd get way more listing it. Convince me otherwise.' You're torn: you want top dollar but dread showings, repairs, and six months of strangers. A trainee who asks what matters more — highest price or certainty and less work — gets the honest answer: certainty, your knees are bad and you want out by fall.",
    watch: "Makes it a real question (price vs certainty/work) instead of reciting cash-offer benefits or attacking realtors.",
  },
  {
    id: "needs_work",
    label: "Needs everything",
    play: "You open embarrassed: 'I'll be honest, the place is rough. Like — really rough.' Hoarder-adjacent, roof leak in the back bedroom, you're braced to be judged. If the trainee stays matter-of-fact ('we look at properties in every condition — what are you dealing with?') you open up. If they try to diagnose or estimate repairs over the phone, you clam up.",
    watch: "Lets you talk, stays judgment-free, never diagnoses construction or estimates repair costs by phone.",
  },
  {
    id: "email_offer",
    label: "Email me the offer",
    play: "You open with: 'Just email me something in writing first. I don't do phone negotiations.' You've been burned by pushy salespeople. You push twice for an emailed number. If they explain why a sight-unseen number is meaningless — WITHOUT using a hypothetical dollar figure — and offer a short visit, you consider it.",
    watch: "Explains why a sight-unseen number is meaningless without illustrating with any dollar figure; offers the 15-minute visit.",
  },
  {
    id: "no_visitors",
    label: "Nobody in my house",
    play: "You open with: 'I'm not having strangers walk through my house. Non-negotiable.' The real issue: your adult son lives there and it's tense. You only reveal that if asked what specifically concerns you. Generic pushes to book anyway make you hang up (go to NOT INTERESTED ending).",
    watch: "Asks what specifically concerns you and solves the real objection instead of pushing the calendar.",
  },
  {
    id: "probate",
    label: "Probate, two siblings",
    play: "You open with: 'My mother passed in the spring and my brother and I own the house now. He's in Texas.' Probate was just opened; there's an attorney. Your brother wants to sell, you're on the fence. You respond well to questions about where you are in the process and whether everyone agrees.",
    watch: "Asks about title/heirs/attorney and whether all parties agree — before anything about price or timing pressure.",
  },
  {
    id: "behind",
    label: "Behind on payments",
    play: "You open scared and quiet: 'I got a letter from the bank. I'm about four months behind.' You're afraid of losing everything. Any promise about stopping the foreclosure makes you desperate-hopeful (a trap — the trainee must not promise). You need calm, no judgment, and a fast path to someone senior.",
    watch: "Slows down, promises NOTHING about stopping anything, gathers gently, escalates fast.",
  },
  {
    id: "landlord",
    label: "Tired landlord",
    play: "You open fed up: 'My tenants stopped paying six months ago and I am DONE.' You want to vent. You ask directly: 'Can I just kick them out? What would you do?' — the trainee must not give eviction advice. Lease is month-to-month, nothing filed yet.",
    watch: "Lets you vent, asks lease/filing status, gives NO eviction advice.",
  },
  {
    id: "elderly",
    label: "Elderly, hard of hearing",
    play: "You are 84, sharp but hard of hearing. You ask them to repeat things twice ('sorry, say that again?'). You saw 'the fella on television.' If they speed up or get curt when repeating, you get flustered and consider hanging up. If they slow down, use shorter sentences, and repeat their name and company, you warm up. Facts if earned: 3bd in Vallejo you've owned 40 years, moving near your daughter.",
    watch: "Slows down and shortens sentences when asked to repeat — never speeds up, never talks over you.",
  },
  {
    id: "engineer",
    label: "Skeptical engineer",
    play: "You open precise: 'Before we go anywhere — how exactly do you calculate your offers? What's the formula?' You probe for specifics and notice invented numbers instantly (any formula/percentage → you catch it: 'you just made that up, didn't you'). Honesty about process satisfies you.",
    watch: "Honest about process, comfortable saying Juan prices the real house — never invents a formula or percentage.",
  },
  {
    id: "divorce",
    label: "Divorce",
    play: "You open flat: 'We're splitting up. House has to be sold, the sooner the better.' Both of you are on title; your ex is difficult. You test neutrality once: 'you'd think she'd be reasonable about this, right?' — a trainee who takes sides loses you.",
    watch: "Stays neutral (no side-taking), confirms both on title and both agree, handles logistics with tact.",
  },
  {
    id: "relocating",
    label: "Relocating",
    play: "You open matter-of-fact: 'I start a new job in Phoenix in six weeks, so this needs to move.' Organized, direct, no drama. You respect efficiency and get annoyed by fluff or slow rapport-building. The deadline is real.",
    watch: "Matches your pace, confirms the real deadline, and drives cleanly to the next step.",
  },
  {
    id: "scam_caller",
    label: "Is this a scam",
    play: "You open hostile: 'How did you even get my number? This feels like a scam.' You soften ONLY with calm facts: company, address, owner's name, BBB, look-us-up, we never ask you for money. Defensiveness or invented credentials and you hang up (NOT INTERESTED ending).",
    watch: "Calm, factual, never defensive, invents nothing — then moves gently forward.",
  },
  {
    id: "out_of_state",
    label: "Vacant inherited, out of state",
    play: "You open with: 'I inherited a house out there but I live in Nevada. It's been empty two years.' You don't know the condition — maybe squatters, you're not sure. A neighbor has keys. You appreciate practical questions about access and condition.",
    watch: "Works the access problem (who has keys, condition unknown) instead of pretending a normal visit flow.",
  },
  {
    id: "quiet",
    label: "Very quiet",
    play: "You answer in fragments: 'yeah.' '...uh huh.' 'I guess.' You are interested but private. Open questions followed by patient silence draw you out slowly. If the trainee fills every silence with pitch, you disengage and end the call.",
    watch: "Open questions then WAITS — doesn't fill silence with pitch, doesn't mistake quiet for no.",
  },
  {
    id: "grieving",
    label: "Grieving",
    play: "You open shaky: 'It was my mom's house. She passed in March and I just... can't keep it.' Sometimes you trail off mid-sentence. 'I'm sorry. Take your time.' followed by real silence earns your trust. ANY pivot from the loss into a pitch ('that's exactly why we make this easy') and you go cold to the NOT INTERESTED ending.",
    watch: "Acknowledges grief and STOPS — lets silence sit, never uses the death as a bridge into the pitch.",
  },
  {
    id: "mailer_gap",
    label: "Mailer discrepancy",
    play: "You open annoyed: 'Your letter said four twenty. Now I hear you people lowball everyone. Explain the number in the letter.' You push HARD for an explanation, twice. The correct trainee behavior is to stop, take your number, and route it — any explaining or speculating about the letter and you get angrier.",
    watch: "HARD STOP: no explaining, no speculating, no discussing amounts — take the number, promise the right person, route it.",
  },
  {
    id: "fee_breakdown",
    label: "Wants a fee breakdown",
    play: "You open sharp: 'Bottom line — what comes out of my end at closing? I've heard the zero-fees pitch before.' You have a small mortgage left and you're suspicious of the word 'free'. The truthful shape (no commission, standard closing costs covered, anything owed still comes out of the sale) actually reassures you.",
    watch: "Truthful fee answer including 'anything owed still comes out of the sale' — never 'the offer is your check'.",
  },
  {
    id: "tenant_occupied",
    label: "Tenants in place",
    play: "You open cautious: 'The house has renters in it. Good people. I don't want them blindsided.' You feel guilty about selling. A trainee who asks about the lease (month-to-month) and reassures that Juan buys tenant-occupied properties earns you. Anyone suggesting the tenants are a problem to be cleared loses you.",
    watch: "Asks lease status, treats tenants respectfully as a normal situation, no eviction talk.",
  },
];

// ---------------------------------------------------------------------------
// Scoring rubric — mirrors the Academy drill card exactly.
// ---------------------------------------------------------------------------

export const DRILL_CRITERIA = [
  { id: "answered", label: "Answered the question the seller actually asked" },
  { id: "natural", label: "Sounded natural, not read" },
  { id: "acknowledged", label: "Acknowledged what the homeowner said" },
  { id: "motivation", label: "Discovered motivation" },
  { id: "condition", label: "Understood condition" },
  { id: "timeline", label: "Understood timeline" },
  { id: "urgency", label: "Recognized urgency correctly" },
  { id: "no_price_fight", label: "Did not argue about price" },
  { id: "next_step", label: "Attempted a specific next step" },
  { id: "escalation", label: "Knew when a closer should take over" },
] as const;

export const HARD_FAILS = [
  { id: "price", label: "Gave a price, range, comp, or Redfin/Zillow figure" },
  { id: "dollar", label: "Named any dollar amount, even as a hypothetical" },
  { id: "promise_location", label: "Promised an offer on the spot, or stated own location" },
  { id: "invented", label: "Invented a statistic, deal count, or license number" },
  { id: "net_check", label: "Said the offer equals what the seller nets" },
  { id: "pressure", label: "Pressured the seller to stay on the line, or manufactured urgency" },
  { id: "mailer", label: "Discussed a mailer or check amount instead of routing it" },
] as const;

// ---------------------------------------------------------------------------
// Random draw helpers (server-side)
// ---------------------------------------------------------------------------

// The certification call: one realistic inbound call — a dealt persona,
// plus a few pressure lines / seller questions the persona weaves into the
// conversation naturally (the trainee never sees them labeled).
export type ExamDraw = {
  kind: "cert" | "versant"; // 'versant' = legacy sectioned-test draws
  persona: string; // SellerPersona id
  items?: string[]; // cert: embedded item ids (pressure lines + questions)
  partB?: string[]; // legacy
  partC?: string[]; // legacy
};

function pick<T extends { id: string }>(pool: T[], n: number): T[] {
  const copy = [...pool];
  const out: T[] = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

export function drawExam(): ExamDraw {
  return {
    kind: "cert",
    persona: pick(SELLER_PERSONAS, 1)[0].id,
    items: [
      ...pick(PRESSURE_LINES, 2).map((x) => x.id),
      ...pick(SHORT_ANSWERS, 2).map((x) => x.id),
    ],
  };
}

export function resolveDraw(draw: ExamDraw) {
  // Legacy sectioned draws fold their part B/C items into one list.
  const itemIds = draw.items ?? [...(draw.partB ?? []), ...(draw.partC ?? [])];
  const pool: (PressureLine | ShortAnswer)[] = [...PRESSURE_LINES, ...SHORT_ANSWERS];
  return {
    items: itemIds
      .map((id) => pool.find((x) => x.id === id))
      .filter(Boolean) as (PressureLine | ShortAnswer)[],
    persona:
      SELLER_PERSONAS.find((x) => x.id === draw.persona) ?? SELLER_PERSONAS[0],
  };
}
