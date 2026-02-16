# Task: Add mandatory shoulder health slot to Push days

## Goal
Push emphasis days must include:
- Majority push movements
- 1 mandatory shoulder-health pulling movement

This improves joint longevity for 40+ users.

---

## Engine Changes

In generateWeeklyPlan strength logic:

When emphasis === "push":

1. Build primary pool:
   movementPattern in ["push","overhead_push"]

2. Build shoulder health pool:
   movementPattern in ["pull"]
   AND muscleGroup in ["shoulders","back"]
   AND difficulty <= 2

3. Deterministic selection:
   - Select 4 exercises from primary push pool
   - Select 1 exercise from shoulder health pool

4. Merge into session exercisePool before calling generateSession.

5. Ensure:
   - No duplicates
   - Deterministic ordering
   - Still exactly 5 exercises total

---

## Tests

Update engine tests:

Assert that push sessions:
- Contain at least one movement where movementPattern === "pull"
- Total exercises = 5
- Deterministic

---

## Acceptance Criteria

- Push day now includes one pulling movement.
- Other emphasis days unchanged.
- npm test passes.
