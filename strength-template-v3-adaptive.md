# Task: Implement Strength Template v3 (Adaptive 4–6 exercises) for balanced goal

## Goal
For goal="balanced", strength days must follow strict emphasis-based templates with adaptive volume (4–6 exercises) based on readiness + fatigue. Lower days must always include a true squat slot and hinge slot.

## Scope
Engine selection logic + tests. No API changes.

---

## Adaptive volume rules
Compute `readinessScore` from the same readiness fields already used (sleep/energy/soreness/stress).
Use progression.fatigueScore.

Choose target exercise count:
- If readinessScore >= 2 AND fatigueScore <= 4 => 6 exercises
- Else if readinessScore < 0 OR fatigueScore >= 7 => 4 exercises
- Else => 5 exercises

---

## Strength templates (goal="balanced")

### LOWER day (emphasis="lower")
Always include (in this order):
1) Squat REQUIRED: movementPattern === "squat" (prefer category "compound")
2) Hinge REQUIRED: movementPattern === "hinge" (prefer category "compound")

Then fill remaining slots depending on target count:

If targetCount = 6:
3) Unilateral: movementPattern === "lunge"
4) Core/Carry: movementPattern in ["core","carry"] (prefer "carry" if available)
5) Lower mobility/stability: movementPattern in ["mobility","balance","warmup"] with muscleGroup in ["hips","ankles","legs"] preferred
6) Lower accessory (optional): movementPattern in ["hinge","squat","lunge"] BUT must be category "accessory" or difficulty <= 2 (avoid duplicating exact ids)

If targetCount = 5:
3) Unilateral: "lunge"
4) Core/Carry: ["core","carry"]
5) Lower mobility/stability (same rule)

If targetCount = 4:
3) Core/Carry
4) Lower mobility/stability
(omit unilateral)

If squat or hinge slot has no candidates, fall back to existing behavior but add a note in session.notes indicating missing slot.

### PUSH day (emphasis="push")
Base required:
- Push slots must dominate (minimum 2 pushes even in 4-exercise day)

If targetCount = 6:
1) Push primary: movementPattern in ["push","overhead_push"] prefer compound
2) Push secondary: ["push","overhead_push"] prefer different equipment or category than #1
3) Push accessory: ["push","overhead_push"] prefer accessory/machine/cable
4) Pull shoulder-health: movementPattern in ["pull","overhead_pull"] prefer muscleGroup in ["shoulders","back"], difficulty <=2
5) Core/Carry: ["core","carry"]
6) Upper mobility: ["mobility","warmup","balance"] with muscleGroup in ["shoulders","t_spine","chest"] preferred

If targetCount = 5:
1) Push primary
2) Push secondary
3) Pull shoulder-health
4) Core/Carry OR Upper mobility (prefer core if none already)
5) Remaining slot = Push accessory OR Upper mobility (choose to ensure 3 pushes if possible)

If targetCount = 4:
1) Push primary
2) Push secondary
3) Pull shoulder-health
4) Core OR Upper mobility

### PULL day (emphasis="pull")
Mirror of push.

If targetCount = 6:
1) Pull primary: ["pull","overhead_pull"] prefer compound
2) Pull secondary: ["pull","overhead_pull"] prefer different equipment/category than #1
3) Pull accessory: ["pull","overhead_pull"] prefer accessory/cable
4) Push joint-balance: ["push","overhead_push"] prefer machine/cable/landmine, difficulty <=2
5) Core/Carry: ["core","carry"]
6) Upper mobility: ["mobility","warmup","balance"] with muscleGroup in ["shoulders","t_spine","chest"] preferred

If targetCount = 5:
1) Pull primary
2) Pull secondary
3) Push joint-balance
4) Core/Carry OR Upper mobility
5) Remaining slot = Pull accessory OR Upper mobility (choose to ensure 3 pulls if possible)

If targetCount = 4:
1) Pull primary
2) Pull secondary
3) Push joint-balance
4) Core OR Upper mobility

---

## Deterministic selection
Implement a single deterministic slot-filler helper:
- filters candidates per slot
- sorts deterministically with existing seed/date logic
- picks first available not yet used
- if conflict, pick next
- if a slot is optional and no candidates, skip it and proceed

---

## Integration
Weekly plan generator must:
- compute targetCount per strength day using that day’s readiness + progression
- select exercises with template rules
- pass the selected subset to generateSession()

generateSession() set/reps/intensity logic remains unchanged.

---

## Tests
Add/extend engine tests that cover:
- For each emphasis (lower/push/pull), for each targetCount scenario (4/5/6):
  - correct minimum pattern presence rules
  - lower must contain squat+hinge when available
  - push/pull must contain at least 2 of their emphasis patterns in 4-exercise case
  - determinism: same inputs => same results
- Also include one test where squat candidates are absent to ensure fallback note is added.

Update coverage thresholds if needed (prefer adding branches to hit 80%+ rather than lowering thresholds).

---

## Acceptance Criteria
- Balanced goal strength sessions are 4–6 exercises depending on readiness/fatigue.
- Lower day strictly includes squat + hinge when available.
- Push and Pull days remain emphasis-dominant with joint-balance + core/mobility support.
- npm test passes.
