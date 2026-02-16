# Longevity Engine Contract (v1)

This document defines the REQUIRED behavior of the Longevity “engine” (package: `@longevity/engine`) and the weekly plan generator used by the backend. Any future refactor must preserve these rules unless this contract is explicitly updated.

---

## 1) Scope

The engine must:
- Generate a **single strength session** for a given date (`generateSession`)
- Generate a **weekly plan** with strength + active days (`generateWeeklyPlan`)
- Produce deterministic output given the same inputs
- Support “balanced” strength emphasis rotation across the week (lower / push / pull)
- Include structured sessions for non-strength days (zone2, mobility, recovery), not just minutes

Out of scope (unless added later):
- Periodized multi-week mesocycles
- Exercise contraindications/injuries
- Equipment availability personalization
- User-defined templates (planned for future)

---

## 2) Determinism (Hard Requirement)

Given identical inputs, outputs must be identical:
- Same `weekStart`, `seed`, `exercisePool`, `progression`, `goal`, and readiness trend → same plan and sessions
- Ordering must be deterministic (stable sort / seeded deterministic order)
- Deterministic selection must not depend on DB order, runtime randomness, or system time

---

## 3) Data Model Contract (ExerciseDefinition)

The engine consumes `ExerciseDefinition[]` with at least:
- `id: string`
- `name: string`
- `category: "compound" | "accessory" | "mobility" | "conditioning" | ...`
- `movementPattern: string` (examples used: squat, hinge, lunge, calf, balance, push, overhead_push, pull, overhead_pull, core, carry, mobility, warmup, conditioning)
- `difficulty: 1 | 2 | 3`

The engine must tolerate additional properties.

---

## 4) Weekly Plan Contract (generateWeeklyPlan)

### 4.1 Inputs
`GenerateWeeklyPlanInput` must support:
- `weekStart: YYYY-MM-DD`
- `strengthDays: 2 | 3 | 4 | 5`
- `goal: "balanced" | "strength" | "mobility"`
- `progression: { strengthLevel, volumeLevel, fatigueScore, deloadCount }`
- optional `readinessTrend: { avgSleep, avgEnergy, avgSoreness, avgStress }`
- `exercisePool: ExerciseDefinition[]`
- optional `seed: number`

### 4.2 Outputs
Returns:
- `engineVersion: "v1-weekly"`
- `days: DayPlan[]` of length 7
- Each day has `date: YYYY-MM-DD`
- Strength days include a `session` with `engineVersion: "v1"` and `exercises[]`
- Non-strength days include a structured `session` with `engineVersion: "v1"` and `exercises[]`

### 4.3 Strength Slot Distribution
Strength training days must be placed using a fixed slot schedule based on `strengthDays`:

- 2 days: [1, 4]
- 3 days: [0, 2, 4]
- 4 days: [0, 1, 3, 5]
- 5 days: [0, 1, 2, 4, 5]

(Indexes are within the 7-day week starting at `weekStart`.)

### 4.4 Balanced Emphasis Rotation (Required)
When `goal === "balanced"`:
- Strength day emphases rotate among: **lower → push → pull**
- Rotation must be deterministic and may shift based on seed, but must be stable for the same seed.

### 4.5 Adaptive Exercise Count
For balanced strength sessions, the engine chooses `targetCount` ∈ {4,5,6}:

- If readiness trend is strong AND fatigue low → 6
- If readiness trend is poor OR fatigue high → 4
- Otherwise → 5

This rule must remain deterministic and based only on provided readiness trend + fatigue score.

---

## 5) Balanced Strength Template Composition (Hard Requirements)

Balanced strength days are built from **slots**. The engine must fill required slots first, then optional slots, then fallback.

### 5.1 LOWER day (balanced)
Target: longevity-friendly lower day.

**Slot requirements:**
- MUST include **1 squat-pattern** exercise (`movementPattern === "squat"`) — required
- MUST include **1 hinge-pattern** exercise (`movementPattern === "hinge"`) — required
- MUST include **1 unilateral lower** exercise (`movementPattern === "lunge"`) — required when targetCount >= 5
- MUST include **1 core_or_carry** (`core` or `carry`)
- MUST include **1 stability** (`balance` or `mobility` or `warmup`)

