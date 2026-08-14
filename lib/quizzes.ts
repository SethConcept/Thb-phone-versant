// Module quizzes — 4 questions each, pass at 3/4, instantly retakeable.
// Answer keys live server-side only: the module page ships question text and
// options; grading happens in /api/learn/quiz.

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number; // index into options — NEVER send to the client
  why: string;    // shown after grading
};

export const QUIZ_PASS_RATIO = 0.75;

export const QUIZZES: Record<string, QuizQuestion[]> = {
  m1: [
    {
      q: "Every good call ends with…",
      options: [
        "A price the seller is happy with",
        "A next step the seller agreed to — a handoff, two named times, or a polite goodbye",
        "A promise that Juan will call back soon",
        "As much information as possible, even if the seller got impatient",
      ],
      answer: 1,
      why: "The call's job is one agreed step forward. Nobody is kept on the line, and nobody hangs up without knowing what happens next.",
    },
    {
      q: "Who takes a qualified seller who is ready to talk price right now?",
      options: ["Whoever answered the phone", "Juan, always", "Cherry — the closer, live if she's on shift", "Nobody — book an appointment instead"],
      answer: 2,
      why: "Qualified plus a closer on shift means a live handoff to Cherry. You qualify and build trust; she closes.",
    },
    {
      q: "A caller asks why Juan is out at properties instead of in an office. That's…",
      options: [
        "Something to apologize for",
        "A strength to say with confidence — he's a licensed contractor looking at real houses",
        "A reason to change the subject",
        "Something to deny",
      ],
      answer: 1,
      why: "Juan in the field is the pitch, not a weakness: the person pricing your house is a licensed contractor standing in real houses all day.",
    },
    {
      q: "What is 'the most expensive thing in this company'?",
      options: ["Juan's truck", "The TV advertising", "A ringing phone nobody answers", "The office in San Carlos"],
      answer: 2,
      why: "Every ring is paid-for advertising reaching a live seller. Answer fast, and log even the calls you miss.",
    },
  ],
  m2: [
    {
      q: "When does the recording disclosure happen?",
      options: ["Only if the caller asks", "After you take their address", "In the opening, before you collect anything", "At the end of the call"],
      answer: 2,
      why: "California requires everyone on the call to know. It goes in the open, before any seller information — leaving it out is an automatic fail.",
    },
    {
      q: "A caller asks where you are located. You say:",
      options: [
        "Where you're actually sitting",
        "\"I'm in California\"",
        "\"Our office is in San Carlos — 170 Glenn Way. I'm on Juan's team.\"",
        "Change the subject politely",
      ],
      answer: 2,
      why: "True, specific, about the company. Never state or imply your own location either way — that includes claiming to be in California.",
    },
    {
      q: "Which name do you answer with?",
      options: ["An easy American nickname", "Your real first name", "Just 'Twin Home Buyer'", "Juan's name"],
      answer: 1,
      why: "Your real first name, said with confidence. Never an alias.",
    },
    {
      q: "Why does 'how did you come across us?' matter so much?",
      options: [
        "It breaks the ice",
        "It tells us which advertising earned the call — typed in the caller's exact words",
        "It's required by California law",
        "It helps qualify the seller's motivation",
      ],
      answer: 1,
      why: "We promised our advertising provider a person listens to every call and credits the channel that earned it. Type their words, not your interpretation.",
    },
  ],
  m3: [
    {
      q: "A caller asks what similar houses in her area sold for. What do you say?",
      options: [
        "Pull up Redfin and give her a general range",
        "\"A number without seeing the house isn't worth much to you\" — then advance",
        "Tell her Zillow is usually wrong",
        "Give a low number so she isn't disappointed later",
      ],
      answer: 1,
      why: "Never a figure, a range, or a comp. The seller anchors on whatever you say and Juan looks dishonest when he prices the real house.",
    },
    {
      q: "A seller asks whether there are any fees.",
      options: [
        "\"Zero fees — the offer is the number on your check\"",
        "\"No commission and we cover standard closing costs, but anything owed on the property still comes out of the sale\"",
        "\"About 1 or 2 percent\"",
        "\"Juan will explain it, I'm not sure\"",
      ],
      answer: 1,
      why: "The first answer is untrue for anyone with a loan or a lien, and it's exactly the sort of claim that comes back at us.",
    },
    {
      q: "A caller says your letter quoted a different amount than expected.",
      options: [
        "Explain how the estimate was calculated",
        "Apologize and offer a new number",
        "Stop, take their number, route it, say the right person will call",
        "Ask them to send you the letter",
      ],
      answer: 2,
      why: "Hard stop, every time. Do not engage the difference, do not explain, do not speculate.",
    },
    {
      q: "A seller says they might wait a year. What's the move?",
      options: [
        "\"The number today might not be the number next month\"",
        "\"The market is cooling — waiting could cost you\"",
        "Respect the timeline; never manufacture urgency — theirs is real or it isn't",
        "Book the appointment anyway to lock them in",
      ],
      answer: 2,
      why: "Manufactured urgency is banned. Real urgency comes from the seller's situation, not from us.",
    },
  ],
  m4: [
    {
      q: "What does S·P·C·T·A stand for, in order?",
      options: [
        "Situation, Property, Condition, Timing, Appointment",
        "Seller, Price, Contract, Title, Agreement",
        "Situation, Price, Condition, Terms, Appointment",
        "Source, Property, Condition, Timing, Agreement",
      ],
      answer: 0,
      why: "Five moves in a natural order — a shape, not a form to fill.",
    },
    {
      q: "How does price come up on your call?",
      options: [
        "You open with your best estimate",
        "It rides inside the conversation: \"Do you have a number you'd feel comfortable with?\" — if they won't answer, move on",
        "You never mention the word price at all",
        "You quote a range and let Juan refine it",
      ],
      answer: 1,
      why: "You may ASK their number — you never GIVE one. If they won't share, Juan handles it at the house.",
    },
    {
      q: "\"Is anyone living there, or is it empty?\" — why ask?",
      options: [
        "To estimate utility costs",
        "Vacant usually means motivated; tenants mean complications",
        "To know how many keys to bring",
        "It's required for the CRM",
      ],
      answer: 1,
      why: "Occupancy is one of the strongest motivation signals on the call.",
    },
    {
      q: "\"Are you the only owner, or is someone else part of the decision?\" catches…",
      options: [
        "Nosy neighbors",
        "Probate, siblings, an ex-spouse — everyone who needs to be at the visit",
        "Whether they can afford to sell",
        "Nothing important — skip it if the call is going long",
      ],
      answer: 1,
      why: "If someone else is on title, the visit needs everyone there — or the deal dies later.",
    },
  ],
  m5: [
    {
      q: "A caller insists on speaking to Juan and won't discuss the house.",
      options: [
        "Refuse until they answer your questions",
        "Take their best number, route to Cherry with a warm intro",
        "Tell them Juan takes every call personally",
        "Promise Juan calls back in 15 minutes",
      ],
      answer: 1,
      why: "Don't hold him hostage behind qualification, and don't make promises about his time you can't keep.",
    },
    {
      q: "A seller wants a million and Zillow says 1.2. You say:",
      options: [
        "\"Zillow is wrong most of the time\"",
        "\"Okay. How did you arrive at that number?\"",
        "\"The market has softened\"",
        "\"A house nearby just sold for less\"",
      ],
      answer: 1,
      why: "Never react, never counter, never cite a nearby sale. Question the source and listen.",
    },
    {
      q: "\"Just email me the offer.\" What's wrong with illustrating your answer with \"what if I said $400,000…\"?",
      options: [
        "Nothing — it's hypothetical",
        "It's a named dollar amount, which is banned even as a hypothetical",
        "It's too low",
        "Email offers are fine if the seller asks",
      ],
      answer: 1,
      why: "Any dollar amount anchors the seller — hypothetical or not. That's the exact mistake the rule exists for.",
    },
    {
      q: "\"I'm just looking\" means:",
      options: [
        "A bad lead — politely end the call",
        "Ask how long they've been thinking about it, and what's making them consider it now",
        "Send them a brochure",
        "Push for the appointment before they hang up",
      ],
      answer: 1,
      why: "That's where the real reason appears. Two years of thinking plus a reason to call today is a real seller.",
    },
  ],
  m6: [
    {
      q: "\"My mother passed and the house is in probate.\" What matters most first?",
      options: [
        "The asking price",
        "Who is on title and whether all the heirs agree",
        "The condition of the roof",
        "How fast they want to close",
      ],
      answer: 1,
      why: "Title and agreement come before price. Ask where they are in the process and whether there's an attorney.",
    },
    {
      q: "\"There's a tax lien — can you negotiate it down?\"",
      options: [
        "\"Usually we can, yes\"",
        "\"Juan will pull a title report and find out what's actually owed\"",
        "\"Liens kill deals, sorry\"",
        "\"Just don't mention it at closing\"",
      ],
      answer: 1,
      why: "Never promise anything about a lien. You don't know, and it isn't yours to promise.",
    },
    {
      q: "\"My tenants stopped paying. Can I just kick them out? What would you do?\"",
      options: [
        "Explain the eviction process step by step",
        "Ask lease or month-to-month, whether anything's been filed — and give no eviction advice",
        "Tell them Juan only buys empty houses",
        "Recommend a good eviction attorney",
      ],
      answer: 1,
      why: "Gather the facts; never give advice about evictions. Juan buys tenant-occupied properties.",
    },
    {
      q: "\"How fast can you close?\"",
      options: [
        "\"Seven days, guaranteed\"",
        "\"Quick when you need it to be — we work to your timeline. What were you hoping for?\"",
        "\"That depends on the bank\"",
        "\"Thirty days like everyone else\"",
      ],
      answer: 1,
      why: "Never invent a specific number of days. Juan sets the closing date.",
    },
  ],
  m7: [
    {
      q: "A seller mentions her mother died in the house last month.",
      options: [
        "\"I'm sorry. Take your time.\" — then wait",
        "\"I'm sorry — that's exactly why we make this easy\"",
        "Move straight to the condition question",
        "Ask whether probate has started",
      ],
      answer: 0,
      why: "Acknowledge and stop. Never use a death as a bridge into the pitch.",
    },
    {
      q: "The caller barely speaks — short answers, long pauses.",
      options: [
        "Fill the silence with the pitch so it isn't awkward",
        "Open questions, then wait. Silence is not a no.",
        "Assume they're not interested and wrap up",
        "Talk faster to keep their attention",
      ],
      answer: 1,
      why: "Quiet callers disengage when you pitch into their silence. Ask and wait.",
    },
    {
      q: "An older caller keeps asking you to repeat yourself. You:",
      options: [
        "Speak louder and faster to get through it",
        "Slow down, shorten sentences, repeat your name and the company",
        "Offer to email instead",
        "Transfer them immediately",
      ],
      answer: 1,
      why: "Lower your speed when asked to repeat — never raise it. Shorter sentences, name and company twice.",
    },
    {
      q: "\"Is this a scam? How do I know you're real?\"",
      options: [
        "Get defensive — you're not a scammer",
        "Calm facts: company, office address, Juan Diaz the owner, BBB — look us up. And we never ask you for money.",
        "Quote how many deals you've closed this year",
        "Hang up — they're not serious",
      ],
      answer: 1,
      why: "Calm and factual, never defensive. Only cite facts you know are true — never invent deal counts or license numbers.",
    },
  ],
  m8: [
    {
      q: "All four gate items are confirmed and Cherry is on shift. What happens?",
      options: ["Take a message", "Book a callback for tomorrow", "Transfer live to Cherry", "Send it to Juan"],
      answer: 2,
      why: "Qualified plus a closer on shift means a live handoff, not a message.",
    },
    {
      q: "No closer is on shift and the seller is qualified.",
      options: [
        "Say someone will contact them",
        "Offer two specific times and log it",
        "Keep them talking until a closer is free",
        "Tell them to call back",
      ],
      answer: 1,
      why: "Two named times, logged. A promised time is a promise — someone calls at that time.",
    },
    {
      q: "You missed three calls overnight. What do you do?",
      options: [
        "Nothing — there's no contact information",
        "Log each one as a missed call",
        "Wait to see if they call back",
        "Tell the next shift verbally",
      ],
      answer: 1,
      why: "An unlogged missed call is the most expensive call of the day, because we learn nothing from it.",
    },
    {
      q: "A seller says he's not selling and asks you to stop.",
      options: [
        "Try one more time to book",
        "Explain the market may change",
        "Thank him and end the call politely",
        "Ask why not",
      ],
      answer: 2,
      why: "Nobody is kept on the line. Every call ends with something they agreed to — including goodbye.",
    },
  ],
};

// Client-safe view of a quiz: questions and options only.
export function quizForClient(moduleId: string) {
  return (QUIZZES[moduleId] ?? []).map((x) => ({ q: x.q, options: x.options }));
}

export function gradeQuiz(moduleId: string, answers: number[]) {
  const quiz = QUIZZES[moduleId] ?? [];
  const results = quiz.map((x, i) => ({
    correct: answers[i] === x.answer,
    answer: x.answer,
    why: x.why,
  }));
  const score = results.filter((r) => r.correct).length;
  const passed = quiz.length > 0 && score / quiz.length >= QUIZ_PASS_RATIO;
  return { results, score, total: quiz.length, passed };
}
