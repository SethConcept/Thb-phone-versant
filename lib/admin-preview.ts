// Global admin preview mode — one code for the whole site.
// Entering ADMIN_UNLOCK_CODE once (bottom of the learning-path sidebar,
// any device) flips a site-wide flag in the database: EVERYONE — every
// trainee link, every device — then sees all modules, drills, and the
// test unlocked, without modifying trainee records. Entering the code
// again on the "Lock again" form turns it back off.
// A device cookie is kept as a fallback so the unlock still works on the
// device where the code was typed even before the app_settings table
// exists (see supabase/upgrade-global-unlock.sql).

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const PREVIEW_COOKIE = "thb_admin_preview";
export const GLOBAL_UNLOCK_KEY = "global_unlock";

export async function isAdminPreview(): Promise<boolean> {
  const expected = process.env.ADMIN_UNLOCK_CODE;
  if (!expected) return false;

  const store = await cookies();
  if (store.get(PREVIEW_COOKIE)?.value === expected) return true;

  try {
    const { data } = await supabaseAdmin()
      .from("app_settings")
      .select("value")
      .eq("key", GLOBAL_UNLOCK_KEY)
      .maybeSingle();
    return data?.value === "on";
  } catch {
    return false; // table not created yet — cookie-only behavior
  }
}
