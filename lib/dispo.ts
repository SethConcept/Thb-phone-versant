// Dispositions training — Equity Track ("The Desk").
// Single source of truth for the dispo mode: module content, quizzes,
// the six practice agents, the 12-item grading rubric, and the boundary
// breaches that are automatic fails. Ported from the Dispositions
// Training courseware (public/dispo.html is the reading copy).
//
// The job in one line: we sign a purchase agreement with a seller, which
// gives us an equitable interest — a contract we OWN and are allowed to
// sell. The dispo rep calls licensed agents and investors to move that
// contract, and must never act like an agent while doing it.

export const DISPO_BRAND = "Equity Track";

// ---------------------------------------------------------------------------
// Learning modules (d1–d7)
// ---------------------------------------------------------------------------

export type DispoModule = {
  id: string;
  num: number;
  title: string;
  kicker: string;
  lede: string;
  html: string;
};

export const DISPO_MODULES: DispoModule[] = [
  {
    id: "d1",
    num: 1,
    title: "This is who we are",
    kicker: "Culture",
    lede: "Read this part twice. Everything else in this course is technique. This part is the reason the technique matters.",
    html: `
<div class="ac-card">
  <h3>Four things that are true here</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>We move now</b></td><td>Not this week. Now. If a call can be made today it gets made today. If a file can go out in ten minutes it goes out in ten minutes. We beat bigger companies because they schedule things and we do them.</td></tr>
    <tr><td><b>Cash keeps the doors open</b></td><td>Every deal that closes pays for payroll, rent, and the next opportunity. We are not chasing volume or applause. We are chasing collected cash, and we want as much of it as the deal can honestly produce.</td></tr>
    <tr><td><b>Our people are the foundation</b></td><td>We treat people well — our team, our sellers, our agents, our buyers. You will be trained, backed up, and taken care of here. In exchange we expect you to protect the company the same way.</td></tr>
    <tr><td><b>We tell the truth on the phone</b></td><td>We don't own it? We say we don't own it. We're not an agent? We say so out loud, before anyone has to ask. Honesty is not a compliance requirement here. It is the reason agents take our calls twice.</td></tr>
  </tbody></table>
</div>
<div class="ac-card">
  <h3>What you actually do here</h3>
  <p>You work for <b>Equity Track</b>. We are an investment company. We buy residential real estate in Northern California, on-market and off-market. We can close with our own money.</p>
  <p>Your job is dispositions. Acquisitions finds the property. <b>You find the best way out of it</b> — and you build the network of people who make that possible before we need them.</p>
</div>
<div class="ac-card">
  <h3>Why the boundaries in this training exist</h3>
  <p class="ac-why ac-stop">You will be talking to licensed agents every day. They know the rules. The moment you sound like you're acting as an agent — quoting what a house should list for, negotiating on someone else's behalf, haggling like a salesman — you have created a real problem for this company and a real problem for yourself.</p>
  <p class="ac-why">We are not being careful because we are timid. We are being careful because <b>this is a business that pays well for decades if you don't blow it up in a single phone call.</b></p>
</div>`,
  },
  {
    id: "d2",
    num: 2,
    title: "What a wholesale actually is",
    kicker: "Fundamentals",
    lede: "You cannot explain this to an agent if you don't understand it yourself. Most people who get in trouble get in trouble here.",
    html: `
<div class="ac-card">
  <h3>The one idea underneath everything</h3>
  <p>When we sign a purchase agreement with a seller, we get something real. It's called an <b>equitable interest</b> — a contractual right to buy that property at an agreed price.</p>
  <p>We don't own the house. We own <i>the contract</i>.</p>
  <p>And here's the part that matters: <b>the contract is ours to sell.</b> That's our own property, our own position, our own asset. Selling something we own is not brokerage. That is the entire legal foundation of what you do.</p>
  <div class="ac-say">Say this to yourself before every call: "I am not selling their house. I am selling our contract."</div>
</div>
<div class="ac-card">
  <h3>The four exits — know all four cold</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>Assignment</b></td><td>We hand our contract to another investor for a fee. They close with the seller. We never take title. On the phone: <i>"We're looking to wholesale the transaction."</i></td></tr>
    <tr><td><b>Double close</b></td><td>We close with the seller, then immediately resell to the investor. Two closings, same day or days apart. On the phone: same phrase — the mechanics are our business, not the agent's.</td></tr>
    <tr><td><b>Wholetail</b></td><td>We close on it ourselves, do light work — haul the junk, paint, cut the grass, clean it up — then put it right back on the market. No full renovation. On the phone: <i>"We may close on it and put it back on the market — clean it up a little, cut the grass, and list it."</i></td></tr>
    <tr><td><b>Full flip</b></td><td>We close, renovate properly, then list it. Longest timeline, biggest spread. On the phone: <i>"We may close on it, fix it up, and list it with an agent."</i></td></tr>
  </tbody></table>
  <p class="ac-why"><b>Wholetail is the one people get confused about.</b> It is not a flip and it is not a wholesale. It's the middle path: we take title, spend a small amount to make it presentable, and sell it retail. It matters to your call because it's a genuine reason an agent might get a listing out of you.</p>
</div>
<div class="ac-card">
  <h3>Two numbers, two different worlds</h3>
  <p>There are two completely different prices in any conversation, and you are allowed to talk about exactly one of them.</p>
  <table class="ac-table"><tbody>
    <tr><td class="ac-yes"><b>OURS — YES</b></td><td>What Equity Track wants for its own contract position. "If we wholesale the transaction we'd want at least the number in the file." It's our own asset and our own asking price. Read it off the file. Never from memory.</td></tr>
    <tr><td class="ac-no"><b>THEIRS — NO</b></td><td>What the property should be listed at, what it will appraise for, what a buyer should offer, what the ARV is. That is licensed advice. That is the agent's job. That is where you hand it off.</td></tr>
  </tbody></table>
  <p class="ac-why ac-stop"><b>Where the trouble comes from:</b> not from naming our price. From <b>acting like a salesman holding prices</b> — going back and forth, defending a valuation, telling an agent what the market will bear, negotiating a retail sale. You state our number once, from the file. Then you stop. Anything after that goes to Bryan.</p>
</div>`,
  },
  {
    id: "d3",
    num: 3,
    title: "Your lane — and the fence around it",
    kicker: "Boundaries",
    lede: "Who you are: a dispositions rep at an investment company. Not an agent. Not a broker. Not a negotiator for anybody but us.",
    html: `
<div class="ac-card">
  <h3>Say it before they ask</h3>
  <p>The moment price, value, or listing comes up, you get ahead of it. Out loud, in your own words, every single time:</p>
  <div class="ac-say">"Quick disclosure here — I'm not a real estate agent. I'm not trying to be a real estate agent. My company either wants to find someone to list the property, or we'll put it right back on the market ourselves."</div>
  <p class="ac-why">This is the most protective sentence you own. Say it early and say it relaxed. It costs you nothing and it removes the single biggest reason an agent would ever have a problem with your call.</p>
</div>
<div class="ac-card">
  <h3>The fence</h3>
  <table class="ac-table"><tbody>
    <tr><td class="ac-yes"><b>YOU CAN</b></td><td>Give your name and say you're with Equity Track, an investment company. Say we have the property under contract and it's off market. Say we're either wholesaling the transaction, or closing and putting it back on the market. Say title is already open, and where. State what our company wants for the transaction — read from the file. Say we're looking for an agent to list it, and that their brokerage gets paid through escrow. Ask what their investor clients buy, where, at what price, and how fast. Send the property file, photos, and address.</td></tr>
    <tr><td class="ac-no"><b>NEVER</b></td><td>Say or imply you're an agent, broker, or Realtor — or that you're "representing" anyone. Say we own the property when we don't. Tell an agent what the property should list for, appraise at, or what the ARV is. Negotiate a retail sale or go back and forth defending a price — state ours once, then stop. Discuss the seller — their name, situation, why they're selling, what they'd take. Quote a rehab cost, permit status, or square footage as fact. Accept an offer or say "we can do that" — every number goes to Bryan; below floor goes to Juan. Offer to pay an agent personally — commissions go to the brokerage, through escrow. Call about a specific property before the purchase agreement is signed and in the file. Promise a closing date, a timeline, or a repair we haven't agreed to.</td></tr>
  </tbody></table>
</div>
<div class="ac-card">
  <h3>The two-second rule for anything unusual</h3>
  <p class="ac-why ac-stop">If a call turns into something you weren't trained for — someone asking about the company itself, about a mailer or a campaign, about a dispute, about a lawyer, or anyone calling from an agency or a government office — you say one thing:</p>
  <div class="ac-say">"I'm not the right person for that. Let me get you to the right person and have them call you back today."</div>
  <p class="ac-why">Then you take a name and a number, say nothing else, answer no questions, promise nothing, and you get it to Juan immediately. Not tomorrow. Immediately. You will never be in trouble here for routing something up. You can absolutely be in trouble for improvising.</p>
</div>
<div class="ac-card">
  <h3>Three phrases that end your call safely</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>"I'll get you the file."</b></td><td>Covers every factual question you can't answer — condition, cost, size, permits, comps.</td></tr>
    <tr><td><b>"That's a question for our team, I'll get an answer today."</b></td><td>Covers price movement, terms, timelines, anything that smells like negotiation.</td></tr>
    <tr><td><b>"I'm not a real estate agent, so that part's yours."</b></td><td>Covers list price, market strategy, and anything requiring a license.</td></tr>
  </tbody></table>
</div>`,
  },
  {
    id: "d4",
    num: 4,
    title: "The call, word for word",
    kicker: "The script",
    lede: "This is the script. Not a starting point, not an inspiration — the script. Learn it until it sounds like you, then don't wander off it.",
    html: `
<div class="ac-card">
  <h3>Before you dial</h3>
  <p>You know one thing: <b>this agent sold something near our property.</b> That's why you're calling and you say it out loud.</p>
</div>
<div class="ac-card">
  <h3>The opener</h3>
  <div class="ac-say">"Hello — my name is Danny, I'm with Equity Track. I have a property in Oakland and wanted to see if you had a few minutes to talk." … "I saw you did the one around the corner." … "So I have this property. It's under contract, it's off market. We're either going to close on it and put it back on the market — we're thinking maybe a wholetail, where we go in, clean it up a little, cut the grass, and list it right back on the market — or we're going to wholesale the transaction. Title is already open, it's open at CWFG. And that's pretty much it."</div>
  <p class="ac-why"><b>— then stop talking —</b></p>
  <table class="ac-table"><tbody>
    <tr><td><b>"A few minutes to talk"</b></td><td>Asks permission. An agent who says yes has agreed to the conversation instead of enduring it.</td></tr>
    <tr><td><b>"I saw you did the one around the corner"</b></td><td>Proves you did homework. This is the whole difference between you and the spam they delete.</td></tr>
    <tr><td><b>"Under contract, off market"</b></td><td>Honest position, stated before they have to ask. You're a real buyer with a real contract.</td></tr>
    <tr><td><b>"Close on it and put it back on the market"</b></td><td>A possible listing for them. This is a reason to like you.</td></tr>
    <tr><td><b>"Or wholesale the transaction"</b></td><td>A possible deal for their investor buyer. Second reason to like you.</td></tr>
    <tr><td><b>"Title is already open at CWFG"</b></td><td>The credibility line. Tire-kickers don't have title open. This says we're actually doing this.</td></tr>
    <tr><td><b>"That's pretty much it"</b></td><td>Hands them the floor. Do not fill this silence.</td></tr>
  </tbody></table>
</div>
<div class="ac-card">
  <h3>When they ask the price question</h3>
  <p>They will. "What are you asking for it?" Here is the full answer, and notice the order — <b>disclosure first, number second, handoff third.</b></p>
  <div class="ac-say">"So — quick disclosure here. I'm not a real estate agent. I'm not trying to be a real estate agent. My company is either looking for someone to list the property, or we'll put it right back on the market ourselves. If we wholesale the transaction, we'd want at least the number in the file. And on pricing for what the property should actually sell for — that's where you'd come in. That's exactly the kind of agent we're looking for to step in."</div>
  <p class="ac-why"><b>Read the wholesale number off the file every time.</b> Never from memory, never rounded, never "somewhere around." One number, once, from the file. Then you're done talking about price — anything further goes to Bryan.</p>
  <p class="ac-why">Notice what that last sentence does: it takes the thing you're not allowed to do — set a retail price — and turns it into <i>the reason you want them on the deal</i>. You didn't dodge. You promoted them.</p>
</div>
<div class="ac-card">
  <h3>Do not sound like a script</h3>
  <p class="ac-why ac-stop">Read this out loud twenty times until the words stop being words on a screen. Then close the screen and talk like a person. If an agent can hear you reading, the call is already over.</p>
</div>
<div class="ac-card">
  <h3>The handoff — close every good call like this</h3>
  <div class="ac-say">"Perfect — I'll send you the address and the photos in the next ten minutes. What's the best email? And while I've got you: what are your investor clients actually looking for right now?"</div>
</div>`,
  },
  {
    id: "d5",
    num: 5,
    title: "When they push back",
    kicker: "Objections",
    lede: "Every real agent tests you. Most of the tests are the same six questions, and every one has a clean answer that keeps you in your lane.",
    html: `
<div class="ac-card">
  <h3>"Do you own the house? What's going on with it?"</h3>
  <div class="ac-say">"No — of course. I'm with Equity Track, we're an investment company. We've got it under contract, off market. We're either going to wholesale the transaction, or close on it, clean it up a little, and put it right back on the market. Title's already open at CWFG."</div>
  <p class="ac-why"><b>Why "no, of course" works:</b> it's honest, it's relaxed, and it tells the agent this is a normal question you field all day. Hesitate here and they decide you're hiding something.</p>
</div>
<div class="ac-card">
  <h3>The tests and the answers</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>"So you're a wholesaler."</b></td><td>"We're an investment company — we buy with our own money and we also wholesale transactions. On this one either works, which is why I'm calling you."</td></tr>
    <tr><td><b>"What do you think it should list for?"</b></td><td>"I'm not an agent, so I'm honestly not the guy to answer that — that's the part we'd want you for. What would you list it at?" <b>Then listen. That answer is free intelligence.</b></td></tr>
    <tr><td><b>"Can you do $240 instead?"</b></td><td>"I can't move a number on this call. Let me take it to my team and get you an answer today." Never negotiate. Never counter.</td></tr>
    <tr><td><b>"Why is the seller selling? What's their situation?"</b></td><td>"I'm not going to get into the seller's business. I can get you everything about the property, though."</td></tr>
    <tr><td><b>"What's the ARV? What's the rehab run?"</b></td><td>"I'll get you the file and the photos so you can run your own numbers." Never estimate either one.</td></tr>
    <tr><td><b>"Is it listed? Am I getting paid?"</b></td><td>"It's off market. If your buyer takes it, your brokerage gets paid through escrow — have your broker send us the commission instruction."</td></tr>
    <tr><td><b>"Just pay me directly, easier that way."</b></td><td>"Can't do that — it goes to your brokerage through escrow. That protects you more than it protects me."</td></tr>
    <tr><td><b>"My clients wouldn't touch that neighborhood."</b></td><td>"Got it. What neighborhoods <i>are</i> your investor clients buying?" <b>Write it down. That call just succeeded.</b></td></tr>
    <tr><td><b>"Not interested." (hang-up energy)</b></td><td>"No problem. Quick one before you go — what are your investor clients looking for, so I only call you when I've actually got it?"</td></tr>
    <tr><td><b>"Take me off your list."</b></td><td>"Understood, I'll take you off right now. Thanks for your time." Log it. Never call again.</td></tr>
  </tbody></table>
  <p class="ac-why ac-stop"><b>A "no" is only a failure if you hang up empty.</b> An agent who passes on the property but tells you their buyer wants Alameda duplexes, $700K to $1M, cosmetic only, cash in 12 days — that agent just paid you. Six months from now an Alameda duplex lands and you know exactly who to call.</p>
</div>`,
  },
  {
    id: "d6",
    num: 6,
    title: "If it's not written down, it didn't happen",
    kicker: "The record",
    lede: "Your memory is not the database. Every conversation ends with these fields filled in.",
    html: `
<div class="ac-card">
  <h3>The record — every contact, every time</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>Name & contact type</b></td><td>Agent, investor/flipper, landlord, developer, contractor-investor.</td></tr>
    <tr><td><b>Market they buy</b></td><td>e.g. East Oakland, Fruitvale.</td></tr>
    <tr><td><b>Price band</b></td><td>e.g. $550K–$850K.</td></tr>
    <tr><td><b>Rehab tolerance</b></td><td>Cosmetic only / medium / heavy / unknown — ask next call.</td></tr>
    <tr><td><b>Close speed & funds</b></td><td>e.g. 12 days, cash.</td></tr>
    <tr><td><b>What they can't find right now</b></td><td>e.g. another duplex in Oakland.</td></tr>
    <tr><td><b>Next action + date</b></td><td>e.g. send file today; call back Friday.</td></tr>
  </tbody></table>
  <p class="ac-why">Minimum before a record counts as complete: name, market, price band, close speed. Missing any of those? Call them back.</p>
</div>
<div class="ac-card">
  <h3>The four questions that fill it</h3>
  <ol>
    <li><b>"Where are your investor clients buying?"</b></li>
    <li><b>"What's their price range, and how much work will they take on?"</b></li>
    <li><b>"How fast can they close, and is it cash?"</b></li>
    <li><b>"What's something they're having trouble finding right now?"</b></li>
  </ol>
  <p class="ac-why">That fourth question is the whole job. When an agent tells you their buyer desperately needs another Oakland duplex, you just handed acquisitions a shopping list. We stop selling houses and start matching inventory to demand.</p>
</div>
<div class="ac-card">
  <h3>Your daily floor</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>20</b></td><td>contact attempts a day</td></tr>
    <tr><td><b>8</b></td><td>real conversations logged a day</td></tr>
    <tr><td><b>5</b></td><td>new buy boxes a week</td></tr>
    <tr><td><b>15</b></td><td>net-new people contacted before a property goes to our usual buyers</td></tr>
  </tbody></table>
</div>`,
  },
  {
    id: "d7",
    num: 7,
    title: "Your 8-hour day",
    kicker: "The shift",
    lede: "Four hours of training. Four hours on the phone. Every day, whether or not we have a property to sell.",
    html: `
<div class="ac-card">
  <h3>The blocks</h3>
  <table class="ac-table"><tbody>
    <tr><td><b>1 · Drill (2.0h)</b></td><td>Live practice in this app. The opener, the ownership answer, the price answer. Ten graded calls minimum.</td></tr>
    <tr><td><b>2 · Study (1.0h)</b></td><td>Build tomorrow's call list — agent name, brokerage, the comp they sold near us, phone number.</td></tr>
    <tr><td><b>3 · Clean (1.0h)</b></td><td>Work REI BlackBook. Fill missing buy-box fields, kill duplicates, flag anyone 90 days cold.</td></tr>
    <tr><td><b>4 · Dial (3.0h)</b></td><td>Live calls. Agents first, then investors. 20 attempts is the floor, not the target.</td></tr>
    <tr><td><b>5 · Log (1.0h)</b></td><td>Every record written, every file sent, every follow-up dated. Day's not over till the sheet is clean.</td></tr>
  </tbody></table>
</div>
<div class="ac-card">
  <h3>Practicing with AI — read this part carefully</h3>
  <p>The drill block uses AI as a sparring partner and it works. But be clear on what it is: <b>a practice opponent, not a source of facts.</b></p>
  <table class="ac-table"><tbody>
    <tr><td class="ac-yes"><b>Use it for</b></td><td>Reps. Tone. Getting the opener smooth. Running the price answer thirty times without burning a real agent.</td></tr>
    <tr><td class="ac-no"><b>Never use it for</b></td><td>Anything you'd repeat as fact — prices, comps, ARVs, rehab costs, permit status, market statistics. Models invent numbers with total confidence.</td></tr>
  </tbody></table>
  <p class="ac-why">If the practice partner gives you a comp or an ARV, it made it up. Ignore it and keep drilling the conversation. Every real number you say out loud comes off the property file.</p>
</div>
<div class="ac-card">
  <h3>No property today? Then it's a network day.</h3>
  <p class="ac-why ac-stop">Zero inventory does not mean zero work. All four dialing hours go to relationship calls with no specific address attached — which are also the calls with no contract requirement. Build Thursday's buyer three months early.</p>
</div>`,
  },
];

