import { NextResponse } from "next/server";
import { PREVIEW_COOKIE } from "@/lib/admin-preview";

// Global admin unlock: one code for the whole site (ADMIN_UNLOCK_CODE env
// var). A correct code sets an httpOnly cookie on THIS device; every page
// and session route then treats the visitor as unlocked on any trainee
// link — no trainee records are modified. Disabled if the env var is
// unset; rotating the code invalidates all issued cookies.
export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
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

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days on this device
  });
  return res;
}
