# Task: Implement weekly plan generation (strength days + active recovery)

## Goal
Generate a 7-day plan where the user selects 2–5 strength days/week, and remaining days are filled with zone2 / mobility / recovery. Expose this via `GET /plans/week`.

## Constraints
- Minimal schema changes. Prefer using existing tables (`UserProgram`, `WorkoutSession`, `Exercise`, `ReadinessEntry`, `ProgressionState`).
- Reuse the existing engine `generateSession()` for strength days (it is now balanced).
- Keep deterministic behavior: same weekStart + user state should generate same plan (unless sessions already exist).

---

## Engine Changes (packages/engine)
### 1) Add a weekly generator
Create: `packages/engine/src/generateWeeklyPlan.ts`

Export a function:

```ts
export type DayPlan =
  | { date: string; type: "strength"; emphasis: "lower" | "push" | "pull" | "full_body_light"; session: GeneratedSession }
  | { date: string; type: "zone2"; minutes: number; notes?: string }
  | { date: string; type: "mobility"; minutes: number; notes?: string }
  | { date: string; type: "recovery"; minutes: number; notes?: string };

export function generateWeeklyPlan(input: {
  weekStart: string; // YYYY-MM-DD (Monday)
  strengthDays: 2 | 3 | 4 | 5;
  goal: TrainingGoal;
  progression: { strengthLevel: number; volumeLevel: number; fatigueScore: number; deloadCount: number };
  readinessTrend?: { avgSleep?: number; avgEnergy?: number; avgSoreness?: number; avgStress?: number }; // optional, v1 simple
  exercisePool: ExerciseDefinition[];
  seed?: number;
}): { days: DayPlan[]; engineVersion: string };
