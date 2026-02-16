# Task: Implement Strength Template v2 (Emphasis-Dominant 3-1-1) for balanced goal

## Goal
Replace the current “balanced template” strength selection with a clearer longevity-first template:
- LOWER day: 3 lower (squat + hinge + unilateral) + 1 core + 1 lower-specific mobility/stability
- PUSH day: 3 push + 1 pull (shoulder health) + 1 core OR mobility (upper-specific preferred)
- PULL day: 3 pull + 1 push (joint balance) + 1 core OR mobility (upper-specific preferred)

Keep deterministic output.

---

## Scope
Engine selection logic only (plus tests). No API changes.

---

## Definitions
Use existing `ExerciseDefinition` fields:
- movementPattern: one of "squat","hinge","lunge","push","overhead_push","pull","overhead_pull","core","carry","balance","mobility","warmup"
- category: "compound" | "accessory" | "mobility" | "conditioning"
- muscleGroup (used for bias): e.g. "hips","ankles","legs","shoulders","back","chest","core","full_body", etc.

Template applies when goal === "balanced" (as previously decided).

---

## Implementation Requirements

### 1) Create a slot-based selector helper
Add a helper in engine (new file ok), e.g.:
- `packages/engine/src/templateSelect.ts`

It must:
- accept (exercisePool, seed, slotDefinitions[])
- deterministically pick 1 exercise per slot
- avoid duplicates (if conflict, take next candidate deterministically)
- if a slot has no candidates, fall back to the next-most-compatible pool per rules below

### 2) Slot rules for strength days (goal="balanced")

#### LOWER strength day (emphasis="lower") — exactly 5 exercises
Slots (in order):
1. Squat slot: movementPattern === "squat" (prefer category "compound")
2. Hinge slot: movementPattern === "hinge" (prefer category "compound")
3. Unilateral slot: movementPattern === "lunge" (prefer category "compound" then accessory)
4. Core slot: movementPattern in ["core","carry"] (prefer "carry" if equipment not "bodyweight" is available)
5. Lower mobility/stability slot:
   - Prefer movementPattern in ["mobility","balance","warmup"]
   - AND muscleGroup in ["hips","ankles","legs"]
   - OR id/name contains hip/ankle keywords (optional, best-effort)
   - If none, allow any mobility/balance/warmup
   - If still none, allow any accessory lower (squat/hinge/lunge)

#### PUSH strength day (emphasis="push") — exactly 5 exercises
Slots:
1. Push slot (primary): movementPattern in ["push","overhead_push"] (prefer compound)
2. Push slot (secondary): movementPattern in ["push","overhead_push"] (prefer a different movementPattern than slot 1 if possible)
3. Push slot (accessory): movementPattern in ["push","overhead_push"] (prefer accessory or machine/cable)
4. Shoulder-health pull slot:
   - movementPattern in ["pull","overhead_pull"]
   - prefer muscleGroup in ["shoulders","back"]
   - prefer difficulty <= 2
5. Core or upper mobility slot:
   - Prefer movementPattern in ["core","carry"]
   - OR mobility/balance/warmup with muscleGroup in ["shoulders","t_spine","chest"]
   - If none, allow any core/mobility/balance/warmup

#### PULL strength day (emphasis="pull") — exactly 5 exercises
Slots:
1. Pull slot (primary): movementPattern in ["pull","overhead_pull"] (prefer compound)
2. Pull slot (secondary): movementPattern in ["pull","overhead_pull"] (prefer different from slot 1 if possible)
3. Pull slot (accessory): movementPattern in ["pull","overhead_pull"] (prefer accessory or cable)
4. Joint-balance push slot:
   - movementPattern in ["push","overhead_push"]
   - prefer difficulty <= 2 and joint-friendly (machine/cable/landmine if available)
5. Core or upper mobility slot:
   - Prefer movementPattern in ["core","carry"]
   - OR mobility/balance/warmup with muscleGroup in ["shoulders","t_spine","chest"]
   - If none, allow any core/mobility/balance/warmup

### 3) Integrate into weekly plan generation
Wherever weekly plan generates strength sessions for balanced goal:
- Use the slot selector to choose exactly 5 exercises (ExerciseDefinition[])
- Pass ONLY those into `generateSession({ exercisePool: selected5, ... })`
- Keep existing determinism (seed from date)

### 4) Intensity/sets behavior
Do not change current intensity/sets logic in `generateSession()`.

---

## Tests (engine)
Update/add tests to assert structure:

- For LOWER day:
  - includes at least one "squat", one "hinge", one "lunge"
  - includes one "core" or "carry"
  - includes one mobility/balance/warmup biased to hips/ankles/legs when available

- For PUSH day:
  - includes 3 pushes (push/overhead_push)
  - includes 1 pull/overhead_pull
  - includes 1 core/carry OR upper mobility when available

- For PULL day:
  - includes 3 pulls (pull/overhead_pull)
  - includes 1 push/overhead_push
  - includes 1 core/carry OR upper mobility when available

- Determinism: same inputs => same outputs.

---

## Acceptance Criteria
- `/plans/week` strength days follow the 3-1-1 template for balanced goal.
- Lower days feel like real lower days (squat+hinge+unilateral present).
- Push days include a shoulder-health pull slot.
- Pull days include a joint-balance push slot.
- `npm test` passes.
