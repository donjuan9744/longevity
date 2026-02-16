# Task: Add explicit sessions for mobility, zone2, and recovery days (deterministic from DB)

## Goal
Weekly plans should include exact movements for non-strength days (mobility, zone2, recovery), selected deterministically from the exercise database—similar to strength sessions.

Currently, non-strength days only return `{ minutes }`. Update engine + backend response to include a `session` with exercises for those day types.

---

## Engine Changes (packages/engine)

### 1) Update types
In the engine weekly plan types (where `DayPlan` is defined), extend non-strength day variants to include an optional `session`:

- Mobility day should include:
  - `session: { exercises: SessionExercise[]; engineVersion: string; notes?: string[] }`

- Zone2 day should include:
  - `session: { exercises: SessionExercise[]; engineVersion: string; notes?: string[] }`

- Recovery day should include:
  - `session: { exercises: SessionExercise[]; engineVersion: string; notes?: string[] }`

Keep `minutes` and `notes` on these days as well.

### 2) Deterministic selection for non-strength days
In `generateWeeklyPlan(...)`:

#### Mobility day selection:
- Use only exercises where:
  - `category === "mobility"` OR `movementPattern in ["mobility","warmup"]`
- Select up to 5 exercises deterministically (seeded by date or weekStart+date).
- Output as `SessionExercise[]` with:
  - mobility reps default: 10–12 OR time-like reps 30 (we only have reps field)
  - sets default: 2–3
  - intensity default: 6 (lower than strength)
- Ensure no duplicates.

#### Zone2 day selection:
- Use only exercises where:
  - `category === "conditioning"`
- Select 1 primary modality deterministically:
  - Examples: incline walk, bike, row, elliptical, swim, outdoor walk
- Output a session with 1–2 exercises max:
  - sets: 1
  - reps: `minutes` (use reps field to represent minutes for conditioning)
  - intensity: 6
- Add notes like "Zone 2 conversational pace" (optional).

#### Recovery day selection:
- Use a light combo pool:
  - mobility + warmup + very light accessory (e.g., breathing, easy walk, gentle mobility)
- Select 3 exercises deterministically:
  - include at least 1 mobility/breathing if available
- sets: 1–2
- reps: 8–12 (or minutes for walking/breathing if conditioning is selected)
- intensity: 5–6

### 3) Reuse existing session shape
For non-strength sessions, do NOT call the strength `generateSession()`—instead, generate a `GeneratedSession`-like object:
- `{ exercises, engineVersion: "v1", notes }`

### 4) Export
Ensure the updated weekly plan types are exported via `packages/engine/src/index.ts`.

### 5) Tests
Add/extend engine tests:
- `packages/engine/tests/weeklyPlan.test.ts`:
  - Assert mobility days include `session.exercises.length > 0`
  - Assert zone2 days include exactly 1–2 exercises
  - Assert recovery days include 2–4 exercises
  - Assert determinism (same inputs -> same output)

---

## Backend Changes (apps/backend)

### 1) GET /plans/week response
Ensure `/plans/week` passes the full `exercisePool` (already does) and returns non-strength days including the `session` field from the engine.

Do NOT persist non-strength sessions to `WorkoutSession` table (v1). Only strength days create DB rows.

### 2) Swagger
Update OpenAPI schema so `/plans/week` shows:
- non-strength day objects can include `session.exercises`.

### 3) Backend tests
Update `apps/backend/tests/server.test.ts`:
- Call `/plans/week`
- Assert:
  - `days` length = 7
  - At least one day with `type === "mobility"` has `session.exercises.length > 0`
  - At least one `type === "zone2"` has `session.exercises.length >= 1`
  - `type === "recovery"` has `session.exercises.length > 0`

---

## Acceptance Criteria
- `/plans/week` returns non-strength days with explicit movements in `session.exercises`.
- Selection is deterministic.
- Strength days unchanged.
- `npm test` passes.
