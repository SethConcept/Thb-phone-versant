"use client";

// Trainee-facing session flow.
//
// Three modes:
//   training — the phone desk: a Google-Voice-style screen with the seller
//              roster. Random incoming call (counts toward certification) or
//              dial a specific seller (practice). The line RINGS in the UI,
//              the trainee answers, and the AI caller waits silently for
//              their greeting — no announcements, no fake ring sounds from
//              the AI. Auto-graded on hangup.
//   drill    — the OPTIONAL drill room: coached practice, the coach gives
//              spoken advice after each answer; never graded or counted
//   dispo    — the dispositions dialer: same desk UI but OUTBOUND. The
//              trainee places the call, hears ringback, the agent answers
//              "Hello?" and the trainee runs the Equity Track opener.
//              Auto-graded on hangup (12-item rubric, breaches = fail).
//   sales    — practice call vs "John" with the script on screen
//
// Audio in:  mic -> AudioContext(16kHz) -> PCM16 -> sendRealtimeInput
// Audio out: model PCM (24kHz) -> queued AudioBuffer playback
// Transcript: input/output transcription events accumulated locally,
//             uploaded with the mic recording (webm) on session end.

import { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
// Brand only — never import lib/academy here: it would ship the seller
// property registry (addresses, park/manufactured flags) to the browser.
import { SELLER_BRAND } from "@/lib/brand";

type Turn = { role: "agent" | "candidate"; text: string; ts: number };
type Stage =
  | "consent" | "miccheck" | "desk" | "ringing"
  | "connecting" | "live" | "uploading" | "done" | "error";
type AutoResult = {
  graded: boolean; pass: boolean; reason: string; summary: string;
  coaching: string; picked?: boolean; who?: string;
};
type DeskSeller = { id: string; label: string; number: string };

const SALES_CAP_MS = 8 * 60 * 1000;
const TRAINING_CAP_MS = 12 * 60 * 1000;
const DRILL_CAP_MS = 5 * 60 * 1000;
const DISPO_CAP_MS = 8 * 60 * 1000;
const MAX_SALES_ATTEMPTS = 3;

// Client-safe branding for the dispo track (never import lib/dispo here —
// it carries the agent persona scripts, which must not ship to the browser).
const DISPO_BRAND_LABEL = "Equity Track";

const END_MARKERS = ["TEST COMPLETE", "CALL COMPLETE", "DRILL COMPLETE"];

const STEP_OF: Record<Stage, number> = {
  consent: 1, miccheck: 2, desk: 3, ringing: 3,
  connecting: 3, live: 3, uploading: 4, done: 4, error: 1,
};

// Module-level so React treats it as a stable component — defining it inside
// InterviewClient caused a full remount (and fade-in restart) on every
// mic-level tick, making the page invisible until the meter pinned.
function Shell({ step, children, foot }: { step: number; children: React.ReactNode; foot?: string }) {
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
          {foot ?? `${SELLER_BRAND} · Phone Academy`}
        </p>
      </main>
    </div>
  );
}

const initialOf = (label: string) => (label.trim()[0] || "?").toUpperCase();
const firstNameOf = (label: string) => label.split(" — ")[0];
const capFirst = (x: string) => (x ? x.charAt(0).toUpperCase() + x.slice(1) : x);

// Material-style icons (fill: currentColor) — emoji phones render as red
// handsets on Windows and break the Google Voice look.
function PhoneIcon({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}
function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
  );
}
function ChatIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
  );
}
function VoicemailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.5 6C15.46 6 13 8.46 13 11.5c0 1.33.47 2.55 1.26 3.5H9.74c.79-.95 1.26-2.17 1.26-3.5C11 8.46 8.54 6 5.5 6S0 8.46 0 11.5 2.46 17 5.5 17h13c3.04 0 5.5-2.46 5.5-5.5S21.54 6 18.5 6zm-13 9C3.57 15 2 13.43 2 11.5S3.57 8 5.5 8 9 9.57 9 11.5 7.43 15 5.5 15zm13 0c-1.93 0-3.5-1.57-3.5-3.5S16.57 8 18.5 8s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
    </svg>
  );
}
const situationOf = (label: string) => label.split(" — ")[1] ?? "";
// Google contact-avatar palette, deterministic per roster position
const AVA_COLORS = ["#7b1fa2", "#c2185b", "#00796b", "#f57c00", "#455a64", "#5c6bc0", "#0288d1", "#689f38", "#e64a19", "#616161"];

