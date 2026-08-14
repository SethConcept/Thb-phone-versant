// Global admin preview mode — one code for the whole site.
// Entering ADMIN_UNLOCK_CODE once (bottom of the learning-path sidebar)
// stores it in an httpOnly cookie; any page or API route on this device
// then treats the visitor as unlocked: all modules, drills, and the test
// are viewable on ANY trainee link, without modifying trainee records.
// Rotating the env var instantly invalidates every issued cookie.

import { cookies } from "next/headers";

export const PREVIEW_COOKIE = "thb_admin_preview";

export async function isAdminPreview(): Promise<boolean> {
  const expected = process.env.ADMIN_UNLOCK_CODE;
  if (!expected) return false;
  const store = await cookies();
  return store.get(PREVIEW_COOKIE)?.value === expected;
}
