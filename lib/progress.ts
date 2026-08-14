// Server-side learning-path progress: which modules are complete, which is
// next, and whether the full certification test is unlocked.

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

export function pathState(rows: ModuleProgressRow[]): PathState {
  const byModule: Record<string, ModuleProgressRow | undefined> = {};
  for (const r of rows) byModule[r.module_id] = r;

  // Drills are optional coached practice now — quizzes alone gate modules.
  const moduleComplete = (id: string) => {
    if (!LEARN_MODULES.some((m) => m.id === id)) return false;
    return !!byModule[id]?.quiz_passed;
  };

  const unlocked = (id: string) => {
    const idx = LEARN_MODULES.findIndex((m) => m.id === id);
    if (idx < 0) return false;
    if (idx === 0) return true;
    return moduleComplete(LEARN_MODULES[idx - 1].id);
  };

  const firstIncomplete =
    LEARN_MODULES.find((m) => !moduleComplete(m.id))?.id ?? null;

  return {
    byModule,
    moduleComplete,
    unlocked,
    firstIncomplete,
    allComplete: firstIncomplete === null,
  };
}
