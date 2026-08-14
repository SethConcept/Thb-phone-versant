"use client";

// Discreet admin-only unlock at the bottom of the learning-path sidebar.
// One global code (ADMIN_UNLOCK_CODE) — entering it once unlocks every
// module, drill, and the test for EVERYONE, on every device and every
// trainee link. No trainee records are touched. Entering the code again
// under "Lock again" turns it back off.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUnlock({ unlocked }: { unlocked: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/learn/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, off: unlocked }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(body.error || "Wrong code");
      return;
    }
    setMsg(
      body.note ||
        (body.unlocked ? "Unlocked for everyone ✓" : "Locked again ✓")
    );
    setCode("");
    router.refresh();
  }

  const form = (
    <form onSubmit={submit} className="learn-adminform">
      <input
        className="input"
        type="password"
        placeholder="Unlock code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
      />
      <button className="btn btn-secondary" disabled={busy || !code.trim()}>
        {busy ? "…" : unlocked ? "Lock again" : "Unlock for everyone"}
      </button>
    </form>
  );

  return (
    <>
      {unlocked && (
        <p className="learn-adminnote">🔓 Admin preview — all content unlocked for everyone</p>
      )}
      <details className="learn-admin">
        <summary>{unlocked ? "Lock again" : "Admin"}</summary>
        {form}
        {msg && <p className="small" style={{ margin: "6px 0 0", color: msg.includes("✓") ? "var(--green)" : "var(--red)" }}>{msg}</p>}
      </details>
    </>
  );
}