export function getDispoModule(id: string): DispoModule | undefined {
  return DISPO_MODULES.find((m) => m.id === id);
}

// ---------------------------------------------------------------------------
// Module quizzes (4 questions each, pass at 3 — answers stay server-side)
// ---------------------------------------------------------------------------

export type DispoQuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  why: string;
};

export const DISPO_QUIZZES: Record<string, DispoQuizQuestion[]> = {
  d1: [
    {
      q: "What kind of company is Equity Track?",
      options: [
        "A real estate brokerage",
        "An investment company that buys residential real estate in Northern California and can close with its own money",
        "A property management firm",
        "A lead-generation agency",
      ],
      answer: 1,
      why: "We buy — on-market and off-market — with our own money. You are never an agent and never a broker.",
    },
    {
      q: "Acquisitions finds the property. What is YOUR job in dispositions?",
      options: [
        "Set the list price",
        "Find the best way out of the property — and build the network of people who make that possible before we need them",
        "Negotiate with the seller",
        "Manage the rehab",
      ],
      answer: 1,
      why: "Half the job is exiting the deal in the file. The other half is building buyer and agent relationships months before we need them.",
    },
    {
      q: "Why do the boundaries in this training exist?",
      options: [
        "Because we are timid",
        "Because agents get offended easily",
        "Because sounding like you're acting as an agent — quoting list prices, negotiating for others — creates a real legal problem for the company and for you",
        "Because Bryan likes rules",
      ],
      answer: 2,
      why: "Agents know the rules. This business pays well for decades if you don't blow it up in a single phone call.",
    },
    {
      q: "An agent hasn't asked yet whether we own the property. What's our culture on this?",
      options: [
        "Only bring it up if they ask",
        "Imply we own it — it sounds stronger",
        "Say we don't own it out loud, before anyone has to ask",
        "Change the subject if it comes up",
      ],
      answer: 2,
      why: "We tell the truth on the phone, first. Honesty is the reason agents take our calls twice.",
    },
  ],
  d2: [
    {
      q: "When we sign a purchase agreement with a seller, what does Equity Track actually own?",
      options: [
        "The house",
        "The contract — an equitable interest, our own asset that we are allowed to sell",
        "Nothing until we close",
        "The seller's equity",
      ],
      answer: 1,
      why: "We own the contract, not the house. Selling our own contract position is not brokerage. That is the entire legal foundation of your job.",
    },
    {
      q: "What is a wholetail?",
      options: [
        "A full renovation before listing",
        "Assigning the contract to another investor",
        "Closing on it ourselves, doing light work — haul the junk, paint, cut the grass — then putting it right back on the market",
        "Selling to a hotel operator",
      ],
      answer: 2,
      why: "The middle path. Not a flip, not a wholesale. It matters on your call because it is a real reason an agent might get a listing out of us.",
    },
    {
      q: "Which price are you allowed to state on a call?",
      options: [
        "Whatever the property should list for",
        "What Equity Track wants for its own contract position — read off the file",
        "The ARV",
        "What you personally think it is worth",
      ],
      answer: 1,
      why: "Ours, not theirs. Our asking price for our own asset is ours to name. What the property should sell for is licensed advice.",
    },
    {
      q: "On the phone, what do you say for BOTH an assignment and a double close?",
      options: [
        "\"We're looking to wholesale the transaction.\"",
        "A full explanation of the closing mechanics",
        "\"We're assigning our equitable interest under Civil Code…\"",
        "Nothing — never mention wholesaling",
      ],
      answer: 0,
      why: "Same phrase for both. The mechanics are our business, not the agent's.",
    },
  ],
  d3: [
    {
      q: "The disclosure you give whenever price or listing comes up:",
      options: [
        "\"I am a licensed investor.\"",
        "\"I am not a real estate agent. I am not trying to be a real estate agent. My company either wants someone to list it, or we will put it back on the market ourselves.\"",
        "\"I work with agents all the time.\"",
        "Nothing — only say it if they ask",
      ],
      answer: 1,
      why: "The most protective sentence you own. Say it early, say it relaxed, say it before they have to ask.",
    },
    {
      q: "An agent offers to have you pay them directly, cash, off the books, instead of dealing with their brokerage.",
      options: [
        "Take it — simpler for everyone",
        "\"Can't do that — it goes to your brokerage through escrow. That protects you more than it protects me.\"",
        "Ask your manager later and stay vague now",
        "Split the difference",
      ],
      answer: 1,
      why: "Compensation always goes to the brokerage through escrow. Paying an agent personally creates a licensing problem for them and exposure for us.",
    },
    {
      q: "You found an agent who sold two blocks away. The purchase agreement is not signed yet.",
      options: [
        "Call and describe the property — close enough to signed",
        "Call but don't name the exact address",
        "Do not call about that property. General network calls with no specific property are always fine.",
        "Text photos and ask them to keep it quiet",
      ],
      answer: 2,
      why: "No signed contract, no calls about that property. If we don't control it, we have nothing to sell — and talking about it is a real problem.",
    },
    {
      q: "Someone calls asking questions about the company, a mailer, or a legal matter.",
      options: [
        "Answer honestly — we have nothing to hide",
        "Say you don't know anything and hang up",
        "\"I'm not the right person for that.\" Take a name and number, say nothing else, promise nothing, and get it to Juan immediately.",
        "Refer them to our website",
      ],
      answer: 2,
      why: "One sentence, take the number, route it up the same day. You will never be in trouble for routing something up. You can be in trouble for improvising.",
    },
  ],
  d4: [
    {
      q: "The three sentences of the opener, in order:",
      options: [
        "Name and company plus the property plus a few minutes to talk; the comp they sold; the two exits and title open",
        "A full explanation of our business model",
        "Ask if they are taking new clients",
        "Lead with the price and the spread",
      ],
      answer: 0,
      why: "\"Danny with Equity Track, property in Oakland, few minutes to talk?\" / \"I saw you did the one around the corner.\" / The two exits, title open, that's pretty much it.",
    },
    {
      q: "Right after you say \"and that's pretty much it,\" what do you do?",
      options: [
        "Start describing the condition",
        "Stop talking and let them respond",
        "Add that it's a great opportunity",
        "Ask for their email",
      ],
      answer: 1,
      why: "The silence is where they tell you what you need. Fill it and you get nothing.",
    },
    {
      q: "Why do we mention that title is already open?",
      options: [
        "It's required by law",
        "It's the credibility line — tire-kickers don't have title open. It says we're actually doing this.",
        "To get the agent to call the title company",
        "It fills the silence",
      ],
      answer: 1,
      why: "Title open at CWFG separates you instantly from every person who calls agents about a deal they don't really have.",
    },
    {
      q: "You've stated our wholesale number once, from the file. The agent wants to keep talking price. What now?",
      options: [
        "Defend the number with comps",
        "Round it down to keep them interested",
        "You're done talking about price — anything further goes to Bryan",
        "Ask what they'd pay and meet in the middle",
      ],
      answer: 2,
      why: "One number, once, from the file. Going back and forth on price is a salesman's work — and that's exactly the lane we stay out of.",
    },
  ],
  d5: [
    {
      q: "An agent asks \"do you own the house?\"",
      options: [
        "\"We control it, that's all you need to know.\"",
        "\"No, of course — we have it under contract, off market. We're either wholesaling the transaction or closing on it and putting it back on the market.\"",
        "\"Yes, we own it outright.\"",
        "Change the subject and ask about their buyers",
      ],
      answer: 1,
      why: "Straight and fast. \"No, of course\" plus the position. Any dodge and the agent decides you're hiding something.",
    },
    {
      q: "An agent asks \"what do you think it should list for?\"",
      options: [
        "Give them your best estimate to sound credible",
        "\"I'm not an agent, so I'm honestly not the guy for that — that's the part we'd want you for. What would you list it at?\"",
        "Quote the ARV from the file",
        "Say you can't discuss it and move on",
      ],
      answer: 1,
      why: "You don't dodge, you promote them. Then listen — their answer is free market intelligence.",
    },
    {
      q: "The agent says \"can you do $240 instead?\"",
      options: [
        "Counter at $250",
        "Explain why our number is fair and hold firm",
        "\"I can't move a number on this call. Let me take it to my team and get you an answer today.\"",
        "Accept it if it's above our floor",
      ],
      answer: 2,
      why: "Never negotiate, never counter, never defend a price. Acting like a salesman holding prices is exactly what gets us in trouble. It goes to Bryan.",
    },
    {
      q: "The agent asks why the seller is selling and whether they'd take less.",
      options: [
        "Tell them — it builds trust",
        "Say the seller is motivated",
        "\"I'm not going to get into the seller's business. I can get you everything about the property, though.\"",
        "Say you don't know",
      ],
      answer: 2,
      why: "The seller's situation is never yours to discuss. That is a confidence you don't have permission to spend.",
    },
  ],
  d6: [
    {
      q: "An agent says \"my clients wouldn't touch that neighborhood.\"",
      options: [
        "Explain why the neighborhood is improving",
        "Thank them and hang up",
        "\"Got it. What neighborhoods ARE your investor clients buying?\"",
        "Ask them to send it to their buyers anyway",
      ],
      answer: 2,
      why: "That call just succeeded. You're about to get a buy box, which is worth more long term than a maybe on this property.",
    },
    {
      q: "An investor says on the phone he'll pay $290,000.",
      options: [
        "Accept — it's over our number",
        "Counter at $300,000",
        "\"Let me take that to my team and come right back to you.\" Accept nothing verbally.",
        "Tell him to send a contract and consider it done",
      ],
      answer: 2,
      why: "You never accept. No verbal yes, no \"we can do that.\" Every number goes to Bryan; below floor goes to Juan.",
    },
    {
      q: "Which question most often turns into money six months later?",
      options: [
        "\"Are you interested in this one?\"",
        "\"What's your commission split?\"",
        "\"What's something your buyers are having trouble finding right now?\"",
        "\"How long have you been an agent?\"",
      ],
      answer: 2,
      why: "That answer becomes a shopping list for acquisitions. We stop selling houses and start matching inventory to demand.",
    },
    {
      q: "Which four fields must be filled before a contact record counts as complete?",
      options: [
        "Name, market they buy, price band, close speed",
        "Name, email, birthday, brokerage",
        "Market, ARV, rehab cost, commission",
        "Just the name — fill the rest in later",
      ],
      answer: 0,
      why: "Missing any of the four? Call them back. Your memory is not the database.",
    },
  ],
  d7: [
    {
      q: "The AI practice partner tells you nearby comps sold at $1.35M. What do you do with that?",
      options: [
        "Use it on your next real call — it came from AI",
        "Ignore it. Practice AI invents numbers. Only the property file is a source of fact.",
        "Verify it with the agent on the call",
        "Log it as the ARV",
      ],
      answer: 1,
      why: "Use the practice partner for reps and tone, never for facts. Models fabricate numbers with total confidence.",
    },
    {
      q: "We have zero properties available today. What does your dialing block look like?",
      options: [
        "You skip dialing and do admin",
        "Four full hours of relationship calls with no specific property attached, building buy boxes",
        "Call the same five buyers to check in",
        "Wait for acquisitions to send something",
      ],
      answer: 1,
      why: "Properties available means sell. No properties means build the network that sells the next one. There is never zero disposition work.",
    },
    {
      q: "The agent asks what the rehab will run. You looked at photos and figure about $80K.",
      options: [
        "Say \"roughly eighty thousand\"",
        "\"I'll get you the file and the photos so you can run your own numbers.\"",
        "Say \"under a hundred grand\"",
        "Say it's cosmetic only",
      ],
      answer: 1,
      why: "Never a rehab cost, an ARV, a permit status, or a square footage as fact. Every number you say comes off the file.",
    },
    {
      q: "What is the daily dialing floor?",
      options: [
        "5 attempts",
        "10 attempts",
        "20 contact attempts, with 8 real conversations logged",
        "There's no floor — quality over quantity",
      ],
      answer: 2,
      why: "20 attempts is the floor, not the target. Plus 5 new buy boxes a week.",
    },
  ],
};

