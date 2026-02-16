# Task: Add hardcoded strength templates and use “balanced” template for balanced goal

## Goal
Introduce a lightweight, hardcoded template layer in the engine so strength sessions follow a consistent structure. For goal="balanced", every strength day must include push + pull + core, while still respecting the day emphasis (lower/push/pull).

## Scope
Engine only + any required backend type updates for /plans/week. Keep endpoints unchanged.

---

## Engine requirements (packages/engine)

### 1) Add template types
Add:
- StrengthTemplate = "balanced" | "strength" | "mobility"
- resolveStrengthTemplate(goal: TrainingGoal): StrengthTemplate
  - goal "balanced" -> "balanced"
  - goal "strength" -> "strength"
  - goal "mobility" -> "mobility"

### 2) Implement balanced template slot plan
For strength sessions when template === "balanced":
Return EXACTLY 5 exercises, filled by deterministic selection, with these slot rules:

#### Common slots (always present)
- 1 PUSH slot: movementPattern in ["push","overhead_push"]
- 1 PULL slot: movementPattern in ["pull","overhead_pull"]
- 1 CORE slot: movementPattern in ["core","carry"]

#### Emphasis slot (varies)
- If emphasis === "lower": movementPattern in ["squat","hinge","lunge","calf","balance"]
- If emphasis === "push": movementPattern in ["push","overhead_push"]
- If emphasis === "pull": movementPattern in ["pull","overhead_pull"]

#### Stability/Mobility slot (always present)
- Prefer category === "mobility" OR movementPattern in ["mobility","warmup","balance"]
- If none available, fall back to any accessory in the emphasis pool.

### 3) Deterministic selection
- Implement a helper that selects the “best” exercise for a slot deterministically using existing seed/date ordering.
- Ensure no duplicates across slots:
  - If a chosen exercise conflicts with an already chosen id, pick the next candidate deterministically.

### 4) Integration points
Where weekly plan creates strength sessions:
- Determine template via resolveStrengthTemplate(goal)
- If template === "balanced":
  - Build a slot-based filtered pool and pass ONLY the selected 5 exercise definitions into generateSession() as input.exercisePool
  - generateSession remains unchanged; it just assigns sets/reps/intensity.

### 5) Keep previous balance nudges compatible
If any existing “push day includes 1 pull” or “lower includes 1 core/carry” logic exists, replace it with this unified template behavior for goal="balanced".

### 6) Tests
Add/extend engine tests:
- For goal="balanced", for each emphasis day (lower/push/pull):
  - Session has exactly 5 exercises
  - Contains at least one PUSH movement
  - Contains at least one PULL movement
  - Contains at least one CORE/CARRY movement
  - Contains 1 stability/mobility/balance/warmup slot
  - Still includes its emphasis slot (lower/push/pull respectively) when available in pool
- Determinism: same inputs -> same output

---

## Backend
No endpoint changes required.
If /plans/week types need updating to reflect any new fields, update schemas only.

---

## Acceptance Criteria
- /plans/week strength sessions for balanced goal are always structured: push + pull + core + emphasis + stability.
- push/pull/lower strength days are no longer “mono-pattern” days under balanced goal.
- npm test passes.
