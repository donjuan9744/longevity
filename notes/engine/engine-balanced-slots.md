Goal: For balanced strength days (lower/push/pull), enforce strict slot composition and stop generateSession() from reshuffling the slot picks.

Make minimal changes in: packages/engine/src/generateWeeklyPlan.ts

Required behavior:
- When strengthTemplate === "balanced" AND emphasis !== "full_body_light":
  - Use buildBalancedTemplateExercisePoolV3(...) to select exercises (already exists).
  - DO NOT call generateSession() for these days.
  - Instead, create the GeneratedSession directly from the selected slot exercises, preserving slot order.
  - Exactly targetCount exercises should be returned (4/5/6 based on resolveAdaptiveStrengthTargetCount).
  - Sets/Reps/Intensity rules:
    - baseSets = clamp(3 + floor((progression.volumeLevel + progression.strengthLevel)/6), 2, 5)
    - For index 0: sets = baseSets
    - For others: sets = max(2, baseSets - 1)
    - reps:
      - if exercise.category === "mobility" OR movementPattern in ["mobility","warmup","balance"] => reps = 12 (or 30 if isTimeLikeExercise)
      - else reps = (goal === "strength" ? 6 : 8)
    - intensity:
      - strength moves => clamp(7 + floor(progression.strengthLevel/3) - (fatigueScore>=7 ? 1 : 0), 6, 9)
      - mobility/balance/warmup => 6
  - engineVersion stays "v1"
  - notes should include any selectionNotes from slot picking + any existing notes.

Keep full_body_light behavior unchanged (it can still use generateSession + adjustments).

Add/adjust tests in packages/engine/tests/engine.test.ts:
- New test: balanced lower day contains at least one squat and one hinge and one lunge in the first N exercises where N=targetCount.
- New test: push day contains only push/overhead_push plus optionally one pull/overhead_pull and one core/mobility slot; no lower patterns like squat/hinge/lunge unless pool lacks options (then add note "Missing required slot").
- Ensure tests pass with existing thresholds.