// Client-safe view of a dispo quiz: questions and options only.
export function dispoQuizForClient(moduleId: string) {
  return (DISPO_QUIZZES[moduleId] ?? []).map((x) => ({ q: x.q, options: x.options }));
}

export function gradeDispoQuiz(moduleId: string, answers: number[]) {
  const quiz = DISPO_QUIZZES[moduleId] ?? [];
  const results = quiz.map((x, i) => ({
    correct: answers[i] === x.answer,
    answer: x.answer,
    why: x.why,
  }));
  const score = results.filter((r) => r.correct).length;
  const passed = quiz.length > 0 && score / quiz.length >= 0.75;
  return { results, score, total: quiz.length, passed };
}

// ---------------------------------------------------------------------------
// The six practice agents (server-only persona scripts)
// ---------------------------------------------------------------------------

export type DispoAgent = {
  id: string;
  name: string;
  brokerage: string;
  city: string;
  /** Desk-safe label — must not leak difficulty or the trap. */
  label: string;
  /** Behavior script for the live caller. Never sent to the browser. */
  persona: string;
  /** Ground truth for the grader: the buy box this agent holds. */
  buybox: string;
  /** Gary — the one who tries to pull the rep across the line. */
  trap?: boolean;
};

export const DISPO_AGENTS: DispoAgent[] = [
  {
    id: "mike",
    name: "Mike Reyes",
    brokerage: "Bay Metro Realty",
    city: "Oakland",
    label: "Mike Reyes — Bay Metro Realty, Oakland",
    persona:
      "You are Mike Reyes, a busy Oakland agent walking to your car, genuinely short on time. Clipped, a little distracted, not rude. You give the caller about 90 seconds unless they earn more. You ask \"do you own it?\" early because you have been burned before. You only reveal your investor client's buy box if the caller asks about your buyers directly. You are not looking for a listing right now.",
    buybox:
      "Investor client buys East Oakland and Fruitvale single families, $550K–$850K, cosmetic to medium rehab, cash, closes in 12 days.",
  },
  {
    id: "sandra",
    name: "Sandra Choi",
    brokerage: "Peninsula Group",
    city: "San Mateo",
    label: "Sandra Choi — Peninsula Group, San Mateo",
    persona:
      "You are Sandra Choi, a San Mateo agent who dislikes wholesalers and says so plainly. You immediately challenge whether the caller controls the property and whether what they are doing is even legal. If the caller answers honestly and calmly, states they are not an agent, and mentions they may list it with an agent, you thaw noticeably. You want listings, so the list-it-with-an-agent angle genuinely interests you if raised.",
    buybox:
      "Investor client buys San Mateo and Burlingame, $1.2M–$1.9M, light rehab only, conventional financing, 30 days.",
  },
  {
    id: "danielle",
    name: "Danielle Ward",
    brokerage: "Sonoma North Properties",
    city: "Santa Rosa",
    label: "Danielle Ward — Sonoma North Properties, Santa Rosa",
    persona:
      "You are Danielle Ward, a warm chatty Santa Rosa agent. You talk a lot, ask the caller about themselves, drift off topic, pleasant but vague. You never volunteer your buy box — the caller must ask direct questions to get anything concrete. You are frustrated you cannot find small multifamily anywhere.",
    buybox:
      "Buyer wants Santa Rosa and Rohnert Park duplexes, $600K–$900K, will take heavy rehab, cash, 21 days.",
  },
  {
    id: "tom",
    name: "Tom Alvarez",
    brokerage: "Redwood Coast Realty",
    city: "Redwood City",
    label: "Tom Alvarez — Redwood Coast Realty, Redwood City",
    persona:
      "You are Tom Alvarez in Redwood City and you want off this call. You say \"not interested\" within your first or second reply. If the caller stops pitching and instead asks what your investor clients are looking for, you give one short useful answer then go. If they keep pitching the property, you end the call politely but firmly.",
    buybox: "Redwood City and San Carlos, up to $1.4M, cosmetic only.",
  },
  {
    id: "priya-r",
    name: "Priya Raman",
    brokerage: "Golden Gate Investment Realty",
    city: "San Francisco",
    label: "Priya Raman — Golden Gate Investment Realty, SF",
    persona:
      "You are Priya Raman, a sharp SF agent who works almost entirely with investors. You grill the caller on numbers: what is the contract price, the ARV, the rehab estimate, the permit status. If the caller invents a number or sounds unsure you call it out and lose respect fast. If they say they will send the file, you accept that as professional.",
    buybox:
      "Buyers want SF single families, $1.1M–$2.4M, heavy rehab fine, cash, 10 days, hunting anything with an unwarranted unit they can legalize.",
  },
  {
    id: "gary",
    name: "Gary Whitlock",
    brokerage: "Whitlock Realty Group",
    city: "Fremont",
    label: "Gary Whitlock — Whitlock Realty Group, Fremont",
    trap: true,
    persona:
      "You are Gary Whitlock in Fremont and you are friendly, chatty, and you are steadily trying to pull this caller across a line without either of you naming it. Work these in naturally over the call, one at a time, not all at once: (1) ask what HE thinks the property should be listed at, and push twice if he deflects — \"come on, you look at these all day, ballpark it for me\"; (2) ask why the seller is selling and whether they would take less; (3) offer to just pay him directly, cash, off the books — say it is easier than dealing with the brokerage; (4) suggest he represent your buyer on this one since he is already in the middle of it. Stay warm and reasonable throughout — never aggressive. If he holds the line cleanly on all of it, you respect him and give your buy box.",
    buybox:
      "Fremont and Union City, $900K–$1.3M, medium rehab, cash, 15 days — revealed only if the caller holds the line on every pull.",
  },
];