const PAD_KEYS: [string, string][] = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", ""], ["#", ""],
];

export default function InterviewClient({
  token,
  candidateName,
  attemptsUsed = 0,
  mode = "training",
  script = "",
  drillModule = "",
  drillTitle = "",
  drillIntro = "",
  drillCapMs = 0,
  sellers = [],
}: {
  token: string;
  candidateName: string;
  attemptsUsed?: number;
  mode?: "training" | "sales" | "drill" | "dispo";
  script?: string;
  drillModule?: string;
  drillTitle?: string;
  drillIntro?: string;
  drillCapMs?: number;
  sellers?: DeskSeller[];
}) {
  const isTraining = mode === "training";
  const isDrill = mode === "drill";
  const isDispo = mode === "dispo";
  // both desk-based modes share the Google-Voice UI and the back-to-desk flow
  const isDesk = isTraining || isDispo;
  const [stage, setStage] = useState<Stage>("consent");
  const [error, setError] = useState("");
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [autoResult, setAutoResult] = useState<AutoResult | null>(null);
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");
  const [micLevel, setMicLevel] = useState(0);
  const [micOk, setMicOk] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const micCheckCleanupRef = useRef<() => void>(() => {});

  // phone-desk state (training)
  const [pickedSeller, setPickedSeller] = useState<DeskSeller | null>(null);
  const [dial, setDial] = useState("");
  const [dialError, setDialError] = useState("");
  const [search, setSearch] = useState("");
  const [showPad, setShowPad] = useState(true);
  const [callSec, setCallSec] = useState(0);
  const ringRef = useRef<{ ctx: AudioContext; timer: ReturnType<typeof setInterval> } | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // dispo: outbound ringback plays, then the call auto-connects
  const outboundRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => () => {
    stopRing();
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (outboundRef.current) clearTimeout(outboundRef.current);
  }, []);

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

  // ---- phone-desk helpers (training) ----

  // Classic US ring: 440+480Hz bursts, ~2s on / ~4s off.
  function startRing() {
    try {
      const ctx = new AudioContext();
      const burst = () => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.connect(ctx.destination);
        const o1 = ctx.createOscillator();
        const o2 = ctx.createOscillator();
        o1.frequency.value = 440;
        o2.frequency.value = 480;
        o1.connect(gain); o2.connect(gain);
        o1.start(); o2.start();
        o1.stop(ctx.currentTime + 1.8); o2.stop(ctx.currentTime + 1.8);
      };
      burst();
      const timer = setInterval(burst, 5000);
      ringRef.current = { ctx, timer };
    } catch {}
  }

  function stopRing() {
    const r = ringRef.current;
    if (!r) return;
    clearInterval(r.timer);
    try { r.ctx.close(); } catch {}
    ringRef.current = null;
  }

  function incomingCall(seller: DeskSeller | null) {
    setPickedSeller(seller);
    setDialError("");
    setStage("ringing");
    startRing();
    // Dispo is outbound: the trainee placed the call, so after a few rings
    // the agent picks up on their own — no answer button to press.
    if (isDispo) {
      if (outboundRef.current) clearTimeout(outboundRef.current);
      outboundRef.current = setTimeout(() => {
        outboundRef.current = null;
        stopRing();
        start();
      }, 5500);
    }
  }

  function dialSeller() {
    const q = dial.trim().toLowerCase();
    if (!q) return;
    const digits = q.replace(/\D/g, "");
    const match = sellers.find(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (digits.length >= 4 && s.number.replace(/\D/g, "").endsWith(digits))
    );
    if (!match) {
      setDialError(isDispo ? "No agent matches that name or number." : "No seller matches that name or number.");
      return;
    }
    setDial("");
    incomingCall(match);
  }

  function answerCall() {
    stopRing();
    start();
  }

  function declineCall() {
    stopRing();
    if (outboundRef.current) { clearTimeout(outboundRef.current); outboundRef.current = null; }
    setPickedSeller(null);
    setStage("desk");
  }

  // After a finished call, return to the desk with a clean slate.
  function backToDesk() {
    endedRef.current = false;
    transcriptRef.current = [];
    chunksRef.current = [];
    recorderRef.current = null;
    sessionRef.current = null;
    interviewIdRef.current = "";
    failReasonRef.current = "";
    streamRef.current = null; // tracks were stopped — start() re-acquires
    setAutoResult(null);
    setAgentSpeaking(false);
    setCallSec(0);
    setPickedSeller(null);
    setStage("desk");
  }

  async function start() {
    micCheckCleanupRef.current(); // stop the meter; keep the stream
    setStage("connecting");
    try {
      // 1. Log consent + get ephemeral token (API key stays server-side)
      const res = await fetch("/api/interviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...(isDrill ? { drill: drillModule } : {}),
          ...(isDesk && pickedSeller ? { persona: pickedSeller.id } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not start the session");
      }
      const { interviewId, ephemeralToken, model, systemPrompt } = await res.json();
      interviewIdRef.current = interviewId;

      // 2. Mic (already granted during mic check)
      const stream =
        streamRef.current && streamRef.current.getTracks().some((t) => t.readyState === "live")
          ? streamRef.current
          : await navigator.mediaDevices.getUserMedia({
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            });
      streamRef.current = stream;

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
        isDrill
          ? (drillCapMs || DRILL_CAP_MS)
          : isTraining
            ? TRAINING_CAP_MS
            : isDispo
              ? DISPO_CAP_MS
              : SALES_CAP_MS
      );

      // call duration ticker
      setCallSec(0);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => setCallSec((s) => s + 1), 1000);

      cleanupRef.current = () => {
        clearTimeout(capTimer);
        if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
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
    // If the caller already delivered its closing line, this session IS
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
      if (data?.drill) setAutoResult(data.drill);
      if (data?.cert) setAutoResult(data.cert);
    } catch {}
    setStage("done");
  }

  const step = STEP_OF[stage];
  const mmss = `${Math.floor(callSec / 60)}:${String(callSec % 60).padStart(2, "0")}`;

  if (stage === "consent")
    return (
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
        <h1 style={{ fontSize: 24 }}>
          {isDrill
            ? `🎙 Voice drill: ${drillTitle}`
            : isTraining
              ? `${SELLER_BRAND} — Phone Certification Test`
              : isDispo
                ? `${DISPO_BRAND_LABEL} — Dispositions Certification`
                : `${SELLER_BRAND} — Practice Call`}
        </h1>
        {isDispo ? (
          <>
            <p>
              Hi {candidateName}! This is a certification call — <strong>you place one outbound call to a licensed agent</strong>, about five minutes. They answer, you run the opener: who you are, why you&apos;re calling, the position, and then you stop talking.
            </p>
            <p className="small muted" style={{ marginTop: 0 }}>
              You won&apos;t know which agent you&apos;re getting — some are friendly, some test you. Graded automatically when you hang up: 12 items, and crossing a licensing boundary is an automatic fail. Certification takes 5 passed calls.
            </p>
          </>
        ) : isDrill ? (
          <>
            <p>{drillIntro}</p>
            <p className="small muted">
              Optional practice — <strong>no pass, no fail, nothing counted</strong>. The coach gives you spoken feedback right after each answer, then the drill ends. Run it as often as you like.
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
          <strong>This session is recorded</strong> (audio and transcript) and reviewed by the {isDispo ? DISPO_BRAND_LABEL : SELLER_BRAND} team. By clicking below, you consent to the recording.
        </p>
        <p className="small muted">Find a quiet spot and use headphones.</p>
        <button className="btn btn-lg" onClick={beginMicCheck}>I consent — continue to mic check</button>
      </Shell>
    );

  if (stage === "miccheck")
    return (
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
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
            Next: your phone desk. When a call comes in, <strong>answer it and speak first</strong> — exactly like a real inbound call.
          </p>
        )}
        {isDispo && (
          <p className="small muted" style={{ margin: "8px 0" }}>
            Next: your dialer. <strong>You place the call</strong> — when the agent picks up, run the opener. Name, company, the property, a few minutes to talk.
          </p>
        )}
        {isDrill && (
          <p className="small muted" style={{ margin: "8px 0" }}>
            The examiner starts the drill as soon as you&apos;re connected.
          </p>
        )}
        <button
          className="btn btn-lg"
          disabled={!micOk}
          onClick={() => {
            if (isDesk) {
              micCheckCleanupRef.current();
              setStage("desk");
            } else {
              start();
            }
          }}
        >
          {isDrill ? "🎙 Start the drill" : isDispo ? "☎️ Open my dialer" : isTraining ? "☎️ Open my phone desk" : "📞 Call John"}
        </button>
      </Shell>
    );

  if (stage === "desk" || stage === "ringing") {
    const q = search.trim().toLowerCase();
    const visibleSellers = q
      ? sellers.filter((x) => x.label.toLowerCase().includes(q) || x.number.includes(q))
      : sellers;
    const avaColor = (id: string) => AVA_COLORS[sellers.findIndex((x) => x.id === id) % AVA_COLORS.length];
    return (
      <div className="gv2">
        <div className="gv2-top">
          <button className="gv2-burger" aria-hidden>≡</button>
          <div className="gv2-logo"><span className="glyph"><PhoneIcon size={22} /></span> Voice</div>
          <div className="gv2-search">
            <SearchIcon size={17} />
            <input
              placeholder={isDispo ? "Search agents" : "Search sellers"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="gv2-topright">
            <a href={`/learn/${token}/results`} className="gv2-backlink">My results</a>
            <a href={`/learn/${token}`} className="gv2-backlink">My learning path</a>
            <span className="gv2-me">{initialOf(candidateName)}</span>
          </div>
        </div>

        <div className="gv2-body">
          <aside className="gv2-rail">
            <button className="gv2-railbtn on" title="Calls"><PhoneIcon size={19} /><span className="gv2-railbadge">{sellers.length}</span></button>
            <button className="gv2-railbtn" title="Messages"><ChatIcon size={18} /></button>
            <button className="gv2-railbtn" title="Voicemail"><VoicemailIcon size={20} /></button>
          </aside>

          <div className="gv2-list">
            {visibleSellers.map((x) => (
              <div key={x.id} className="gv2-row" onClick={() => incomingCall(x)} title={`Practice call with ${firstNameOf(x.label)}`}>
                <span className="gv2-ava" style={{ background: avaColor(x.id) }}>{initialOf(x.label)}</span>
                <span className="gv2-rowmain">
                  <span className="gv2-rowname">{firstNameOf(x.label)}</span>
                  <span className="gv2-rowsub"><span className="dir">{isDispo ? "↗" : "↙"}</span> {situationOf(x.label)} · {x.number}</span>
                </span>
                <button
                  className="gv2-rowcall"
                  onClick={(e) => { e.stopPropagation(); incomingCall(x); }}
                >
                  <PhoneIcon size={17} />
                </button>
              </div>
            ))}
            {visibleSellers.length === 0 && (
              <p className="gv2-note" style={{ padding: "14px 16px" }}>No {isDispo ? "agents" : "sellers"} match &quot;{search}&quot;.</p>
            )}
          </div>

          <div className="gv2-center">
            <div className="gv2-hero">
              <h2>Hi {capFirst(firstNameOf(candidateName))}!</h2>
              {isDispo ? (
                <>
                  <p>Your dialer is ready. Dial the next call to work toward certification — 5 passed calls, and every kind of agent has to be covered.</p>
                  <p style={{ marginTop: 8 }}>Calling an agent from the list is practice: graded, but it doesn&apos;t count.</p>
                </>
              ) : (
                <>
                  <p>Your line is open. Take the next call to work toward certification — 12 passed calls across 6 different sellers.</p>
                  <p style={{ marginTop: 8 }}>Calling a seller from the list is practice: graded, but it doesn&apos;t count.</p>
                </>
              )}
            </div>
          </div>

          <div className="gv2-dialpanel">
            <div className="gv2-callas">Call as</div>
            <div className="gv2-callasnum">{isDispo ? `${DISPO_BRAND_LABEL} · (510) 394-0200` : "Twin Home Buyer · (510) 394-0100"}</div>

            <div className="gv2-dialrow">
              <input
                placeholder="Enter a name or number"
                value={dial}
                onChange={(e) => { setDial(e.target.value); setDialError(""); }}
                onKeyDown={(e) => e.key === "Enter" && dialSeller()}
              />
              <button className="gv2-dialgo" onClick={dialSeller} disabled={!dial.trim()} title="Call"><PhoneIcon size={17} /></button>
            </div>
            {dialError && <p className="gv2-note" style={{ color: "var(--g-red)", marginTop: 2 }}>{dialError}</p>}

            <div className="gv2-suglabel">SUGGESTIONS</div>
            <button className="gv2-sug" onClick={() => incomingCall(null)}>
              <span className="gv2-ava"><PhoneIcon size={17} /></span>
              <span>
                <span className="gv2-sugname" style={{ display: "block" }}>{isDispo ? "Dial the next call" : "Take the next call"}</span>
                <span className="gv2-sugsub">{isDispo ? "Next agent on your list · counts toward certification" : "Random seller · counts toward certification"}</span>
              </span>
            </button>

            {showPad && (
              <div className="gv2-pad">
                {PAD_KEYS.map(([n, sub]) => (
                  <button key={n} className="gv2-key" onClick={() => { setDial((d) => d + n); setDialError(""); }}>
                    <div className="gv2-keynum">{n}</div>
                    <div className="gv2-keysub">{sub}</div>
                  </button>
                ))}
              </div>
            )}
            <button className="gv2-padtoggle" onClick={() => setShowPad((v) => !v)}>
              {showPad ? "⌄ Hide keypad" : "⌃ Show keypad"}
            </button>

            <p className="gv2-note">This session is recorded and graded automatically when the call ends.</p>
          </div>
        </div>

        {stage === "ringing" && (
          <div className="gv2-overlay">
            <div className="gv2-callcard fade-in">
              <div
                className="gv2-ava gv2-bigava ringing-pulse"
                style={{ background: pickedSeller ? avaColor(pickedSeller.id) : "#616161" }}
              >
                {pickedSeller ? initialOf(pickedSeller.label) : "?"}
              </div>
              <h2>{pickedSeller ? firstNameOf(pickedSeller.label) : isDispo ? "Next agent" : "Unknown caller"}</h2>
              <p className="sub">
                {isDispo
                  ? `${pickedSeller ? pickedSeller.number : "Dialing"} · Calling…`
                  : `${pickedSeller ? pickedSeller.number : "No caller ID"} · Incoming call…`}
              </p>
              <div className="gv2-actions">
                <button className="gv2-round gv2-decline" onClick={declineCall} title={isDispo ? "Cancel" : "Decline"}>
                  <PhoneIcon size={22} style={{ transform: "rotate(135deg)" }} />
                </button>
                {!isDispo && (
                  <button className="gv2-round gv2-answer" onClick={answerCall} title="Answer">
                    <PhoneIcon size={22} />
                  </button>
                )}
              </div>
              {isDispo && <p className="gv2-note" style={{ marginTop: 10 }}>Ringing — they&apos;ll pick up in a moment. Be ready to speak.</p>}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === "connecting")
    return (
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
        <h1 style={{ fontSize: 22 }}>{mode === "sales" ? "Ringing John…" : isDispo ? "Connecting the call…" : "Connecting…"}</h1>
        <div className="spinner" />
        <p className="muted">{mode === "sales" ? "He usually picks up fast." : isDispo ? "They're picking up — you speak after their hello." : isTraining ? "Picking up the line…" : "The drill starts as soon as they pick up."}</p>
      </Shell>
    );

  if (stage === "live" && isDesk) {
    const liveColor = pickedSeller
      ? AVA_COLORS[sellers.findIndex((x) => x.id === pickedSeller.id) % AVA_COLORS.length]
      : "#616161";
    return (
      <div className="gv2">
        <div className="gv2-top">
          <div className="gv2-logo"><span className="glyph"><PhoneIcon size={22} /></span> Voice</div>
          <div className="gv2-topright">
            <span className="gv2-me">{initialOf(candidateName)}</span>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="gv2-callcard" style={{ boxShadow: "none" }}>
            <div className={`gv2-ava gv2-bigava ${agentSpeaking ? "speaking-pulse" : ""}`} style={{ background: liveColor }}>
              {pickedSeller ? initialOf(pickedSeller.label) : "?"}
            </div>
            <h2>{pickedSeller ? firstNameOf(pickedSeller.label) : isDispo ? "On the line" : "Unknown caller"}</h2>
            <p className="sub">
              {pickedSeller
                ? `${pickedSeller.number} · practice call`
                : isDispo
                  ? "Outbound · certification call"
                  : "No caller ID"}
            </p>
            <p className="gv2-timer">{mmss}</p>
            <button
              className="gv2-round gv2-end"
              title="End call"
              onClick={() => {
                if (window.confirm("Hang up now? An unfinished call may not be gradeable."))
                  endSession(false);
              }}
            >
              <PhoneIcon size={22} />
            </button>
            <p className="gv2-livehint">Hang up when the call is over — grading is automatic.</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "live" && isDrill)
    return (
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
        <div className={`orb ${agentSpeaking ? "orb-speaking" : "orb-listening"}`}>
          {agentSpeaking ? "🗣️" : "🎙️"}
        </div>
        <h1 style={{ fontSize: 20 }}>
          {agentSpeaking ? "Coach / seller speaking…" : "Your line — speak"}
        </h1>
        <p className="muted small">{drillTitle} — answer like you&apos;re live; the coach gives feedback after each answer.</p>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm("End the drill now?")) endSession(false);
          }}
        >
          End drill early
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
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
        <h1 style={{ fontSize: 22 }}>
          {isDrill ? "Wrapping up your drill…" : isDesk ? "Grading your call…" : "Saving your call…"}
        </h1>
        <div className="spinner" />
        <p className="muted">Don&apos;t close this tab.</p>
      </Shell>
    );

  if (stage === "done") {
    // session died before any conversation happened — surface the reason
    if (failReasonRef.current && transcriptRef.current.length === 0)
      return (
        <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
          <h1>Connection problem</h1>
          <p>The session could not start. Please share this with the {SELLER_BRAND} team:</p>
          <p className="notice notice-gray small" style={{ color: "var(--red)", wordBreak: "break-all" }}>
            {failReasonRef.current}
          </p>
          {isDesk && <button className="btn btn-secondary" onClick={backToDesk}>Back to the phones</button>}
        </Shell>
      );

    if (isDrill) {
      return (
        <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
          <h1>🎙 Drill done</h1>
          <p className="small muted">
            The coach&apos;s feedback was in the call — nothing is scored or counted here. Run another whenever you like.
          </p>
          <div className="row" style={{ justifyContent: "center" }}>
            <a className="btn" href={`/interview/${token}?drill=one`}>⚡ Another quick one</a>
            <a className="btn btn-secondary" href={`/interview/${token}?drill=three`}>🔁 Three in a row</a>
            <a className="btn btn-ghost" href={`/learn/${token}/results`}>📊 My results</a>
            <a className="btn btn-ghost" href={`/learn/${token}`}>My learning path</a>
          </div>
        </Shell>
      );
    }

    if (isDesk) {
      const r = autoResult;
      return (
        <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
          {r?.graded ? (
            <>
              <h1>{r.pass ? "✅ Call passed!" : isDispo ? "Not this one — dial another call" : "Not this one — take another call"}</h1>
              {r.who && (
                <p className="small muted" style={{ marginTop: 0 }}>That was: <strong>{r.who}</strong></p>
              )}
              <p>
                <span className={`pill ${r.pass ? "pill-green" : "pill-amber"}`} style={{ fontSize: 14 }}>{r.summary}</span>
                {r.picked && <span className="pill pill-blue" style={{ fontSize: 12, marginLeft: 8 }}>practice — doesn&apos;t count toward certification</span>}
              </p>
              {!r.pass && r.reason && (
                <p className="small" style={{ color: "var(--amber)" }}>
                  <strong>Work on this next:</strong> {r.reason}
                </p>
              )}
              {r.pass && !r.picked && (
                <p className="small muted">
                  {isDispo
                    ? "This one counts toward your certification — 5 passed calls, and one of them has to be the agent who tries to pull you across the line."
                    : "This one counts toward your certification — 12 passed calls across 6 different sellers."}
                </p>
              )}
              {r.coaching && <p className="small muted">Coach&apos;s note: {r.coaching}</p>}
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={backToDesk}>☎️ Back to the phones</button>
                <a className="btn btn-secondary" href={`/learn/${token}/results`}>📊 My results</a>
                <a className="btn btn-ghost" href={`/learn/${token}`}>My learning path</a>
              </div>
            </>
          ) : (
            <>
              <h1>Call saved</h1>
              <p className="small muted">We couldn&apos;t grade it automatically this time — the team can grade it manually, or just take another call.</p>
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={backToDesk}>☎️ Back to the phones</button>
                <a className="btn btn-secondary" href={`/learn/${token}/results`}>📊 My results</a>
                <a className="btn btn-ghost" href={`/learn/${token}`}>My learning path</a>
              </div>
            </>
          )}
        </Shell>
      );
    }

    const attemptsAfterThis = attemptsUsed + 1;
    const salesRetakesLeft = MAX_SALES_ATTEMPTS - attemptsAfterThis;
    return (
      <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
        <h1>✅ All done, {candidateName}!</h1>
        <p>Your practice call was submitted. The {SELLER_BRAND} team will review it and get back to you.</p>
        {salesRetakesLeft > 0 && (
          <>
            <p className="small muted">
              Not your best run? You may retake this call {salesRetakesLeft} more {salesRetakesLeft === 1 ? "time" : "times"}. The team sees all attempts.
            </p>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              Retake call ({salesRetakesLeft} left)
            </button>
          </>
        )}
      </Shell>
    );
  }

  return (
    <Shell step={step} foot={isDispo ? `${DISPO_BRAND_LABEL} · The Desk · Dispositions` : undefined}>
      <h1>Something went wrong</h1>
      <p style={{ color: "var(--red)" }}>{error}</p>
      <p>Please try the link again, or contact the {SELLER_BRAND} team.</p>
    </Shell>
  );
}
