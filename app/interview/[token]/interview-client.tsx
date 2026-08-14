"use client";

// Trainee-facing session flow:
// consent -> mic check -> live voice session with Gemini -> done.
//
// Three modes:
//   training — the certification call: one realistic inbound seller call
//              (dealt persona + embedded lines), auto-graded on completion
//   drill    — a 2-4 minute module mini-drill, auto-graded on completion
//   sales    — practice call vs "John" with the script on screen
//
// Audio in:  mic -> AudioContext(16kHz) -> PCM16 -> sendRealtimeInput
// Audio out: model PCM (24kHz) -> queued AudioBuffer playback
// Transcript: input/output transcription events accumulated locally,
//             uploaded with the mic recording (webm) on session end.

import { useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { SELLER_BRAND } from "@/lib/academy";

type Turn = { role: "agent" | "candidate"; text: string; ts: number };
type Stage = "consent" | "miccheck" | "connecting" | "live" | "uploading" | "done" | "error";
type DrillResult = { graded: boolean; pass: boolean; reason: string; summary: string; coaching: string };

const SALES_CAP_MS = 8 * 60 * 1000;
const TRAINING_CAP_MS = 12 * 60 * 1000;
const DRILL_CAP_MS = 5 * 60 * 1000;
const MAX_SALES_ATTEMPTS = 3;

const END_MARKERS = ["TEST COMPLETE", "CALL COMPLETE", "DRILL COMPLETE"];

const STEP_OF: Record<Stage, number> = {
  consent: 1, miccheck: 2, connecting: 3, live: 3, uploading: 4, done: 4, error: 1,
};

// Module-level so React treats it as a stable component — defining it inside
// InterviewClient caused a full remount (and fade-in restart) on every
// mic-level tick, making the page invisible until the meter pinned.
function Shell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <div className="candidate-bg">
      <main className="card candidate-card fade-in">
        <div className="steps" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`step-dot ${step >= n ? "active" : ""}`} />
          ))}
        </div>
        {children}
        <p className="small muted" style={{ marginTop: 22, marginBottom: 0 }}>
          {SELLER_BRAND} · Phone Academy
        </p>
      </main>
    </div>
  );
}

