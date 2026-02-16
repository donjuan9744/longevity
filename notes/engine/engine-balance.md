# Task: Balance exercise selection in generateSession

## Goal
Update the engine so each generated session is balanced (longevity-friendly) instead of selecting an arbitrary first 5 exercises.

## Current Behavior
`packages/engine/src/generateSession.ts`:
- deterministically orders `input.exercisePool`
- selects first 5

This can produce skewed sessions (e.g., all arms).

## New Behavior
Select up to 5 exercises using buckets, in this order:

1) LOWER: movementPattern in ["squat","hinge","lunge"]
2) PUSH: movementPattern in ["push","overhead_push"]
3) PULL: movementPattern in ["pull","overhead_pull"]
4) CORE/CARRY: movementPattern in ["core","carry"]
5) MOBILITY/WARMUP: category === "mobility" OR movementPattern in ["mobility","warmup"]

### Selection Rules
- Keep deterministic behavior: same inputs (date/seed + pool) produce the same output.
- Prefer `category === "compound"` for LOWER, PUSH, and PULL when available.
- Avoid duplicates: do not select the same `exercise.id` twice.
- If a bucket has no matches, skip it.
- If fewer than 5 exercises selected after buckets, fill remaining slots from the remaining pool:
  - deterministic order
  - prefer variety by selecting different `movementPattern` than already chosen when possible

## Output
Keep the existing sets/reps/intensity logic unchanged.
Only change which exercises are selected.

## Tests
Update `packages/engine/tests/engine.test.ts`:
- Extend test pool so it includes at least one exercise from each bucket.
- Assert the result contains at least one from LOWER, PUSH, PULL, CORE, and MOBILITY when available.
- Keep determinism assertions.

Run all tests afterwards.

## Acceptance Criteria
- `npm test` passes.
- Generating a session from a diverse pool returns a balanced mix (lower/push/pull/core/mobility).
- No duplicate exerciseIds in a session.
