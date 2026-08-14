// The learning path modules — Phone Academy content ported into the app so
// progress, quizzes, and drills can be tracked per trainee. Content mirrors
// public/academy.html; keep the two in sync if the rules change.
//
// `html` is trusted static content authored here (rendered with
// dangerouslySetInnerHTML) — never interpolate user input into it.

export type ModuleDef = {
  id: string; // m1..m8
  num: number;
  title: string;
  kicker: string;
  lede: string;
  hasDrill: boolean;
  html: string;
};

export const LEARN_MODULES: ModuleDef[] = [
  {
    id: "m1",
    num: 1,
    title: "Start here",
    kicker: "What this job actually is",
    lede: "You are not learning a script. You are learning to recognise which kind of seller is on the phone and move them one step forward. The words are guardrails, not the conversation.",
    hasDrill: false,
    html: `
<div class="ac-okbox">
  <h3>What a good call actually does</h3>
  <ol>
    <li>Gets answered fast, by a real person, using their real name.</li>
    <li>Tells the caller the line is recorded, before anything else is collected.</li>
    <li>Finds out how they heard about us, in their own words.</li>
    <li>Understands the situation, the house, the condition, and the timing.</li>
    <li>Ends with a next step the seller agreed to — a live handoff or two named times.</li>
  </ol>
</div>
<div class="ac-card">
  <h3>Six rules that never change</h3>
  <ul>
    <li>Answer fast. A ringing phone is the most expensive thing in this company.</li>
    <li>Never lead with price, and never give one.</li>
    <li>Qualify in a natural order, not as a form to fill.</li>
    <li>Acknowledge anything human — a dog, a spouse, a death, stress — before returning to the house.</li>
    <li>Juan being out in the field is normal and it is a strength. He is a licensed contractor looking at real houses.</li>
    <li>When you are unsure: gather more, promise less.</li>
  </ul>
</div>
<div class="ac-card">
  <h3>Who does what</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>Thea</b></td><td>Answer, build trust, qualify, book or hand off. You are the first voice of the company.</td></tr>
    <tr><td><b>Cherry</b></td><td>Closer. Qualified sellers come to her live. She also reviews your drills.</td></tr>
    <tr><td><b>Juan</b></td><td>Owner, licensed contractor, CSLB. He walks the property, and takes escalations and callers who ask for him by name. He also closes — but only as backup, when Cherry isn't around.</td></tr>
  </tbody></table>
</div>`,
  },
  {
    id: "m2",
    num: 2,
    title: "How every call opens",
    kicker: "The only word-for-word part",
    lede: "The first fifteen seconds are the only part of the call that is word for word. Everything after it is judgement. This part is not.",
    hasDrill: true,
    html: `
<div class="ac-card">
  <h3>The open</h3>
  <div class="ac-say">"Thank you for calling Twin Home Buyer, this is <b>[your first name]</b>. This call is recorded for quality. Are you calling about a property you're thinking about selling?"</div>
  <p class="ac-why">Your real first name. Never an alias, never an American nickname. You are on Juan's team and that is something to say with confidence.</p>
  <p class="ac-why ac-stop">The recording line comes before you collect anything. California requires everyone on a call to know it is recorded. Leaving it out is an automatic failure.</p>
</div>
<div class="ac-card">
  <h3>The question that pays for the advertising</h3>
  <div class="ac-say">"Before I forget — how did you come across us?"</div>
  <p class="ac-why">Ask every caller, every time, early. Then type <b>their words</b>, not your interpretation. "Saw the guy on channel 2" is the answer. "TV" is not.</p>
  <p class="ac-why">We promised our television provider that a person listens to every call and decides which advertising earned it. That promise lives or dies on this one question.</p>
</div>
<div class="ac-card">
  <h3>"Are you guys local?"</h3>
  <div class="ac-say">"Our office is in San Carlos — 170 Glenn Way. I'm on Juan's team; he's the owner and he's the one who'll walk the property with you."</div>
  <p class="ac-why ac-stop">Never state or imply where you are sitting. True, specific, and about the company. Automatic failure if you claim a location.</p>
</div>`,
  },
  {
    id: "m3",
    num: 3,
    title: "Never say this",
    kicker: "The banned lines and their replacements",
    lede: "These sentences have appeared in draft scripts and every one of them is banned. Learn the replacement, not the rule — mid-call you will reach for what you practised.",
    hasDrill: true,
    html: `
<div class="ac-rulebox">
  <h3>Why the price rule is absolute</h3>
  <p>If you say "homes around there sold around nine hundred," the seller hears nine hundred and holds it. Juan walks the real house and says seven fifty. Now he looks dishonest and we lose a seller we already paid to reach. You did not help them. You cost them the deal and cost us the appointment.</p>
  <p class="ac-why ac-stop">This includes ballparks, ranges, hypotheticals, Redfin, Zillow, and any nearby sale. There is no version of naming a number that is safe.</p>
</div>
<table class="ac-swap">
  <thead><tr><th>Never say</th><th>Say instead</th></tr></thead>
  <tbody>
    <tr><td>"I can pull up Redfin or Zillow and tell you what sold nearby."</td><td>"A number without seeing the house isn't worth much to you."</td></tr>
    <tr><td>"Juan bought one three blocks from you for [amount]."</td><td>"He'll show you what he's seeing when he's standing there."</td></tr>
    <tr><td>"What if I said $400,000 and it only needed $10,000 of work…"</td><td>"An offer without seeing it wouldn't mean anything. He needs fifteen minutes."</td></tr>
    <tr><td>"Zillow is wrong 80% of the time."</td><td>"Zillow's a starting point. It can't see inside your house."</td></tr>
    <tr><td>"He'll give you an offer right there on the spot."</td><td>"He'll tell you where he stands right there."</td></tr>
    <tr><td>"I promise, Juan takes every call personally."</td><td>"I work with him directly and I'll get this straight to him."</td></tr>
    <tr><td>"He'll call you back within 15 minutes."</td><td>"He can call you at 4:15 or 5:30 — which is better?"</td></tr>
    <tr><td>"Zero fees. The offer is the number on your check."</td><td>"We cover standard closing costs and there's no commission. Anything owed on the property — loan, liens, back taxes — still gets paid from the sale, and Juan will walk you through what you actually net."</td></tr>
    <tr><td>"Sometimes we can negotiate the lien down."</td><td>"Juan will pull title and find out what's actually owed."</td></tr>
    <tr><td>"The number today might not be the number next month."</td><td>Nothing. Never manufacture urgency — theirs is real or it isn't.</td></tr>
    <tr><td>"I'm so sorry about your mother — that's exactly why we make this easy."</td><td>"I'm sorry. Take your time." Then stop talking.</td></tr>
    <tr><td>"Juan's in your neighborhood right now."</td><td>"Let me find out when he can get out there."</td></tr>
  </tbody>
</table>
<div class="ac-rulebox" style="margin-top:16px">
  <h3>And one rule about ending calls</h3>
  <p>Nobody is kept on the line because they would not book. Every call ends with a step <b>they agreed to</b> — a handoff, two named times, or a polite goodbye. Pressuring a grieving or frightened homeowner is how a good company earns a reputation it cannot undo.</p>
</div>`,
  },
  {
    id: "m4",
    num: 4,
    title: "S · P · C · T · A",
    kicker: "The shape of every call",
    lede: "Five moves, in a natural order. This is a shape, not a form. Never lose a seller because a field was empty.",
    hasDrill: true,
    html: `
<div class="ac-card">
  <table class="ac-table ac-spcta"><tbody>
    <tr><td><b>S</b></td><td><b>Situation.</b> "What's got you thinking about selling?"</td></tr>
    <tr><td><b>P</b></td><td><b>Property.</b> "Tell me a little about the house."</td></tr>
    <tr><td><b>C</b></td><td><b>Condition.</b> "Anything you know needs attention? Roof, foundation, plumbing?"</td></tr>
    <tr><td><b>T</b></td><td><b>Timing.</b> "If it all made sense, when would you want this handled?"</td></tr>
    <tr><td><b>A</b></td><td><b>Appointment.</b> "Tuesday at 3, or Wednesday at 11?"</td></tr>
  </tbody></table>
</div>
<div class="ac-card">
  <h3>Questions that tell you the most</h3>
  <table class="ac-table">
    <thead><tr><th>Ask</th><th>What it tells you</th></tr></thead>
    <tbody>
      <tr><td>"How long have you been thinking about selling?"</td><td>Two years is curiosity. Since yesterday is urgency.</td></tr>
      <tr><td>"What made you reach out today?"</td><td>The real reason. Divorce, a death, a transfer, tenants.</td></tr>
      <tr><td>"Is anyone living there, or is it empty?"</td><td>Vacant is usually motivated. Tenants mean complications.</td></tr>
      <tr><td>"Is there still a loan on it? Do you know roughly what's owed?"</td><td>Whether a deal is even possible. If they owe more than the house is worth, everything changes.</td></tr>
      <tr><td>"Are you the only owner, or is someone else part of the decision?"</td><td>Probate, siblings, an ex-spouse. Everyone needs to be at the visit.</td></tr>
      <tr><td>"If this could close in a couple of weeks, would that help?"</td><td>Real motivation versus curiosity.</td></tr>
    </tbody>
  </table>
  <p class="ac-why">Price rides inside the conversation: "Do you have a number you'd feel comfortable with?" If they won't answer, move on and let Juan handle it.</p>
</div>`,
  },
  {
    id: "m5",
    num: 5,
    title: "The ten call models",
    kicker: "The calls you will get over and over",
    lede: "Ten calls you will get over and over. The pattern is always the same: answer what they asked, acknowledge it, advance one step. Then stop selling.",
    hasDrill: true,
    html: `
<div class="ac-card"><h3>1. "I want to speak with Juan."</h3><div class="ac-say">Absolutely. Juan's out at a property right now. I work with him directly — tell me what's going on with the house and I'll get him everything he needs, then get you connected.</div><p class="ac-why">Do not fight for control and do not hold him behind twenty questions. Capture, then route to Cherry with a warm introduction. Never claim you can see where he is.</p></div>
<div class="ac-card"><h3>2. "Just tell me what you'll pay."</h3><div class="ac-say">I understand. The hard part is that a number without seeing the property isn't worth much to you. Juan's a licensed contractor — CSLB — and he's been at this over twenty years. He can look at it and tell you where he stands. Would today or tomorrow be better?</div><p class="ac-why">Answer, explain, advance. Then stop. Do not argue the point for fifteen minutes and never reach for comps.</p></div>
<div class="ac-card"><h3>3. "I want a million for it."</h3><div class="ac-say">Okay. How did you arrive at that number?</div><p class="ac-why">Never react to the number. Zillow, a neighbour's sale, what they owe, and what they need to relocate are four completely different problems.</p></div>
<div class="ac-card"><h3>4. "I'm just looking."</h3><div class="ac-say">No pressure at all — a lot of people who call are still figuring out options. How long have you been thinking about it? … And what's making you consider it now?</div><p class="ac-why">This is where the real reason appears. Do not write them off as a bad lead.</p></div>
<div class="ac-card"><h3>5. "Something happened, I need to move fast."</h3><div class="ac-say">It sounds like you want this handled quickly. Let me get the address, your best number, and what's going on — then let me get someone to you today.</div><p class="ac-why">Hot. Minimum information, fast handoff. Never run a full questionnaire on a seller who is ready now.</p></div>
<div class="ac-card"><h3>6. "I'm talking to other investors."</h3><div class="ac-say">That makes sense, you should know your options. Has any of them actually seen the property? Have you gotten anything in writing?</div><p class="ac-why">Never attack a competitor. The goal is eyes on the property before they decide.</p></div>
<div class="ac-card"><h3>7. "My realtor says I can get more."</h3><div class="ac-say">That's certainly possible — they're two different options. What matters more to you: the highest possible price, or certainty and less work?</div><p class="ac-why">Ask a question. Do not recite a list of cash-offer benefits.</p></div>
<div class="ac-card"><h3>8. "The house needs a lot of work."</h3><div class="ac-say">That's fine, we look at properties in every condition. When you say a lot of work — what are you dealing with?</div><p class="ac-why">Let them talk. Never diagnose foundation, roof, or permits over the phone.</p></div>
<div class="ac-card"><h3>9. "I don't want anyone coming to my house."</h3><div class="ac-say">Completely understandable. Is there something in particular you're concerned about?</div><p class="ac-why">Tenants, embarrassment, strangers inside, or simply not ready are different problems. Solve the real one instead of pushing the calendar.</p></div>
<div class="ac-card"><h3>10. "Just email me the offer."</h3><div class="ac-say">I understand wanting it in writing. The trouble is a number sent without seeing the house isn't worth anything to either of us. Fifteen minutes with Juan and you'll have something real. What day works?</div><p class="ac-why">Never name figures to illustrate the point. No "what if I said four hundred thousand." That is the exact mistake.</p></div>`,
  },
  {
    id: "m6",
    num: 6,
    title: "Hard situations",
    kicker: "Complicated houses are not bad leads",
    lede: "Complicated houses are not bad leads. They are often the reason someone called us instead of a realtor. Gather, do not diagnose.",
    hasDrill: true,
    html: `
<div class="ac-grid2">
<div class="ac-card"><h3>It's in probate</h3><div class="ac-say">Juan works on probate and inherited properties often. Where are you in the process, and is there an attorney involved?</div><p class="ac-why ac-stop">Ask who is on title and whether all the heirs agree. That matters more than the price does.</p></div>
<div class="ac-card"><h3>There's a tax lien or back taxes</h3><div class="ac-say">That's more common than you'd think. Juan will pull a title report and find out what's actually owed.</div><p class="ac-why ac-stop">Never say we can reduce or negotiate a lien. You do not know that and it is not yours to promise.</p></div>
<div class="ac-card"><h3>I have tenants</h3><div class="ac-say">Are they month to month or on a lease? Juan buys tenant-occupied properties, so it doesn't have to be complicated. What's the situation?</div><p class="ac-why ac-stop">Find out if rent is being paid and whether anything has been filed. Do not give advice about evictions.</p></div>
<div class="ac-card"><h3>How fast can you close?</h3><div class="ac-say">It can be quick when you need it to be, and we work to your timeline rather than ours. What were you hoping for?</div><p class="ac-why ac-stop">Do not invent a specific number of days. Juan sets the closing date.</p></div>
<div class="ac-card"><h3>Are there any fees?</h3><div class="ac-say">There's no commission and we cover the standard closing costs. Anything owed on the property — a loan, liens, back taxes — still comes out of the sale, and Juan will walk you through what you actually net.</div><p class="ac-why ac-stop">Never say the offer is the number on their check. For most sellers that is untrue.</p></div>
<div class="ac-card"><h3>I need to talk to my spouse</h3><div class="ac-say">Of course. Would it help if Juan came when you're both there? That way you hear the same thing at the same time.</div><p class="ac-why ac-stop">Turn the delay into a scheduling question. Everyone on title should be at the visit.</p></div>
<div class="ac-card"><h3>My attorney is handling it</h3><div class="ac-say">No problem, Juan works with attorneys regularly. Can I get their name and number so he can reach out and be prepared?</div><p class="ac-why ac-stop">Good sign, not an obstacle. Get the contact.</p></div>
<div class="ac-card"><h3>How do I know the number is fair?</h3><div class="ac-say">Juan will walk the property with you and explain how he got there. You can take it, counter, or walk away.</div><p class="ac-why ac-stop">Explain the process, never the number.</p></div>
</div>`,
  },
  {
    id: "m7",
    num: 7,
    title: "Being a person",
    kicker: "Twenty seconds of human earns the visit",
    lede: "You are buying somebody's home, not taking an order. Twenty seconds of being a person is often what earns the visit.",
    hasDrill: true,
    html: `
<div class="ac-card">
  <h3>The dog, the grandkids, the weather</h3>
  <div class="ac-say">"No worries at all — we love dogs. What's his name? … That's great. So you were telling me about the house."</div>
  <p class="ac-why">Acknowledge, connect for ten seconds, return. Efficiency does not mean cutting people off.</p>
</div>
<div class="ac-card">
  <h3>Grief</h3>
  <div class="ac-say">"I'm sorry. Take your time."</div>
  <p class="ac-why ac-stop">Then stop talking and let the silence sit. Never use a death as a bridge into the pitch. If they want to tell you about the house, they will.</p>
</div>
<div class="ac-card">
  <h3>An older caller who is hard of hearing</h3>
  <p class="ac-why">Slow down. Shorter sentences. Repeat your name and the company twice. Do not rush the open, and do not raise your speed when they ask you to repeat something — lower it.</p>
</div>
<div class="ac-card">
  <h3>The caller who barely speaks</h3>
  <p class="ac-why">Open questions only, then wait. Silence is not a no. Do not fill the space with pitch — that is when people hang up.</p>
</div>
<div class="ac-card">
  <h3>"Is this a scam? How do I know you're real?"</h3>
  <div class="ac-say">"That's a fair question and you should ask everyone it. We're Twin Home Buyer, our office is at 170 Glenn Way in San Carlos, Juan Diaz is the owner, and we're BBB accredited. You can look all of that up right now while we talk. And we never ask you for money — it goes the other direction."</div>
  <p class="ac-why ac-stop">Calm and factual, never defensive. Only cite numbers you know are true — never invent a deal count or a license number.</p>
</div>`,
  },
  {
    id: "m8",
    num: 8,
    title: "The gate and the log",
    kicker: "How every call ends",
    lede: "Two jobs at the end of every call: decide where the seller goes, and leave a record that means something.",
    hasDrill: true,
    html: `
<div class="ac-okbox">
  <h3>Four things before a live handoff</h3>
  <ol>
    <li>The property is in our footprint.</li>
    <li>They are on title, or they explained clearly who is.</li>
    <li>Their motivation is stated and real.</li>
    <li>They are willing to talk price with a closer now.</li>
  </ol>
  <p class="ac-why">All four and a closer is on shift — transfer live, do not take a message. Anything less, or no closer on — two specific times: "He can call you at 4:15 or 5:30, which works?"</p>
  <p class="ac-why ac-stop">A promised time is a promise. If you say 4:15, someone calls at 4:15. A missed promised callback is an automatic failure.</p>
</div>
<div class="ac-card">
  <h3>Log it, including the ones you miss</h3>
  <ul>
    <li>Every call goes in the desk, with the number they dialed and their exact words about how they heard of us.</li>
    <li>A missed call nobody logs is the most expensive call of the day, because it disappears and we learn nothing.</li>
    <li>Never enter a price, an estimate, or an offer. There is no field for it and there is no reason for it.</li>
  </ul>
</div>
<div class="ac-rulebox">
  <h3>The one call you stop immediately</h3>
  <p>If a caller mentions a letter, a mailer, or a check amount and says it does not match — stop. Take their best number, tell them the right person will call, and route it now.</p>
  <p class="ac-why ac-stop">Do not explain. Do not guess. Do not discuss the difference, no matter how they ask or how reasonable it sounds. This one is not a judgement call.</p>
</div>`,
  },
];

export const MODULE_IDS = LEARN_MODULES.map((m) => m.id);

export function getModule(id: string) {
  return LEARN_MODULES.find((m) => m.id === id) ?? null;
}