export default function InterviewClient({
  token,
  candidateName,
  attemptsUsed = 0,
  mode = "training",
  script = "",
  drillModule = "",
  drillTitle = "",
  drillIntro = "",
}: {
  token: string;
  candidateName: string;
  attemptsUsed?: number;
  mode?: "training" | "sales" | "drill";
  script?: string;
  drillModule?: string;
  drillTitle?: string;
  drillIntro?: string;
}) {
  const isTraining = mode === "training";
  const isDrill = mode === "drill";
  const [stage, setStage] = useState<Stage>("consent");
  const [error, setError] = useState("");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [drillResult, setDrillResult] = useState<DrillResult | null>(null);
  const [certResult, setCertResult] = useState<DrillResult | null>(null);
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");
  const [micLevel, setMicLevel] = useState(0);
  const [micOk, setMicOk] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const micCheckCleanupRef = useRef<() => void>(() => {});

  const transcriptRef = useRef<Turn[]>([]);
  const sessionRef = useRef<any>(null);
  const interviewIdRef = useRef<string>("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cleanupRef = useRef<() => void>(() => {});
  const endedRef = useRef(false);
  // populated when the Live session errors/closes abnormally, so the final
  // screen can show WHY instead of failing silently
  const failReasonRef = useRef<string>("");
  const flushTurnsRef = useRef<() => void>(() => {});

  // Consent accepted → open the mic and show a live level meter so the
  // trainee can SEE their voice registering before anything counts.
  async function beginMicCheck() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let raf = 0;
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        // quantize so React only re-renders on visible changes, not 60fps
        const level = Math.round(Math.min(1, Math.sqrt(sum / data.length) * 4) * 20) / 20;
        setMicLevel(level);
        if (level > 0.25) setMicOk(true);
        raf = requestAnimationFrame(tick);
      };
      tick();
      micCheckCleanupRef.current = () => {
        cancelAnimationFrame(raf);
        try { src.disconnect(); ctx.close(); } catch {}
      };
      setStage("miccheck");
    } catch {
      setError("Microphone access was blocked. Please allow the microphone and reload this page.");
      setStage("error");
    }
  }

  async function start() {
    micCheckCleanupRef.current(); // stop the meter; keep the stream
    setStage("connecting");
    try {
      // 1. Log consent + get ephemeral token (API key stays server-side)
      const res = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...(isDrill ? { drill: drillModule } : {}) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not start the session");
      }
      const { interviewId, ephemeralToken, model, systemPrompt } = await res.json();
      interviewIdRef.current = interviewId;

      // 2. Mic (already granted during mic check)
      const stream =
        streamRef.current ??
        (await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }));

      // 3. Playback pipeline for model audio (24kHz PCM), plus a mix bus so
      // the recording captures BOTH sides of the conversation
      const playCtx = new AudioContext({ sampleRate: 24000 });
      const mixDest = playCtx.createMediaStreamDestination();
      // mic → mix bus only (NOT to speakers — that would echo)
      playCtx.createMediaStreamSource(stream).connect(mixDest);

      // Record the mixed conversation for admin playback
      const recorder = new MediaRecorder(mixDest.stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.start(1000);
      recorderRef.current = recorder;

      let playhead = 0;
      function playPcm(base64: string) {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const pcm = new Int16Array(bytes.buffer);
        const buf = playCtx.createBuffer(1, pcm.length, 24000);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
        const src = playCtx.createBufferSource();
        src.buffer = buf;
        src.connect(playCtx.destination);
        src.connect(mixDest); // AI voice → recording too
        playhead = Math.max(playhead, playCtx.currentTime);
        src.start(playhead);
        playhead += buf.duration;
        setAgentSpeaking(true);
        src.onended = () => {
          if (playCtx.currentTime >= playhead - 0.05) setAgentSpeaking(false);
        };
      }

      // 4. Connect to Gemini Live with the ephemeral token
      const ai = new GoogleGenAI({
        apiKey: ephemeralToken,
        httpOptions: { apiVersion: "v1alpha" },
      });

      let currentAgent = "";
      let currentCandidate = "";
      const pushTurn = (role: Turn["role"], text: string) => {
        const t = text.trim();
        if (t) transcriptRef.current.push({ role, text: t, ts: Date.now() });
      };
      // flush any partial turn buffers — called on turn completion AND when
      // the session ends, so a mid-goodbye "End" click doesn't lose words
      flushTurnsRef.current = () => {
        pushTurn("candidate", currentCandidate);
        pushTurn("agent", currentAgent);
        currentAgent = "";
        currentCandidate = "";
      };

      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemPrompt,
          // pin ASR to English — prevents auto-detect flipping to other
          // languages on accented speech or echo (Korean/Japanese garbage
          // turns observed in testing)
          speechConfig: { languageCode: "en-US" },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (msg: any) => {
            const sc = msg.serverContent;
            if (!sc) return;
            // audio out
            for (const part of sc.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) playPcm(part.inlineData.data);
            }
            // transcriptions
            if (sc.outputTranscription?.text) currentAgent += sc.outputTranscription.text;
            if (sc.inputTranscription?.text) currentCandidate += sc.inputTranscription.text;
            if (sc.turnComplete) {
              const upperAgent = currentAgent.toUpperCase();
              const agentSaidComplete = END_MARKERS.some((m) => upperAgent.includes(m));
              flushTurnsRef.current();
              // agent signals the scripted end of the session
              if (agentSaidComplete) {
                setTimeout(() => endSession(true), 4000); // let the goodbye finish playing
              }
            }
          },
          onerror: (e: any) => {
            console.error("Live session error:", e);
            failReasonRef.current = e?.message || "connection error";
            endSession(false);
          },
          onclose: (e: any) => {
            console.error("Live session closed:", e?.code, e?.reason);
            if (!failReasonRef.current && e?.reason)
              failReasonRef.current = `closed (${e.code}): ${e.reason}`;
            endSession(false);
          },
        },
      });
      sessionRef.current = session;

      // 5. Stream mic audio as 16kHz PCM16
      const micCtx = new AudioContext({ sampleRate: 16000 });
      const src = micCtx.createMediaStreamSource(stream);
      const proc = micCtx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++)
          i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
        let bin = "";
        const bytes = new Uint8Array(i16.buffer);
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        session.sendRealtimeInput({
          audio: { data: btoa(bin), mimeType: "audio/pcm;rate=16000" },
        });
      };
      src.connect(proc);
      proc.connect(micCtx.destination);

      // Hard cap
      const capTimer = setTimeout(
        () => endSession(true),
        isDrill ? DRILL_CAP_MS : isTraining ? TRAINING_CAP_MS : SALES_CAP_MS
      );

      cleanupRef.current = () => {
        clearTimeout(capTimer);
        try { proc.disconnect(); src.disconnect(); } catch {}
        try { micCtx.close(); playCtx.close(); } catch {}
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
        try { session.close(); } catch {}
      };

      setStage("live");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStage("error");
    }
  }

  async function endSession(completed: boolean) {
    if (endedRef.current) return;
    endedRef.current = true;
    setStage("uploading");
    flushTurnsRef.current();
    // If the examiner already delivered its closing line, this session IS
    // complete — even if the trainee clicked End during the goodbye.
    if (!completed) {
      completed = transcriptRef.current.some(
        (t) =>
          t.role === "agent" &&
          END_MARKERS.some((m) => t.text.toUpperCase().includes(m))
      );
    }
    cleanupRef.current();

    // finish the recording
    const recorder = recorderRef.current;
    const audioBlob: Blob | null = await new Promise((resolve) => {
      if (!recorder || recorder.state === "inactive")
        return resolve(chunksRef.current.length ? new Blob(chunksRef.current, { type: "audio/webm" }) : null);
      recorder.onstop = () =>
        resolve(chunksRef.current.length ? new Blob(chunksRef.current, { type: "audio/webm" }) : null);
      recorder.stop();
    });

    const form = new FormData();
    form.set("interviewId", interviewIdRef.current);
    form.set("transcript", JSON.stringify(transcriptRef.current));
    form.set("completed", String(completed));
    if (notesRef.current.trim()) form.set("notes", notesRef.current.trim());
    if (audioBlob) form.set("audio", audioBlob, "session.webm");

    try {
      const res = await fetch("/api/interviews/complete", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (data?.drill) setDrillResult(data.drill);
      if (data?.cert) setCertResult(data.cert);
    } catch {}
    setStage("done");
  }

  const step = STEP_OF[stage];

  if (stage === "consent")
    return (
      <Shell step={step}>
        <h1 style={{ fontSize: 24 }}>
          {isDrill
            ? `🎙 Voice drill: ${drillTitle}`
            : isTraining
              ? `${SELLER_BRAND} — Phone Certification Test`
              : `${SELLER_BRAND} — Practice Call`}
        </h1>
        {isDrill ? (
          <>
            <p>{drillIntro}</p>
            <p className="small muted">
              Two to four minutes, graded automatically the moment you finish. Run it as many times as you need.
            </p>
          </>
        ) : isTraining ? (
          <>
            <p>
              Hi {candidateName}! This is a certification call — <strong>one real inbound call, about five minutes</strong>. Your line rings, a seller is on it. Answer the phone the way every call must be answered and handle it start to finish, all the way to a next step.
            </p>
            <p className="small muted" style={{ marginTop: 0 }}>
              You won&apos;t know which seller you&apos;re getting — just like the desk. Closed book, graded automatically when you hang up. Certification takes 12 passed calls across 6 different sellers.
            </p>
          </>
        ) : (
          <p>
            Hi {candidateName}! In this exercise <strong>you are the agent</strong> making a follow-up call, and our AI plays <strong>John</strong> — a homeowner who filled out a form about selling his house. Run the call using the script (shown on the next screens). Speak naturally, listen to his answers, and be yourself — John reacts to how you treat him.
          </p>
        )}
        {!isTraining && !isDrill && attemptsUsed > 0 && (
          <p className="notice notice-blue">
            Retake — attempt {attemptsUsed + 1} of {MAX_SALES_ATTEMPTS}.
          </p>
        )}
        <p className="notice notice-amber">
          <strong>This session is recorded</strong> (audio and transcript) and reviewed by the {SELLER_BRAND} team. By clicking below, you consent to the recording.
        </p>
        <p className="small muted">Find a quiet spot and use headphones.</p>
        <button className="btn btn-lg" onClick={beginMicCheck}>I consent — continue to mic check</button>
      </Shell>
    );

  if (stage === "miccheck")
    return (
      <Shell step={step}>
        <h1 style={{ fontSize: 22 }}>Quick mic check</h1>
        <p className="notice notice-blue">
          🎧 <strong>Use headphones or earphones if you can</strong> — speakers can cause the AI to hear itself.
        </p>
        <p>Say something out loud — try <em>&quot;test, one two three&quot;</em> — and watch the bar move:</p>
        <div className="meter">
          <div
            style={{
              width: `${Math.round(micLevel * 100)}%`,
              background: micOk ? "var(--green)" : "var(--brand)",
            }}
          />
        </div>
        <p className="small" style={{ color: micOk ? "var(--green)" : "var(--muted)" }}>
          {micOk ? "✓ We can hear you — you're good to go." : "Waiting to hear you… if the bar never moves, check your mic settings and reload."}
        </p>
        {mode === "sales" && (
          <>
            <details style={{ textAlign: "left", marginTop: 14 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>📄 Review your call script (it stays on screen during the call)</summary>
              <pre className="script-panel">{script}</pre>
            </details>
            <textarea
              className="input"
              rows={4}
              placeholder="Your own notes (optional) — visible during the call, saved with your attempt"
              value={notes}
              onChange={(e) => { setNotes(e.target.value); notesRef.current = e.target.value; }}
              style={{ marginTop: 10, textAlign: "left", resize: "vertical" }}
            />
            <p className="small muted" style={{ margin: "8px 0" }}>
              When you start, John answers the phone — <strong>you speak first</strong>, just like a real call.
            </p>
          </>
        )}
        {isTraining && (
          <p className="small muted" style={{ margin: "8px 0" }}>
            When you start, your line rings — <strong>you answer it and speak first</strong>, exactly like a real inbound call.
          </p>
        )}
        {isDrill && (
          <p className="small muted" style={{ margin: "8px 0" }}>
            The examiner starts the drill as soon as you&apos;re connected.
          </p>
        )}
        <button className="btn btn-lg" disabled={!micOk} onClick={start}>
          {isDrill ? "🎙 Start the drill" : isTraining ? "📞 Take the certification call" : "📞 Call John"}
        </button>
      </Shell>
    );

  if (stage === "connecting")
    return (
      <Shell step={step}>
        <h1 style={{ fontSize: 22 }}>{mode === "sales" ? "Ringing John…" : "Connecting your line…"}</h1>
        <div className="spinner" />
        <p className="muted">{mode === "sales" ? "He usually picks up fast." : isDrill ? "The drill starts as soon as they pick up." : "It rings as soon as you\u2019re connected."}</p>
      </Shell>
    );

  if (stage === "live" && isDrill)
    return (
      <Shell step={step}>
        <div className={`orb ${agentSpeaking ? "orb-speaking" : "orb-listening"}`}>
          {agentSpeaking ? "🗣️" : "🎙️"}
        </div>
        <h1 style={{ fontSize: 20 }}>
          {agentSpeaking ? "Examiner / seller speaking…" : "Your line — speak"}
        </h1>
        <p className="muted small">Drill: {drillTitle}. Graded automatically when it ends.</p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm("End the drill now? An unfinished drill may not be gradeable."))
              endSession(false);
          }}
        >
          End drill early
        </button>
      </Shell>
    );

  if (stage === "live" && isTraining)
    return (
      <Shell step={step}>
        <div className={`orb ${agentSpeaking ? "orb-speaking" : "orb-listening"}`}>
          {agentSpeaking ? "🗣️" : "🎙️"}
        </div>
        <h1 style={{ fontSize: 20 }}>
          {agentSpeaking ? "Seller speaking…" : "Your line — speak"}
        </h1>
        <p className="muted small">Certification call. Handle it start to finish — it ends when the call ends.</p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm("Hang up now? An unfinished call may not be gradeable."))
              endSession(false);
          }}
        >
          Hang up
        </button>
      </Shell>
    );

  if (stage === "live")
    return (
      <div className="candidate-bg">
        <main className="card fade-in" style={{ maxWidth: 1020, width: "100%", padding: 24 }}>
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 400px", minWidth: 300, textAlign: "left" }}>
              <h2 style={{ fontSize: 14, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: ".05em", color: "var(--muted)" }}>📄 Script</h2>
              <pre className="script-panel">{script}</pre>
            </div>
            <div style={{ flex: "1 1 300px", minWidth: 280, textAlign: "center" }}>
              <div className={`orb ${agentSpeaking ? "orb-speaking" : "orb-listening"}`} style={{ margin: "8px auto" }}>
                {agentSpeaking ? "🗣️" : "🎙️"}
              </div>
              <h1 style={{ fontSize: 18, margin: "4px 0" }}>{agentSpeaking ? "John is talking…" : "Your line — talk to John"}</h1>
              <p className="muted small" style={{ marginTop: 0 }}>He just picked up — you speak first. Max 8 minutes.</p>
              <textarea
                className="input"
                rows={6}
                placeholder="Your notes"
                value={notes}
                onChange={(e) => { setNotes(e.target.value); notesRef.current = e.target.value; }}
                style={{ textAlign: "left", resize: "vertical" }}
              />
              <button
                className="btn btn-ghost"
                style={{ marginTop: 10 }}
                onClick={() => {
                  if (window.confirm("Hang up now? If the call isn't finished, this attempt may not be scoreable."))
                    endSession(false);
                }}
              >
                Hang up
              </button>
            </div>
          </div>
        </main>
      </div>
    );

  if (stage === "uploading")
    return (
      <Shell step={step}>
        <h1 style={{ fontSize: 22 }}>
          {isDrill ? "Grading your drill…" : isTraining ? "Grading your call…" : "Saving your call…"}
        </h1>
        <div className="spinner" />
        <p className="muted">Don&apos;t close this tab.</p>
      </Shell>
    );

  if (stage === "done") {
    // session died before any conversation happened — surface the reason
    if (failReasonRef.current && transcriptRef.current.length === 0)
      return (
        <Shell step={step}>
          <h1>Connection problem</h1>
          <p>The session could not start. Please share this with the {SELLER_BRAND} team:</p>
          <p className="notice notice-gray small" style={{ color: "var(--red)", wordBreak: "break-all" }}>
            {failReasonRef.current}
          </p>
        </Shell>
      );

    if (isDrill) {
      const r = drillResult;
      return (
        <Shell step={step}>
          {r?.graded ? (
            r.pass ? (
              <>
                <h1>✅ Drill passed!</h1>
                <p>
                  <span className="pill pill-green" style={{ fontSize: 14 }}>{drillTitle} · {r.summary}</span>
                </p>
                {r.coaching && <p className="small muted">Coach&apos;s note: {r.coaching}</p>}
                <a className="btn" href={`/learn/${token}/${drillModule}`}>Back to my learning path</a>
              </>
            ) : (
              <>
                <h1>Not yet — run it again</h1>
                <p>
                  <span className="pill pill-red" style={{ fontSize: 14 }}>{drillTitle} · {r.summary}</span>
                </p>
                {r.reason && <p className="small" style={{ color: "var(--red)" }}>{r.reason}</p>}
                {r.coaching && <p className="small muted">Coach&apos;s note: {r.coaching}</p>}
                <div className="row" style={{ justifyContent: "center" }}>
                  <button className="btn" onClick={() => window.location.reload()}>Run the drill again</button>
                  <a className="btn btn-ghost" href={`/learn/${token}/${drillModule}`}>Back to the module</a>
                </div>
              </>
            )
          ) : (
            <>
              <h1>Drill saved</h1>
              <p className="small muted">
                We couldn&apos;t grade it automatically this time. Run it again, or the team can grade it manually.
              </p>
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={() => window.location.reload()}>Run the drill again</button>
                <a className="btn btn-ghost" href={`/learn/${token}/${drillModule}`}>Back to the module</a>
              </div>
            </>
          )}
        </Shell>
      );
    }

    if (isTraining) {
      const r = certResult;
      return (
        <Shell step={step}>
          {r?.graded ? (
            r.pass ? (
              <>
                <h1>✅ Call passed!</h1>
                <p>
                  <span className="pill pill-green" style={{ fontSize: 14 }}>{r.summary}</span>
                </p>
                <p className="small muted">This one counts toward your certification — 12 passed calls across 6 different sellers.</p>
                {r.coaching && <p className="small muted">Coach&apos;s note: {r.coaching}</p>}
                <div className="row" style={{ justifyContent: "center" }}>
                  <button className="btn" onClick={() => window.location.reload()}>📞 Take another call</button>
                  <a className="btn btn-ghost" href={`/learn/${token}`}>Back to my learning path</a>
                </div>
              </>
            ) : (
              <>
                <h1>Not this one — take another call</h1>
                <p>
                  <span className="pill pill-red" style={{ fontSize: 14 }}>{r.summary}</span>
                </p>
                {r.reason && <p className="small" style={{ color: "var(--red)" }}>{r.reason}</p>}
                {r.coaching && <p className="small muted">Coach&apos;s note: {r.coaching}</p>}
                <div className="row" style={{ justifyContent: "center" }}>
                  <button className="btn" onClick={() => window.location.reload()}>📞 Take another call</button>
                  <a className="btn btn-ghost" href={`/learn/${token}`}>Back to my learning path</a>
                </div>
              </>
            )
          ) : (
            <>
              <h1>Call saved</h1>
              <p className="small muted">We couldn&apos;t grade it automatically this time — the team can grade it manually, or just take another call.</p>
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={() => window.location.reload()}>📞 Take another call</button>
                <a className="btn btn-ghost" href={`/learn/${token}`}>Back to my learning path</a>
              </div>
            </>
          )}
        </Shell>
      );
    }

    const attemptsAfterThis = attemptsUsed + 1;
    const salesRetakesLeft = MAX_SALES_ATTEMPTS - attemptsAfterThis;
    return (
      <Shell step={step}>
        <h1>✅ All done, {candidateName}!</h1>
        <p>Your practice call was submitted. The {SELLER_BRAND} team will review it and get back to you.</p>
        {(
          salesRetakesLeft > 0 && (
            <>
              <p className="small muted">
                Not your best run? You may retake this call {salesRetakesLeft} more {salesRetakesLeft === 1 ? "time" : "times"}. The team sees all attempts.
              </p>
              <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                Retake call ({salesRetakesLeft} left)
              </button>
            </>
          )
        )}
      </Shell>
    );
  }

  return (
    <Shell step={step}>
      <h1>Something went wrong</h1>
      <p style={{ color: "var(--red)" }}>{error}</p>
      <p>Please try the link again, or contact the {SELLER_BRAND} team.</p>
    </Shell>
  );
}