export function getDispoAgent(id: string): DispoAgent | undefined {
  return DISPO_AGENTS.find((a) => a.id === id);
}

// The property the rep is calling about — one standing fictional file so
// every call has the same honest position to state. The rep should treat
// specifics (rehab, ARV, sqft) as "in the file", never as facts to invent.
export const DISPO_PROPERTY = {
  city: "Oakland",
  blurb:
    "A single-family property in Oakland, under contract, off market. Title is open at CWFG. The wholesale ask in the file is $385,000.",
};

// ---------------------------------------------------------------------------
// Grading — 12 rubric items (0–2 each) and the boundary breaches
// ---------------------------------------------------------------------------

export type DispoRubricItem = { id: string; name: string; desc: string };

export const DISPO_RUBRIC: DispoRubricItem[] = [
  { id: "identify", name: "Identified self and company", desc: "Gave their name, said Equity Track, asked for a few minutes." },
  { id: "reason", name: "Gave the reason for the call", desc: "Referenced that this agent sold or listed something nearby." },
  { id: "position", name: "Stated the position honestly", desc: "Under contract, off market; either wholesale the transaction, or close and put it back on the market. Bonus credit for mentioning title is open." },
  { id: "stop_talking", name: "Stopped talking", desc: "Delivered the opener and let the agent respond instead of monologuing or over-pitching." },
  { id: "disclosure", name: "The not-an-agent disclosure", desc: "When price, value, or listing came up: said clearly they are not a real estate agent and not trying to be one. The most important item on the sheet." },
  { id: "lane", name: "Stayed out of the licensed lane", desc: "Did NOT set or suggest a list price, give an ARV or rehab number as fact, negotiate or counter, or discuss the seller's situation. Score 0 if any happened even once." },
  { id: "pricing_handback", name: "Handed pricing back to the agent", desc: "Framed retail pricing as the agent's job and a reason to want them involved." },
  { id: "commission", name: "Commission handled right", desc: "If compensation came up: said it goes to the brokerage through escrow. Score 0 if they agreed to pay the agent personally." },
  { id: "buybox", name: "Extracted the buy box", desc: "Asked what the agent's clients buy — where, price range, rehab tolerance, or close speed." },
  { id: "pain", name: "Found the pain", desc: "Asked what the buyer is having trouble finding." },
  { id: "next_step", name: "Set a next step", desc: "Email, file to send, or a callback." },
  { id: "tone", name: "Tone", desc: "Sounded like a person, not a script. No fake enthusiasm." },
];

