# Task: Add mandatory core/carry slot to Lower strength days

## Goal
Lower emphasis strength days must include:
- 4 lower-body dominant movements
- 1 core or carry movement

This improves trunk stability and long-term joint health.

---

## Engine Changes

In generateWeeklyPlan strength logic:

When emphasis === "lower":

1. Primary pool:
   movementPattern in ["squat","hinge","lunge","calf","balance"]

2. Core pool:
   movementPattern in ["core","carry"]
   AND difficulty <= 2

3. Deterministic selection:
   - Select 4 exercises from primary pool
   - Select 1 exercise from core pool

4. Merge into session exercisePool before calling generateSession.

5. Ensure:
   - No duplicates
   - Deterministic ordering
   - Exactly 5 total exercises

---

## Tests

Update engine tests:

Assert that lower sessions:
- Contain at least one movement where movementPattern in ["core","carry"]
- Total exercises = 5
- Deterministic

---

## Acceptance Criteria

- Lower day includes one core or carry movement.
- Push and Pull logic unchanged.
- npm test passes.
