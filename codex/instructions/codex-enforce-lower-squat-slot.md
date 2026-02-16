# Goal
Fix the "lower" strength day so it ALWAYS includes a true squat-pattern compound exercise (not accessory isolation like Leg Extension).

## Context
In packages/engine/src/generateWeeklyPlan.ts, the lower-day slot template includes a required "squat" slot:
- key: "squat"
- patterns: ["squat"]
- required: true

But our exercise pool includes entries that can make the lower day feel wrong if a squat-like slot is satisfied by non-compound / isolation-ish movements in practice or via fallback ordering.

## Required change
1) In `getSlotTemplate(emphasis, targetCount)`, for `emphasis === "lower"`, update the `squat` slot to enforce:
   - movementPattern must be "squat"
   - AND category must be `"compound"`
   - AND it must NOT match common isolation patterns by name/id like "leg-extension" (defensive filter)

   Example approach:
   - Add `extraFilter` to the squat slot:
     - `exercise.category === "compound"`
     - and `!exercise.id.includes("leg-extension")`
     - and `!exercise.name.toLowerCase().includes("extension")`

2) Also ensure the `hinge` required slot is similarly "real":
   - movementPattern "hinge"
   - category `"compound"` OR `"accessory"` is OK, but prefer compound (keep it simple: enforce compound as well if we have enough hinges; otherwise allow accessory).
   Implement as:
   - try compound-only hinge candidates first inside `pickExercisesBySlots` by using the slot extraFilter,
   - but DO NOT break generation if no compound hinge exists. (So hinge extraFilter should be lenient OR implement a two-pass inside the slot selection.)

### Simplest acceptable implementation
- Enforce strict compound squat slot via `extraFilter`.
- Do NOT add complexity for hinge beyond what exists now (optional), unless it’s easy.

## Validation
- Run `npm test` at repo root.
- Manually verify by running backend dev and calling weekly plan endpoint (or whichever curl you’ve been using) a few times for the same week:
  - The lower day should always contain at least one exercise where:
    - movementPattern == "squat"
    - category == "compound"
  - Confirm the lower day still includes hinge + unilateral when targetCount >= 5, plus core/carry and stability.

## Notes
- Make minimal changes.
- Keep deterministic behavior (don’t introduce randomness).
- Update dist build output only if your workflow already does so; otherwise just source.
