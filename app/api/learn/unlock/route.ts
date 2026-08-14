import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Admin unlock: entering the ADMIN_UNLOCK_CODE on a trainee's learning path
// flips their skip_modules flag, opening every module, drill, and the full
// test for that account (for previews/dry runs). The code is set as a
// Vercel env var; the endpoint is disabled if it isn't configured. The
// admin panel's "skip module gate" checkbox turns it back off.
export async function POST(req: Request) {
  const { token, code } = await req.json().catch(() => ({}));
  if (!token || typeof code !== "string")
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const expected = process.env.ADMIN_UNLOCK_CODE;
  if (!expected)
    return NextResponse.json(
      { error: "Unlock code is not configured (set ADMIN_UNLOCK_CODE)" },
      { status: 501 }
    );
  if (code.trim() !== expected)
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });

  const db = supabaseAdmin();
  const { data: trainee } = await db
    .from("candidates")
    .select("id, mode")
    .eq("interview_token", token)
    .single();
  if (!trainee || trainee.mode !== "training")
    return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const { error } = await db
    .from("candidates")
    .update({ skip_modules: true })
    .eq("id", trainee.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
