import { describe, expect, it } from "vitest";
import { evaluateDeload, generateSession, generateWeeklyPlan, updateProgression } from "../src/index.js";
import { resolveAdaptiveStrengthTargetCount } from "../src/generateWeeklyPlan.js";
import type { ExerciseDefinition } from "../src/types.js";

const exercisePool: ExerciseDefinition[] = [
  {
    id: "squat-goblet",
    name: "Goblet Squat",
    category: "compound",
    movementPattern: "squat",
    muscleGroup: "legs",
    equipment: "dumbbell",
    difficulty: 1
  },
  {
    id: "hinge-rdl",
    name: "Romanian Deadlift",
    category: "compound",
    movementPattern: "hinge",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: 2
  },
  {
    id: "push-db-press",
    name: "Dumbbell Press",
    category: "compound",
    movementPattern: "push",
    muscleGroup: "chest",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "pull-row",
    name: "Cable Row",
    category: "accessory",
    movementPattern: "pull",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: 1
  },
  {
    id: "core-plank",
    name: "Plank",
    category: "accessory",
    movementPattern: "core",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "mobility-90-90",
    name: "90/90 Hip Switch",
    category: "mobility",
    movementPattern: "mobility",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "conditioning-incline-walk",
    name: "Incline Walk",
    category: "conditioning",
    movementPattern: "warmup",
    muscleGroup: "full_body",
    equipment: "machine",
    difficulty: 1
  },
  {
    id: "carry-farmer",
    name: "Farmer Carry",
    category: "accessory",
    movementPattern: "carry",
    muscleGroup: "full_body",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "push-lateral-raise",
    name: "Lateral Raise",
    category: "accessory",
    movementPattern: "push",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    difficulty: 1
  },
  {
    id: "lunge-split-squat",
    name: "Split Squat",
    category: "compound",
    movementPattern: "lunge",
    muscleGroup: "legs",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "push-overhead-press",
    name: "Overhead Press",
    category: "compound",
    movementPattern: "overhead_push",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "pull-lat-pulldown",
    name: "Lat Pulldown",
    category: "accessory",
    movementPattern: "overhead_pull",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: 1
  },
  {
    id: "warmup-cat-cow",
    name: "Cat-Cow",
    category: "accessory",
    movementPattern: "warmup",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: 1
  }
];

