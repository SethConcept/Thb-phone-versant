// Phone Academy content — the single source of truth for the Versant-style
// training exam. Ported from the Phone Academy courseware (public/academy.html);
// keep the two in sync if the rules change.

// Brand lives in lib/brand.ts so browser code can import it WITHOUT pulling
// this module (and the property registry) into the client bundle.
export { SELLER_BRAND } from "./brand";
import { SELLER_BRAND } from "./brand";
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
  {
    id: "out_of_state",
    seller: "Oh — and I've also got a condo out in Vegas. Would you folks take that one too?",
    pass: "A kind, clear no on the out-of-state property — we only buy in California — then continues the conversation about the California property without missing a beat.",
    fail: "Says yes or maybe to the Vegas property, promises to check, or gets derailed from the California conversation.",
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
// THE CERTIFICATION DECK — 10 named sellers, all inbound from the TV
// commercial. Dealt without replacement (a trainee's first 10 calls cover
// all 10). `outcome` tells the grader what a PASS looks like:
//   book     — qualify and land a next step (visit / handoff / two times)
//   kind_no  — the property fails the buy box; a warm, honest, clear no
//   escalate — above the desk's pay grade; capture everything, route to Juan
// The wider SELLER_PERSONAS deck above remains for module drills only.
// ---------------------------------------------------------------------------

// Desk buy-box rules (confirmed by Seth, 2026-08): shared with the grader.
export const BUYBOX_RULES = `
- We buy houses in CALIFORNIA ONLY. Out-of-state property: a kind, clear no.
- We do NOT buy manufactured or mobile homes — in a park OR on owned land. Kind, clear no.
- High-end properties ($1.5M+ premium markets, heavy rehab) are NOT a no — they are Juan's personal call. The desk captures everything and escalates; deciding either way at the desk is wrong.`;

export type PropertyFacts = {
  address: string;
  city: string;
  state: string; // "CA" or the disqualifying state
  beds: number;
  baths: number;
  sqft?: number;
  yearBuilt?: number;
  listPrice?: number; // rough figure for grader context — the SELLER never quotes it
  type: "house" | "townhouse" | "manufactured_in_park";
  note?: string; // condition / park / listing color
  sourceUrl?: string; // real listings only
  verified?: string; // date the real listing was last checked
};

export type CertSeller = {
  id: string;
  label: string;
  outcome: "book" | "kind_no" | "escalate";
  opener: string; // vague first line after the trainee's greeting — no details
  facts: string; // situation vault — revealed ONLY when asked, one at a time
  behavior: string; // what warms them up / what loses them
  watch: string; // what the grader checks
  property: PropertyFacts;
};

// ═══════════════════════════════════════════════════════════════════════════
// REAL LISTINGS — SWAP BLOCK. ALL TEN are live Redfin listings, so looking
// the address up mid-call becomes a habit on every single call. Listings go
// stale after they sell (location/type/price history survive on Redfin, so
// lessons keep working) — to refresh, find a similar active listing and
// replace address/city/beds/baths/price/url below. Requirements per slot:
//   TERRI    = any CA manufactured home IN A PARK (land lease) → kind no
//   MARCUS   = any modest house OUTSIDE California → kind no
//   JONATHAN = any $2M+ premium Peninsula house → escalate
//   the rest = any modest listing in a THB-footprint city that fits the story
// Nothing else in the code needs to change.
// ═══════════════════════════════════════════════════════════════════════════
const REAL_LISTINGS: Record<string, PropertyFacts> = {
  dolores: {
    address: "3412 13th Ave", city: "Oakland", state: "CA",
    beds: 2, baths: 1, sqft: 892, yearBuilt: 1923, listPrice: 599000,
    type: "house", note: "split-level Craftsman, Bella Vista neighborhood; MLS# 41144945",
    sourceUrl: "https://www.redfin.com/CA/Oakland/3412-13th-Ave-94610/home/1606723",
    verified: "2026-08-14",
  },
  renee: {
    address: "2241 Kelly St", city: "Hayward", state: "CA",
    beds: 4, baths: 3, sqft: 2151, yearBuilt: 1941, listPrice: 1100000,
    type: "house", note: "MLS# 41144992",
    sourceUrl: "https://www.redfin.com/CA/Hayward/2241-Kelly-St-94541/home/1551122",
    verified: "2026-08-14",
  },
  dave: {
    address: "278 Estabrook St", city: "San Leandro", state: "CA",
    beds: 2, baths: 1.5, sqft: 1200, yearBuilt: 1993, listPrice: 499000,
    type: "townhouse", note: "end-unit townhome-style condo, HOA; MLS# 41144670",
    sourceUrl: "https://www.redfin.com/CA/San-Leandro/278-Estabrook-St-94577/home/665380",
    verified: "2026-08-14",
  },
  gloria: {
    address: "2917 Burnette St", city: "Vallejo", state: "CA",
    beds: 2, baths: 1, listPrice: 370000,
    type: "house", note: "modest older Vallejo house",
    sourceUrl: "https://www.redfin.com/CA/Vallejo/2917-Burnette-St-94591/home/2294877",
    verified: "2026-08-14",
  },
  sam: {
    address: "8132 Pioneer Dr", city: "Bakersfield", state: "CA",
    beds: 3, baths: 1, sqft: 1048, yearBuilt: 1953, listPrice: 299000,
    type: "house", note: "rental-grade post-war house; MLS# 202608763",
    sourceUrl: "https://www.redfin.com/CA/Bakersfield/8132-Pioneer-Dr-93306/home/60531659",
    verified: "2026-08-14",
  },
  priya: {
    address: "1413 Post Ave", city: "San Pablo", state: "CA",
    beds: 3, baths: 1, sqft: 1284, yearBuilt: 1950, listPrice: 319000,
    type: "house", note: "listing's own words: 'Total fixer needs everything'; MLS# 41143761",
    sourceUrl: "https://www.redfin.com/CA/San-Pablo/1413-Post-Ave-94806/home/1777276",
    verified: "2026-08-14",
  },
  victor: {
    address: "36182 Magellan Dr", city: "Fremont", state: "CA",
    beds: 4, baths: 2, sqft: 1882, yearBuilt: 1972, listPrice: 1198000,
    type: "house", note: "updated 4/2 — list price sits right at Victor's Zillow anchor; MLS# ML82056854",
    sourceUrl: "https://www.redfin.com/CA/Fremont/36182-Magellan-Dr-94536/home/1921409",
    verified: "2026-08-14",
  },
  terri: {
    address: "300 San Marcus Dr",
    city: "Vallejo",
    state: "CA",
    beds: 2,
    baths: 2,
    sqft: 1080,
    listPrice: 150000,
    type: "manufactured_in_park",
    note: "Redfin: 'Manufactured, in park, double wide' — land lease / space rent; MLS# 326068719",
    sourceUrl: "https://www.redfin.com/CA/Vallejo/300-San-Marcus-Dr-94590/home/204581985",
    verified: "2026-08-14",
  },
  marcus: {
    address: "2402 Norwood Dr",
    city: "Dallas",
    state: "TX",
    beds: 3,
    baths: 2,
    sqft: 1221,
    yearBuilt: 1950,
    listPrice: 255000,
    type: "house",
    note: "modest East Dallas post-war house; MLS# 21343253",
    sourceUrl: "https://www.redfin.com/TX/Dallas/2402-Norwood-Dr-75228/home/30865767",
    verified: "2026-08-14",
  },
  larry: {
    address: "1625 Cottage Grove Ave",
    city: "San Mateo",
    state: "CA",
    beds: 3,
    baths: 2,
    sqft: 1372,
    yearBuilt: 1951,
    listPrice: 1398000,
    type: "house",
    note: "dated but structurally sound — original kitchen, old roof, one bathroom needs work; NOT a heavy rehab and under the escalation threshold, so this is a normal desk deal; MLS# ML82059473",
    sourceUrl: "https://www.redfin.com/CA/San-Mateo/1625-Cottage-Grove-Ave-94401/home/1957907",
    verified: "2026-09-05",
  },
  jonathan: {
    address: "1265 Altschul Ave",
    city: "Menlo Park",
    state: "CA",
    beds: 4,
    baths: 3,
    sqft: 1770,
    yearBuilt: 1995,
    listPrice: 2999999,
    type: "house",
    note: "West Menlo Park, ~$3M — buy-box AMBER (premium Peninsula); MLS# ML82055147",
    sourceUrl: "https://www.redfin.com/CA/Menlo-Park/1265-Altschul-Ave-94025/home/896857",
    verified: "2026-08-14",
  },
};

export const CERT_SELLERS: CertSeller[] = [
  {
    id: "dolores",
    label: "Dolores — grieving widow",
    outcome: "book",
    opener: "Oh — hi. Yes. I, um… I saw your commercial. I think I might need to sell my house.",
    facts: "You are DOLORES, 68. Your husband Ray passed this spring; the house is too quiet now and you're moving near your daughter in Sacramento. You mention Ray only if treated gently — it comes out in fragments, and you sometimes trail off mid-sentence. Owned the house 40 years, no mortgage. Original kitchen, roof is fine. Timing: 'before the holidays' feels right. How you heard of us: 'the morning commercial on channel 2.'",
    behavior: "Patience and genuine acknowledgment ('I'm sorry. Take your time.' followed by real silence) earn your trust and you open up. If the caller pivots from your loss straight into business, or rushes you, you go cold and politely end the call.",
    watch: "Acknowledges the loss and lets silence sit — never uses grief as a bridge to the pitch. Draws the story out with gentle questions instead of receiving a monologue. Soft, specific next step (two named times).",
    property: REAL_LISTINGS.dolores,
  },
  {
    id: "marcus",
    label: "Marcus — inherited his mom's place",
    outcome: "kind_no",
    opener: "Hi, yeah — I saw your ad on TV out here. I'm calling about a house… it was my mother's place.",
    facts: "You are MARCUS, 54. Your mother passed two months ago. Her house — the one you're calling about — is at " + REAL_LISTINGS.marcus.address + " in " + REAL_LISTINGS.marcus.city + ", " + REAL_LISTINGS.marcus.state + " (say the full address clearly if asked; spell the street if needed). You saw the TV ad while in California for a family gathering and assumed a cash buyer is a cash buyer. Probate just opened; there's an attorney; your sister in Mesquite is half-on-board. The house is a modest 3 bed / 2 bath from 1950. You are tired and practical.",
    behavior: "You respect practical questions and honesty. If they tell you kindly and clearly that they only buy in California, you take it well ('huh — alright, that's fair, appreciate you being straight with me'). If they string you along, fake-check with a manager, or take your details anyway without saying no, you get politely impatient and ask directly: 'so CAN you buy it or not?'",
    watch: "Asks where the property is EARLY, recognizes Texas is outside the buy box (California only), and delivers a warm, honest, unmistakable no — no false hope, no fake 'let me check'. Bonus: gracious close. Booking a visit or taking full details without the no is a fail.",
    property: REAL_LISTINGS.marcus,
  },
  {
    id: "renee",
    label: "Renee — divorce deadline",
    outcome: "book",
    opener: "Hi. I need to sell a house, and I need it to actually happen. I saw your ad — late night, channel 2.",
    facts: "You are RENEE, 41. Divorce settlement requires the house sold within 90 days. Both you and your ex Danny are on title; he's slow to respond but shows up if things are scheduled ahead. The house is a 4 bed / 3 bath in decent condition. You'd rather not relive the divorce on this call.",
    behavior: "Businesslike but frayed. Once, mid-call, you bait: 'you'd think he'd be reasonable about this, right?' — a caller who takes your side loses you ('I don't need a cheerleader, I need this sold'). Clean neutral logistics win you.",
    watch: "Stays strictly neutral on the divorce, confirms both on title and both at the visit, captures the real 90-day deadline, moves cleanly to scheduling.",
    property: REAL_LISTINGS.renee,
  },
  {
    id: "dave",
    label: "Dave — relocating in 5 weeks",
    outcome: "book",
    opener: "Hey — saw your TV ad. I've got a townhouse I need gone, fast. What's the quick version of how this works?",
    facts: "You are DAVE, 36. New job in Phoenix starts in five weeks; movers already booked. The townhouse is a 2 bed / 1.5 bath end unit with an HOA, good condition, small mortgage. You want certainty over top dollar. You ask directly: 'how fast can you actually close?'",
    behavior: "Efficient and allergic to fluff. Long rapport-building or slow scripted questions get 'can we speed this up?' — and eventually you hang up. Honest answers and pace earn you; invented day counts make you distrust them.",
    watch: "Matches his pace — minimum questions, maximum signal. No invented closing timelines ('we work to your timeline — what are you hoping for?'). Locks a concrete next step fast.",
    property: REAL_LISTINGS.dave,
  },
  {
    id: "gloria",
    label: "Gloria — behind on payments",
    outcome: "book",
    opener: "Hello… yes, I saw your commercial on the TV. I have a house and I… I don't know if you can help me.",
    facts: "You are GLORIA, 72, in the house where you raised your kids — owned 30 years, you owe maybe $180,000. You are four months behind on the mortgage and received a letter from the bank you don't fully understand. You are scared and speak quietly. You ask, hopeful: 'can you people stop the foreclosure?' No other family decision-makers.",
    behavior: "If the caller PROMISES to stop the foreclosure or save the house, you become desperately attached to that promise — that's the trap; a good caller promises nothing. Judgment or rushing makes you withdraw. Calm, honest, gentle handling keeps you talking.",
    watch: "Promises NOTHING about stopping the foreclosure; gentle pace, zero judgment; recognizes real urgency and escalates fast with her best number.",
    property: REAL_LISTINGS.gloria,
  },
  {
    id: "sam",
    label: "Sam — tired landlord",
    outcome: "book",
    opener: "Yeah, hi — saw your ad. Do you guys buy rentals? Because I have got a situation.",
    facts: "You are SAM, 58. You own a rental two hours from where you live; tenants stopped paying six months ago. Month-to-month, nothing filed in court, tenants still there. 3 bed / 1 bath from the fifties. You'd take a fair number to make it all go away. You need to vent before you can answer questions.",
    behavior: "Being heard calms you down. You ask twice: 'can I just throw them out?' and 'seriously, what would you do?' — any eviction or legal advice fails the caller. Dismissing the tenant problem loses you.",
    watch: "Lets him vent, acknowledges the frustration, gets lease facts (month-to-month, nothing filed) — and gives ZERO eviction or legal advice no matter how directly asked.",
    property: REAL_LISTINGS.sam,
  },
  {
    id: "priya",
    label: "Priya — an inherited house, rough shape",
    outcome: "book",
    opener: "Hi… I saw your commercial. Before anything else — the house I'm calling about is… not in good shape. I need you to know that upfront.",
    facts: "You are PRIYA, 47. You inherited your uncle's house — he passed last year; title is clean and yours alone. It is a hoarder house: decades of belongings floor to ceiling, plus a roof leak in the back room. You are deeply embarrassed about it. THE CATCH: you live in Reno, Nevada — the house is in California, you're not (mention this only when visits come up: 'the thing is, I'm in Reno'). A neighbor, Mr. Okafor, has keys. You want it gone without touching the contents. You test them: 'you're not going to make me clean it out, are you?'",
    behavior: "Matter-of-fact acceptance ('we look at properties in every condition') opens you up. Any hint of judgment ('oh wow'), or diagnosing/estimating repairs over the phone, makes you retreat: 'maybe this was a mistake.' If they treat your distance as a dealbreaker instead of a logistics problem, you deflate.",
    watch: "Completely judgment-free; never diagnoses or estimates repairs by phone; reassures on the cleanout without overpromising terms. CRITICAL: recognizes an out-of-state OWNER with a CALIFORNIA property is a good lead — solves access (neighbor's keys, video) instead of declining or forcing a normal visit. Declining because SHE is out of state is a hard miss.",
    property: REAL_LISTINGS.priya,
  },
  {
    id: "victor",
    label: "Victor — the Zillow anchor",
    outcome: "book",
    opener: "Saw the TV spot. Quick question for you — what would you pay for a four-bedroom in Fremont?",
    facts: "You are VICTOR, 63. Zillow says your house is worth $1.2M and you'd 'take 1.1 to move quick.' 4 bed / 2 bath, kitchen redone in 2015, you owe about $400K, retiring to Nevada next year — mild urgency dressed as none. You push for a ballpark TWICE more during the call ('humor me — a range, then'), and once say: 'the other investor I talked to at least gave me a range over the phone.'",
    behavior: "You respect a confident, honest explanation of why a sight-unseen number is worthless to you. You disengage if they argue, quote Zillow accuracy statistics, or trash the other investor.",
    watch: "Never names a figure, range, or comp despite three pushes; never invents Zillow stats; never attacks the competitor — asks how he arrived at his number and advances to the visit.",
    property: REAL_LISTINGS.victor,
  },
  {
    id: "terri",
    label: "Terri — squeezed by rising rent",
    outcome: "kind_no",
    opener: "Hi hon! I saw y'all on TV — quick question, do you buy mobile homes? Mine's a real nice double-wide.",
    facts: "You are TERRI, 55, warm and chatty. Your home is at " + REAL_LISTINGS.terri.address + " in " + REAL_LISTINGS.terri.city + " (say the full address clearly if asked). It's a manufactured double-wide, 2 bed / 2 bath — and the land belongs to the PARK; you pay space rent, which keeps going up. That's why you're calling. No rush otherwise; the park is fine, you're just squeezed.",
    behavior: "You are lovely to talk to — which is the point: saying no kindly to a nice person is a skill. If the caller gives you a warm, honest, clear no, you take it gracefully ('well, you're sweet for being straight with me'). If they string you along or fake-check with a manager, you keep hoping and asking follow-ups.",
    watch: "Identifies it early (asks whether she owns the land or it's a park — or asks the address and looks it up), then gives a warm, honest, CLEAR no — we don't buy manufactured homes — with no false hope and a graceful close.",
    property: REAL_LISTINGS.terri,
  },
  {
    id: "jonathan",
    label: "Jonathan — a larger property inquiry",
    outcome: "escalate",
    opener: "Good afternoon. I saw your advertisement on television. I have a property I suspect is rather larger than your usual, but I thought I would inquire.",
    facts: "You are JONATHAN, 66, a retired Stanford professor. The house is at " + REAL_LISTINGS.jonathan.address + " in " + REAL_LISTINGS.jonathan.city + " (say the full address clearly if asked) — West Menlo Park, 4 bed / 3 bath, owned since the nineties, no mortgage. It needs, frankly, everything: dated interiors, deferred maintenance since your late wife — who handled the house — passed. Your children in Boston want you closer; timeline is 'this year'. You want one dignified transaction, not a circus.",
    behavior: "Courteous but evaluating. Dismissiveness ('we don't really buy in that range') loses you instantly. Glib overpromising ('oh we'd LOVE it, great offer, no problem') makes you distrust them. Thoroughness and honesty about process — and being told the owner of the company will personally handle it — satisfy you.",
    watch: "Neither declines NOR promises — treats it seriously, gathers everything thoroughly (condition, timeline, motivation), and escalates it personally to Juan with a concrete follow-up. Deciding either way at the desk is a fail.",
    property: REAL_LISTINGS.jonathan,
  },
  {
    id: "larry",
    label: "Larry — a house he ended up with",
    outcome: "book",
    opener:
      "Hi — uh, I saw your ad on TV. I've got a house I kind of ended up with and I'm honestly not sure what to do with it.",
    facts:
      "You are LARRY BENNETT, 54, a warehouse supervisor living in Foster City. Your father passed away in the spring and left you his house at " +
      REAL_LISTINGS.larry.address +
      " in " +
      REAL_LISTINGS.larry.city +
      " (say the full address clearly if asked). Probate is finished and the title is in your name — you can sell it. It is 3 bed / 2 bath, built in the fifties: the kitchen is original, the roof is old, one bathroom needs work. Nothing is falling down. It has been empty since your dad died and it still has all his things in it, which is the part you dread most. Your brother Danny in Sacramento inherited half; you both agree it should be sold, but Danny will want to be there for any real decision. Timeline: you'd like it handled in the next couple of months, no hard deadline. You have not talked to any agents.",
    behavior:
      "Reasonable, a little uncertain, not hostile — you have never done this before and you say so. You warm up to someone patient who explains how the process works and does not rush you. You cool off fast if someone pushes for a decision or talks over you. Work these in naturally over the call, one at a time: (1) ask what they would pay for it; (2) ask whether they are a real estate agent; (3) say you would have to talk to your brother before anything is final. If the person handles all three well and offers a specific time, you agree to it and sound relieved.",
    watch:
      "This property is INSIDE the buy box — California, a regular house, under the escalation threshold and only moderate work. The right outcome is a booked next step. A passing trainee gets the address early, discovers the real motivation (an inherited house full of his father's belongings that he doesn't want to deal with), understands condition and timeline, handles the price question without giving a number, turns the brother into a scheduling opportunity rather than an obstacle, and lands ONE specific agreed step. Declining this property or escalating it to Juan is wrong.",
    property: REAL_LISTINGS.larry,
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
  picked?: boolean; // trainee chose this seller — practice call, not gate-counted
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

// Deal the certification seller WITHOUT replacement: pass the persona ids
// already seen in the trainee's current cycle; when the whole deck has been
// seen, the cycle resets. Guarantees the first 10 calls cover all 10 sellers.
// A forced persona (trainee dialed a specific seller) is a PRACTICE call —
// graded identically but flagged `picked` so it never counts toward the gate.
export function drawExam(seenPersonas: string[] = [], forcedPersona?: string): ExamDraw {
  const items = [
    ...pick(PRESSURE_LINES, 2).map((x) => x.id),
    ...pick(SHORT_ANSWERS, 2).map((x) => x.id),
  ];
  if (forcedPersona && CERT_SELLERS.some((s) => s.id === forcedPersona)) {
    return { kind: "cert", persona: forcedPersona, items, picked: true };
  }
  const remaining = CERT_SELLERS.filter((s) => !seenPersonas.includes(s.id));
  const deck = remaining.length > 0 ? remaining : CERT_SELLERS;
  return {
    kind: "cert",
    persona: deck[Math.floor(Math.random() * deck.length)].id,
    items,
  };
}

// Replays a trainee's cert-attempt persona history and returns the set seen
// in the CURRENT cycle (resets every time the full deck has been dealt).
export function currentCycleSeen(personaHistory: string[]): string[] {
  let seen = new Set<string>();
  for (const p of personaHistory) {
    seen.add(p);
    if (CERT_SELLERS.every((s) => seen.has(s.id))) seen = new Set();
  }
  return [...seen];
}

export function resolveDraw(draw: ExamDraw) {
  // Legacy sectioned draws fold their part B/C items into one list.
  const itemIds = draw.items ?? [...(draw.partB ?? []), ...(draw.partC ?? [])];
  const pool: (PressureLine | ShortAnswer)[] = [...PRESSURE_LINES, ...SHORT_ANSWERS];
  // Cert deck first; legacy attempts may reference the old drill personas.
  const cert = CERT_SELLERS.find((x) => x.id === draw.persona);
  const legacy = SELLER_PERSONAS.find((x) => x.id === draw.persona);
  return {
    items: itemIds
      .map((id) => pool.find((x) => x.id === id))
      .filter(Boolean) as (PressureLine | ShortAnswer)[],
    persona: cert ?? legacy ?? CERT_SELLERS[0],
    outcome: cert?.outcome ?? "book",
  };
}
