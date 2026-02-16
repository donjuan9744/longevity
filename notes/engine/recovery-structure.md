# Task: Enforce structured recovery day composition

## Goal
Recovery days must always include:
1) 1 light conditioning movement (walk / low-impact cardio)
2) 1 breathing or core control movement
3) 1–2 mobility drills

Selection must be deterministic from the database.

---

## Engine Changes (packages/engine)

### 1. Modify generateWeeklyPlan recovery logic

Inside recovery day generation:

Instead of randomly selecting from mobility/accessory pool,
apply this structure:

#### A) Conditioning (required – exactly 1)
Select from:
- category === "conditioning"
AND difficulty <= 2

Prefer:
- walk
- bike steady
- incline walk
- row steady
- swim steady

Return:
- sets: 1
- reps: minutes (existing day minutes value)
- intensity: 5

---

#### B) Breathing/Core Control (required – exactly 1)

Select from exercises where:
- name contains "Breathing"
OR id contains "breathing"
OR movementPattern === "core"
AND difficulty <= 2

Return:
- sets: 2
- reps: 8–12 (or 60 seconds represented as 60 reps)
- intensity: 5

---

#### C) Mobility (required – 1 or 2 exercises)

Select from:
- category === "mobility"
AND difficulty <= 2

Return:
- sets: 2–3
- reps: 10–30
- intensity: 5–6

---

### 2. Determinism
Selections must use same deterministic ordering + seed logic as strength/mobility days.

Do NOT allow duplicates.

---

### 3. Output Shape

Recovery day must return:

{
  type: "recovery",
  minutes: number,
  session: {
    exercises: SessionExercise[],
    engineVersion: "v1",
    notes?: string[]
  }
}

---

### 4. Tests

Update engine tests:

Assert that recovery days:
- Always include 1 conditioning
- Always include 1 breathing/core
- Always include at least 1 mobility
- Total exercises count = 3–4

---

## Acceptance Criteria

- Recovery days are no longer generic.
- Every recovery day includes walk/cardio + breathing + mobility.
- Deterministic output.
- npm test passes.
