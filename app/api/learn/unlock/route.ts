import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PREVIEW_COOKIE, GLOBAL_UNLOCK_KEY } from "@/lib/admin-preview";

// Global admin unlock: one code for the whole site (ADMIN_UNLOCK_CODE env
// var). A correct code flips a site-wide flag in app_settings — EVERYONE
// on every device sees all content unlocked, no trainee records modified.
// Posting { code, off: true } with the correct code locks it again.
// Disabled if the env var is unset. A device cookie is also set as a
// fallback for databases that haven't run upgrade-global-unlock.sql yet.
export async function POST(req: Request) {
  const { code, off } = await req.json().catch(() => ({}));
  if (typeof code !== "string")
    return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const expected = process.env.ADMIN_UNLOCK_CODE;
  if (!expected)
    return NextResponse.json(
      { error: "Unlock code is not configured (set ADMIN_UNLOCK_CODE)" },
      { status: 501 }
    );
  if (code.trim() !== expected)
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });

  const db = supabaseAdmin();

  if (off) {
    await db.from("app_settings").delete().eq("key", GLOBAL_UNLOCK_KEY);
    const res = NextResponse.json({ ok: true, unlocked: false });
    res.cookies.delete(PREVIEW_COOKIE);
    return res;
  }

  const { error } = await db
    .from("app_settings")
    .upsert(
      { key: GLOBAL_UNLOCK_KEY, value: "on", updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  const res = NextResponse.json({
    ok: true,
    unlocked: true,
    global: !error,
    ...(error && {
      note: "Unlocked on this device only — run supabase/upgrade-global-unlock.sql to unlock for everyone.",
    }),
  });
  res.cookies.set(PREVIEW_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
