# Task: Hard-filter strength day exercise selection by emphasis (fix identical sessions)

## Goal
Strength days in the weekly plan must NOT produce identical sessions across different emphases. Implement hard filtering so each emphasis only draws from allowed movement patterns.

## Context
We generate weekly plans with strength days labeled `lower`, `push`, `pull`, `full_body_light`. However, `generateSession()` can still select the same 5 exercises because it receives the full pool.

## Requirements (Engine)

### File
Update the weekly generator in the engine:
- `packages/engine/src/generateWeeklyPlan.ts` (or wherever weekly strength sessions are created)

### Hard-filter rules
When generating a strength day session, build a filtered `exercisePool` BEFORE calling `generateSession()`:

#### lower emphasis
Allow movementPattern:
- "squat", "hinge", "lunge", "calf", "balance"
Also allow category "mobility" ONLY if the filtered pool would otherwise have fewer than 5 options.

#### push emphasis
Allow movementPattern:
- "push", "overhead_push"
If fewer than 5 options, allow:
- "core" (to fill)

#### pull emphasis
Allow movementPattern:
- "pull", "overhead_pull"
If fewer than 5 options, allow:
- "core" (to fill)

#### full_body_light emphasis
Allow movementPattern:
- "squat","hinge","lunge","push","overhead_push","pull","overhead_pull","core","carry"
Additionally: reduce intensity by 1 (min 6) OR reduce sets by 1 (min 2) across all exercises for this day type (keep deterministic).

### Determinism
Keep deterministic output:
- Use existing seed/date logic.
- No duplicates.

### Safety fallback
If a filtered pool is empty for any emphasis, fall back to the unfiltered active pool (but still avoid duplicates).

---

## Backend
No endpoint changes required if backend is already calling `generateWeeklyPlan()`.

---

## Tests
Update/add engine tests:
- Ensure a 3-day strength week (lower/push/pull) produces 3 strength sessions that are NOT identical.
- Assert:
  - lower session contains at least one LOWER pattern (squat/hinge/lunge) if available
  - push session contains a push pattern if available
  - pull session contains a pull pattern if available
- Keep determinism checks.

---

## Acceptance Criteria
- `/plans/week` no longer returns the same exercise list for push and pull days (when the DB pool contains push/pull options).
- Tests pass: `npm test`.