**If targetCount == 4**, the unilateral slot may be omitted, but squat + hinge are still required.

**Resulting “ideal” lower day (for targetCount=5):**
- squat + hinge + lunge + core/carry + stability

### 5.2 PUSH day (balanced)
**Slot requirements:**
- MUST include **2 push-pattern** exercises (`push` or `overhead_push`) — required
- SHOULD include an additional push accessory if targetCount allows
- SHOULD include **1 shoulder-health pull** (`pull` or `overhead_pull`) (for balance)
- SHOULD include **1 core/carry/mobility/balance** slot

**Guardrail:**
- Push day should be mostly push (2–3 selections), not dominated by pull.

### 5.3 PULL day (balanced)
**Slot requirements:**
- MUST include **2 pull-pattern** exercises (`pull` or `overhead_pull`) — required
- SHOULD include an additional pull accessory if targetCount allows
- SHOULD include **1 push joint-balance** (`push` or `overhead_push`)
- SHOULD include **1 core/carry/mobility/balance** slot

**Guardrail:**
- Pull day should be mostly pull (2–3 selections), not dominated by push.

### 5.4 Fallback Rules
If a required slot cannot be filled due to missing exercises in the pool:
- The engine must add a note in `session.notes` such as `Missing required slot: <slotKey>`
- The engine should fill remaining slots using fallback patterns in this order:
  - lower fallback: squat, hinge, lunge, core, carry, balance, mobility, warmup
  - push fallback: push, overhead_push, pull, overhead_pull, core, carry, mobility, warmup, balance
  - pull fallback: pull, overhead_pull, push, overhead_push, core, carry, mobility, warmup, balance

### 5.5 Ordering
For balanced sessions built by slots:
- The returned session exercises should be **ordered according to slot order** (so the workout reads naturally).

---

## 6) Non-Strength Day Sessions (Hard Requirements)

Weekly plans must return a session object for:
- `mobility` days
- `zone2` days
- `recovery` days

These sessions use the same `SessionExercise[]` shape.

### 6.1 MOBILITY day
- Must select **~5 mobility drills** from the pool:
  - category == mobility OR movementPattern in {mobility, warmup}
- Each drill uses sets 2–3
- Reps are typically 10–12, OR 30 seconds for time-like drills (holds, stretches)

### 6.2 ZONE2 day
- Must select **1–2 conditioning** exercises from the pool (category == conditioning)
- Each conditioning entry uses:
  - sets: 1
  - reps: minutes (the day’s minutes)
  - intensity: ~6
- Include a note: “Zone 2 conversational pace.”

### 6.3 RECOVERY day
Must include:
- 1 easy conditioning item (difficulty <= 2) for the day’s minutes
- 1 breathing/core-control drill (difficulty <= 2)
- 1–2 mobility drills (difficulty <= 2)

Intensity should be ~5 and notes should encourage easy movement.

---

## 7) Single Session Generation (generateSession)

`generateSession` must:
- Accept `exercisePool` input and select up to 5 exercises (or fewer if pool smaller)
- Produce stable, deterministic selection based on date/seed
- Adjust sets/reps/intensity based on goal + progression + readiness signal
- Never output duplicate exercises within the same generated session

NOTE: For weekly balanced strength days, the weekly planner may pre-select the pool by slots before calling `generateSession`.

---

## 8) Invariants (Tests should enforce)

The following are required invariants:

### Weekly Plan Invariants
- Always returns exactly 7 days
- Strength days count matches `strengthDays`
- Strength days have `type: "strength"` and include `session.exercises.length` matching targetCount (unless the pool is too small)
- Balanced rotation uses only {lower, push, pull}
- Non-strength days include a `session` with exercises defined

### Balanced Day Invariants
- lower day must contain squat + hinge (and lunge when targetCount >= 5)
- push day must contain at least 2 push-pattern exercises when pool supports it
- pull day must contain at least 2 pull-pattern exercises when pool supports it
- No duplicates within a session

### Determinism Invariants
- Same inputs → identical outputs (deep equal)

---

## 9) Change Control

Any change that violates this contract requires:
1) Updating this contract
2) Updating/adding tests to reflect the new contract
3) A version bump in engine version strings (if behavior changes materially)

End.