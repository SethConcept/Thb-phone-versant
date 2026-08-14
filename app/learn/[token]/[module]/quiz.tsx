"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Q = { q: string; options: string[] };
type Result = { correct: boolean; answer: number; why: string };

export default function Quiz({
  token,
  moduleId,
  questions,
}: {
  token: string;
  moduleId: string;
  questions: Q[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null));
  const [results, setResults] = useState<Result[] | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (answers.some((a) => a === null)) {
      setError("Answer every question first.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/learn/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, moduleId, answers }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Could not grade the quiz — try again.");
      return;
    }
    const data = await res.json();
    setResults(data.results);
    setPassed(data.passed);
    setScore(data.score);
    if (data.passed) router.refresh(); // unlock the drill / next module
  }

  function retake() {
    setAnswers(questions.map(() => null));
    setResults(null);
    setPassed(null);
    setError("");
  }

  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const r = results?.[i];
        return (
          <div key={i} className={`quiz-q ${r ? (r.correct ? "right" : "wrong") : ""}`}>
            <div className="quiz-qt">{i + 1}. {q.q}</div>
            {q.options.map((opt, j) => (
              <label key={j} className="quiz-opt">
                <input
                  type="radio"
                  name={`q-${moduleId}-${i}`}
                  checked={answers[i] === j}
                  disabled={!!results}
                  onChange={() => setAnswers((a) => a.map((v, k) => (k === i ? j : v)))}
                />
                <span className={r && r.answer === j ? "quiz-correct" : ""}>{opt}</span>
              </label>
            ))}
            {r && <p className={`quiz-fb ${r.correct ? "ok" : "no"}`}>{r.correct ? "✓ " : "✗ "}{r.why}</p>}
          </div>
        );
      })}

      {error && <p className="small" style={{ color: "var(--red)" }}>{error}</p>}

      {!results ? (
        <button className="btn" onClick={submit} disabled={busy}>
          {busy ? "Grading…" : "Submit answers"}
        </button>
      ) : (
        <div className="row">
          <span className={`pill ${passed ? "pill-green" : "pill-red"}`} style={{ fontSize: 14 }}>
            {score}/{questions.length} — {passed ? "passed" : "not yet"}
          </span>
          {!passed && (
            <button className="btn btn-secondary" onClick={retake}>
              Retake quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}