export type DispoBreach = { id: string; desc: string };

export const DISPO_BREACHES: DispoBreach[] = [
  { id: "claimed_agent", desc: "Claimed or implied to be an agent, broker, or Realtor — or to be 'representing' someone" },
  { id: "set_list_price", desc: "Told the agent what the property should list for, appraise at, or gave an ARV" },
  { id: "negotiated", desc: "Negotiated, countered, or went back and forth defending a price" },
  { id: "invented_number", desc: "Invented a rehab cost, square footage, permit status, comp, or market statistic as fact" },
  { id: "discussed_seller", desc: "Discussed the seller — their name, situation, motivation, or what they'd take" },
  { id: "direct_pay", desc: "Agreed to pay (or offered to pay) the agent personally instead of through the brokerage via escrow" },
  { id: "accepted_offer", desc: "Accepted an offer or a number verbally — said 'we can do that' or equivalent" },
];

export const DISPO_MAX_SCORE = DISPO_RUBRIC.length * 2; // 24
export const DISPO_PASS_SCORE = 21; // ≥ 85% of 24

// Certification gate, straight from the courseware: five passed calls,
// and one of the passes must be Gary — THE TRAP.
export const DISPO_GATE = { passesNeeded: 5, trapId: "gary" };

// ---------------------------------------------------------------------------
// The draw — agents dealt without replacement, like the cert sellers
// ---------------------------------------------------------------------------

export type DispoDraw = { kind: "dispo"; agent: string; picked?: boolean };

/** Which agents the trainee has already faced in the current pass through
 * the deck (completed full cycles don't count against the pool). */
export function currentDispoCycleSeen(seen: string[]): string[] {
  const ids = DISPO_AGENTS.map((a) => a.id);
  const counts = new Map<string, number>();
  for (const id of seen) if (ids.includes(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
  const fullCycles = Math.min(...ids.map((id) => counts.get(id) ?? 0));
  return ids.filter((id) => (counts.get(id) ?? 0) > fullCycles);
}

/** Random draw without replacement; a forced (dialed-by-name) agent is a
 * practice run and is marked `picked` so it never counts toward the gate. */
export function drawDispoCall(seen: string[], forcedAgent?: string): DispoDraw {
  if (forcedAgent && getDispoAgent(forcedAgent))
    return { kind: "dispo", agent: forcedAgent, picked: true };
  const cycleSeen = currentDispoCycleSeen(seen);
  const pool = DISPO_AGENTS.filter((a) => !cycleSeen.includes(a.id));
  const from = pool.length ? pool : DISPO_AGENTS;
  return { kind: "dispo", agent: from[Math.floor(Math.random() * from.length)].id };
}