describe("engine", () => {
  it("generates deterministic sessions", () => {
    const first = generateSession({
      date: "2026-02-15",
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      readiness: { sleepHours: 8, energy: 4, soreness: 1, stress: 1 },
      exercisePool,
      seed: 99
    });

    const second = generateSession({
      date: "2026-02-15",
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      readiness: { sleepHours: 8, energy: 4, soreness: 1, stress: 1 },
      exercisePool,
      seed: 99
    });

    expect(first).toEqual(second);
    expect(first.engineVersion).toBe("v1");
    expect(first.exercises).toHaveLength(5);

    const selectedById = new Map(exercisePool.map((exercise) => [exercise.id, exercise]));
    const selectedDefs = first.exercises
      .map((exercise) => selectedById.get(exercise.exerciseId))
      .filter((exercise): exercise is ExerciseDefinition => Boolean(exercise));

    const selectedPatterns = new Set(selectedDefs.map((exercise) => exercise.movementPattern));
    const selectedCategories = new Set(selectedDefs.map((exercise) => exercise.category));

    expect([...selectedPatterns].some((pattern) => ["squat", "hinge", "lunge"].includes(pattern as string))).toBe(true);
    expect([...selectedPatterns].some((pattern) => ["push", "overhead_push"].includes(pattern as string))).toBe(true);
    expect([...selectedPatterns].some((pattern) => ["pull", "overhead_pull"].includes(pattern as string))).toBe(true);
    expect([...selectedPatterns].some((pattern) => ["core", "carry"].includes(pattern as string))).toBe(true);
    expect(
      selectedCategories.has("mobility") || [...selectedPatterns].some((pattern) => ["mobility", "warmup"].includes(pattern as string))
    ).toBe(true);

    const uniqueExerciseIds = new Set(first.exercises.map((exercise) => exercise.exerciseId));
    expect(uniqueExerciseIds.size).toBe(first.exercises.length);
  });

  it("updates progression based on successful completion", () => {
    const next = updateProgression({
      previous: { strengthLevel: 4, volumeLevel: 4, fatigueScore: 5, deloadCount: 0 },
      results: [
        {
          exerciseId: "squat-goblet",
          plannedSets: 3,
          plannedReps: 8,
          completedSets: 3,
          completedReps: 8,
          rpe: 8
        }
      ]
    });

    expect(next.strengthLevel).toBe(5);
    expect(next.volumeLevel).toBe(5);
  });

  it("recommends deload with high fatigue and poor completion", () => {
    const decision = evaluateDeload({
      fatigueScore: 9,
      averageRpe: 8.8,
      completionRate: 0.7
    });

    expect(decision.shouldDeload).toBe(true);
  });

  it("generates deterministic weekly plans with strength and recovery days", () => {
    const first = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool,
      seed: 77
    });

    const second = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool,
      seed: 77
    });

    expect(first).toEqual(second);
    expect(first.engineVersion).toBe("v1-weekly");
    expect(first.days).toHaveLength(7);
    expect(first.days.filter((day) => day.type === "strength")).toHaveLength(3);
    expect(first.days.filter((day) => day.type !== "strength")).toHaveLength(4);
  });

  it("balanced lower day includes squat, hinge, and lunge within targetCount exercises", () => {
    const plan = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool,
      seed: 120
    });

    const targetCount = resolveAdaptiveStrengthTargetCount(undefined, 2);
    const lowerDay = plan.days.find((day) => day.type === "strength" && day.emphasis === "lower");
    expect(lowerDay).toBeDefined();

    const idToExercise = new Map(exercisePool.map((exercise) => [exercise.id, exercise]));
    const selectedPatterns = new Set(
      (lowerDay?.session.exercises.slice(0, targetCount) ?? [])
        .map((exercise) => idToExercise.get(exercise.exerciseId)?.movementPattern)
        .filter((pattern): pattern is ExerciseDefinition["movementPattern"] => Boolean(pattern))
    );

    expect(lowerDay?.session.exercises).toHaveLength(targetCount);
    expect(selectedPatterns.has("squat")).toBe(true);
    expect(selectedPatterns.has("hinge")).toBe(true);
    expect(selectedPatterns.has("lunge")).toBe(true);
  });

  it("balanced push day stays push-dominant and avoids lower patterns unless required slots are missing", () => {
    const plan = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool,
      seed: 120
    });

    const pushDay = plan.days.find((day) => day.type === "strength" && day.emphasis === "push");
    expect(pushDay).toBeDefined();

    const idToExercise = new Map(exercisePool.map((exercise) => [exercise.id, exercise]));
    const pushPatterns = new Set<ExerciseDefinition["movementPattern"]>(["push", "overhead_push"]);
    const pullPatterns = new Set<ExerciseDefinition["movementPattern"]>(["pull", "overhead_pull"]);
    const coreMobilityPatterns = new Set<ExerciseDefinition["movementPattern"]>(["core", "carry", "mobility", "warmup", "balance"]);
    const lowerPatterns = new Set<ExerciseDefinition["movementPattern"]>(["squat", "hinge", "lunge"]);

    const patterns = (pushDay?.session.exercises ?? [])
      .map((exercise) => idToExercise.get(exercise.exerciseId)?.movementPattern)
      .filter((pattern): pattern is ExerciseDefinition["movementPattern"] => Boolean(pattern));

    const pushCount = patterns.filter((pattern) => pushPatterns.has(pattern)).length;
    const pullCount = patterns.filter((pattern) => pullPatterns.has(pattern)).length;
    const coreMobilityCount = patterns.filter((pattern) => coreMobilityPatterns.has(pattern)).length;
    const lowerCount = patterns.filter((pattern) => lowerPatterns.has(pattern)).length;
    const missingRequiredSlot = (pushDay?.session.notes ?? []).some((note) => note.includes("Missing required slot"));

    expect(pushCount).toBeGreaterThanOrEqual(2);
    expect(pushCount + pullCount + coreMobilityCount + lowerCount).toBe(patterns.length);
    expect(pullCount).toBeLessThanOrEqual(1);
    expect(coreMobilityCount).toBeLessThanOrEqual(1);
    if (lowerCount > 0) {
      expect(missingRequiredSlot).toBe(true);
    } else {
      expect(missingRequiredSlot).toBe(false);
    }
  });
});
