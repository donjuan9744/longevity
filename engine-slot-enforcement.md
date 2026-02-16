# Task: Enforce slot-based exercise selection for strength emphasis days (weekly plan)

## Goal
Fix weekly strength day generation so LOWER/PUSH/PULL days always include the correct movement-pattern slots, instead of just filtering a pool and taking the first N.

## Scope
- Update backend weekly plan generation code where strength day exercises are chosen.
- Keep deterministic behavior (same inputs => same outputs).
- Add/adjust tests to assert slot presence.
- Do not change API responses or database schema.

---

## Current Problem
`getStrengthExercisePoolByEmphasis(...)` only filters `exercisePool`. Downstream selection takes first N, so LOWER days can miss a squat even though squat candidates exist.

---

## Required Behavior

### Deterministic slot picker
Implement a helper to choose exercises by ordered slots:

- Input: full `exercisePool`, `seedKey`, `slots[]`
- For each slot in order:
  - filter candidates by `movementPattern in slot.patterns`
  - optionally filter by extra rules (see below)
  - sort deterministically using existing `deterministicOrder(candidates, seedKey + ":" + slotKey)`
  - pick the first candidate not already selected
  - if none found and slot.required=true: add a session note like `"Missing required slot: squat"` and continue
- After slot picks, if still need more exercises (targetCount not met), fill from an allowed fallback pattern set while avoiding duplicates.

### Target count
For now, keep existing count behavior if already implemented (likely 5). If it’s always 5, keep 5.
(Do not implement readiness/fatigue-based 4–6 unless it already exists.)

---

## Slot Templates

### LOWER (emphasis="lower") targetCount=5
Slots (in order):
1) squat REQUIRED patterns=["squat"]
2) hinge REQUIRED patterns=["hinge"]
3) unilateral patterns=["lunge"] (required if targetCount>=5)
4) core/carry patterns=["core","carry"]
5) stability patterns=["balance","mobility","warmup"]

Fallback fill patterns (if needed): ["squat","hinge","lunge","core","carry","balance","mobility","warmup"].

### PUSH (emphasis="push") targetCount=5
Slots:
1) push_primary REQUIRED patterns=["push","overhead_push"]
2) push_secondary REQUIRED patterns=["push","overhead_push"] (must be different id than #1)
3) push_accessory patterns=["push","overhead_push"]
4) pull_shoulder_health patterns=["pull","overhead_pull"]
5) core_or_mobility patterns=["core","carry","mobility","warmup","balance"]

Fallback fill patterns: ["push","overhead_push","pull","overhead_pull","core","carry","mobility","warmup","balance"].

### PULL (emphasis="pull") targetCount=5
Slots:
1) pull_primary REQUIRED patterns=["pull","overhead_pull"]
2) pull_secondary REQUIRED patterns=["pull","overhead_pull"] (different id)
3) pull_accessory patterns=["pull","overhead_pull"]
4) push_joint_balance patterns=["push","overhead_push"]
5) core_or_mobility patterns=["core","carry","mobility","warmup","balance"]

Fallback fill patterns: ["pull","overhead_pull","push","overhead_push","core","carry","mobility","warmup","balance"].

---

## Implementation Notes
- Do NOT rely on category names to enforce squat/hinge; use `movementPattern`.
- Continue to use `deterministicOrder(...)` so output is stable for a given week.
- Ensure the final returned list is in the slot order (not randomized).

---

## Tests
Update/add tests so that weekly plan strength days satisfy:
- LOWER day includes at least one exercise with movementPattern="squat" AND one with "hinge" when available in pool.
- PUSH day includes >=3 exercises with movementPattern in ["push","overhead_push"].
- PULL day includes >=3 exercises with movementPattern in ["pull","overhead_pull"].
- Determinism: same inputs => same output.
- If required slot has no candidates, session notes contain "Missing required slot: <slot>".

---

## Acceptance Criteria
- LOWER strength day always includes a true squat-pattern exercise when any exist.
- PUSH and PULL days are emphasis-dominant per above.
- `npm test` passes.
