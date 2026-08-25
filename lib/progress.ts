// Server-side learning-path progress: which modules are complete, which is
// next, and whether the full certification test is unlocked. Works for any
// module track — Versant (m1..m8, the default) or dispo (d1..d7) — by
// passing the track's module list.

import { LEARN_MODULES } from "./modules";

export type ModuleProgressRow = {
  module_id: string;
  quiz_score: number | null;
  quiz_total: number | null;
  quiz_passed: boolean;
  drill_passed: boolean;
};

export type PathState = {
  byModule: Record<string, ModuleProgressRow | undefined>;
  moduleComplete: (id: string) => boolean;
  unlocked: (id: string) => boolean;
  firstIncomplete: string | null;
  allComplete: boolean;
};

export function pathState(
  rows: ModuleProgressRow[],
  modules: { id: string }[] = LEARN_MODULES
): PathState {
  const byModule: Record<string, ModuleProgressRow | undefined> = {};
  for (const r of rows) byModule[r.module_id] = r;

  // Drills are optional coached practice now — quizzes alone gate modules.
  const moduleComplete = (id: string) => {
    if (!modules.some((m) => m.id === id)) return false;
    return !!byModule[id]?.quiz_passed;
  };

  const unlocked = (id: string) => {
    const idx = modules.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    if (idx === 0) return true;
    return moduleComplete(modules[idx - 1].id);
  };

  const firstIncomplete = modules.find((m) => !moduleComplete(m.id))?.id ?? null;

  return {
    byModule,
    moduleComplete,
    unlocked,
    firstIncomplete,
    allComplete: firstIncomplete === null,
  };
}
