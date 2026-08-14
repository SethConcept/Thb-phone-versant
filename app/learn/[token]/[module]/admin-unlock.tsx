"use client";

// Discreet admin-only unlock at the bottom of the learning-path sidebar.
// One global code (ADMIN_UNLOCK_CODE) — entering it once stores a preview
// cookie on THIS device, unlocking every module, drill, and the test on
// any trainee link. No trainee records are touched.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminUnlock({ unlocked }: { unlocked: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  if (unlocked)
    return (
      <p className="learn-adminnote">🔓 Admin preview — all content unlocked on this device</p>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/learn/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMsg(body.error || "Wrong code");
      return;
    }
    setMsg("Unlocked ✓");
    router.refresh();
  }

  return (
    <details className="learn-admin">
      <summary>Admin</summary>
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
          {busy ? "…" : "Unlock all"}
        </button>
      </form>
      {msg && <p className="small" style={{ margin: "6px 0 0", color: msg.includes("✓") ? "var(--green)" : "var(--red)" }}>{msg}</p>}
    </details>
  );
}
