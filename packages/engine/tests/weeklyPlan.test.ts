import { describe, expect, it } from "vitest";
import { generateWeeklyPlan } from "../src/index.js";
import type { ExerciseDefinition } from "../src/types.js";

const weeklyExercisePool: ExerciseDefinition[] = [
  {
    id: "strength-squat",
    name: "Goblet Squat",
    category: "compound",
    movementPattern: "squat",
    muscleGroup: "legs",
    equipment: "dumbbell",
    difficulty: 1
  },
  {
    id: "strength-push",
    name: "Dumbbell Press",
    category: "compound",
    movementPattern: "push",
    muscleGroup: "chest",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "strength-pull",
    name: "Cable Row",
    category: "accessory",
    movementPattern: "pull",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: 1
  },
  {
    id: "strength-hinge",
    name: "Romanian Deadlift",
    category: "compound",
    movementPattern: "hinge",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: 2
  },
  {
    id: "strength-lunge",
    name: "Split Squat",
    category: "compound",
    movementPattern: "lunge",
    muscleGroup: "legs",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "strength-calf",
    name: "Standing Calf Raise",
    category: "accessory",
    movementPattern: "calf",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "strength-overhead-push",
    name: "Dumbbell Shoulder Press",
    category: "compound",
    movementPattern: "overhead_push",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "strength-push-incline",
    name: "Incline Dumbbell Press",
    category: "compound",
    movementPattern: "push",
    muscleGroup: "chest",
    equipment: "dumbbell",
    difficulty: 2
  },
  {
    id: "strength-overhead-push-landmine",
    name: "Half-Kneeling Landmine Press",
    category: "compound",
    movementPattern: "overhead_push",
    muscleGroup: "shoulders",
    equipment: "landmine",
    difficulty: 2
  },
  {
    id: "strength-overhead-pull",
    name: "Lat Pulldown",
    category: "accessory",
    movementPattern: "overhead_pull",
    muscleGroup: "back",
    equipment: "cable",
    difficulty: 1
  },
  {
    id: "strength-pull-row-supported",
    name: "Chest-Supported Row",
    category: "accessory",
    movementPattern: "pull",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: 1
  },
  {
    id: "strength-pull-face-pull",
    name: "Face Pull",
    category: "accessory",
    movementPattern: "overhead_pull",
    muscleGroup: "shoulders",
    equipment: "cable",
    difficulty: 1
  },
  {
    id: "carry-1",
    name: "Farmer Carry",
    category: "accessory",
    movementPattern: "carry",
    muscleGroup: "full_body",
    equipment: "dumbbell",
    difficulty: 1
  },
  {
    id: "mobility-1",
    name: "90/90 Hip Switch",
    category: "mobility",
    movementPattern: "mobility",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "mobility-2",
    name: "Thoracic Rotation",
    category: "mobility",
    movementPattern: "mobility",
    muscleGroup: "back",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "mobility-3",
    name: "Wall Slide",
    category: "mobility",
    movementPattern: "mobility",
    muscleGroup: "shoulders",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "warmup-1",
    name: "Cat-Cow Flow",
    category: "accessory",
    movementPattern: "warmup",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: 1
  },
  {
    id: "condition-1",
    name: "Incline Walk",
    category: "conditioning",
    movementPattern: "warmup",
    muscleGroup: "full_body",
    equipment: "machine",
    difficulty: 1
  },
  {
    id: "condition-2",
    name: "Bike Erg",
    category: "conditioning",
    movementPattern: "warmup",
    muscleGroup: "full_body",
    equipment: "machine",
    difficulty: 1
  },
  {
    id: "recovery-1",
    name: "Box Breathing",
    category: "accessory",
    movementPattern: "core",
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: 1
  }
];

describe("weekly plan non-strength sessions", () => {
  it("uses balanced template slots for lower/push/pull strength days", () => {
    const first = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool: weeklyExercisePool,
      seed: 120
    });

    const second = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool: weeklyExercisePool,
      seed: 120
    });

    expect(first).toEqual(second);

    const strengthDays = first.days.filter((day) => day.type === "strength");
    expect(strengthDays).toHaveLength(3);

    const lowerDay = strengthDays.find((day) => day.emphasis === "lower");
    const pushDay = strengthDays.find((day) => day.emphasis === "push");
    const pullDay = strengthDays.find((day) => day.emphasis === "pull");

    expect(lowerDay).toBeDefined();
    expect(pushDay).toBeDefined();
    expect(pullDay).toBeDefined();

    const idToExercise = new Map(weeklyExercisePool.map((exercise) => [exercise.id, exercise]));
    const expectBalancedSlots = (day: NonNullable<typeof lowerDay>, emphasis: "lower" | "push" | "pull"): void => {
      const defs = day.session.exercises
        .map((exercise) => idToExercise.get(exercise.exerciseId))
        .filter((exercise): exercise is ExerciseDefinition => Boolean(exercise));
      const countMatching = (patterns: Array<ExerciseDefinition["movementPattern"]>): number =>
        defs.filter((exercise) => patterns.includes(exercise.movementPattern)).length;

      expect(day.session.exercises).toHaveLength(5);

      if (emphasis === "lower") {
        expect(countMatching(["squat"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["hinge"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["lunge"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["core", "carry"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["mobility", "warmup", "balance"])).toBeGreaterThanOrEqual(1);
      }

      if (emphasis === "push") {
        expect(countMatching(["push", "overhead_push"])).toBeGreaterThanOrEqual(3);
        expect(countMatching(["pull", "overhead_pull"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["core", "carry", "mobility", "warmup", "balance"])).toBeGreaterThanOrEqual(1);
      }

      if (emphasis === "pull") {
        expect(countMatching(["pull", "overhead_pull"])).toBeGreaterThanOrEqual(3);
        expect(countMatching(["push", "overhead_push"])).toBeGreaterThanOrEqual(1);
        expect(countMatching(["core", "carry", "mobility", "warmup", "balance"])).toBeGreaterThanOrEqual(1);
      }
    };

    expectBalancedSlots(lowerDay, "lower");
    expectBalancedSlots(pushDay, "push");
    expectBalancedSlots(pullDay, "pull");
  });

  it("adds deterministic explicit sessions for mobility, zone2, and recovery days", () => {
    const first = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool: weeklyExercisePool,
      seed: 117
    });

    const second = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool: weeklyExercisePool,
      seed: 117
    });

    expect(first).toEqual(second);

    const mobilityDays = first.days.filter((day) => day.type === "mobility");
    const zone2Days = first.days.filter((day) => day.type === "zone2");
    const recoveryDays = first.days.filter((day) => day.type === "recovery");

    expect(mobilityDays.length).toBeGreaterThan(0);
    expect(zone2Days.length).toBeGreaterThan(0);
    expect(recoveryDays.length).toBeGreaterThan(0);

    mobilityDays.forEach((day) => {
      expect(day.session?.exercises.length ?? 0).toBeGreaterThan(0);
    });

    zone2Days.forEach((day) => {
      const count = day.session?.exercises.length ?? 0;
      expect(count).toBeGreaterThanOrEqual(1);
      expect(count).toBeLessThanOrEqual(2);
    });

    recoveryDays.forEach((day) => {
      const sessionExercises = day.session?.exercises ?? [];
      const selectedDefs = sessionExercises
        .map((exercise) => weeklyExercisePool.find((candidate) => candidate.id === exercise.exerciseId))
        .filter((exercise): exercise is ExerciseDefinition => Boolean(exercise));
      const conditioning = selectedDefs.filter((exercise) => exercise.category === "conditioning");
      const breathingCore = selectedDefs.filter((exercise) => {
        const token = `${exercise.name} ${exercise.id}`.toLowerCase();
        return token.includes("breathing") || exercise.id.toLowerCase().includes("breathing") || exercise.movementPattern === "core";
      });
      const mobility = selectedDefs.filter((exercise) => exercise.category === "mobility");

      expect(sessionExercises.length).toBeGreaterThanOrEqual(3);
      expect(sessionExercises.length).toBeLessThanOrEqual(4);
      expect(conditioning).toHaveLength(1);
      expect(breathingCore).toHaveLength(1);
      expect(mobility.length).toBeGreaterThanOrEqual(1);
      expect(mobility.length).toBeLessThanOrEqual(2);
    });
  });

  it("keeps deterministic non-balanced strength template behavior", () => {
    const first = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 4,
      goal: "strength",
      progression: { strengthLevel: 4, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      readinessTrend: { avgSleep: 7.5, avgEnergy: 3, avgSoreness: 2, avgStress: 2 },
      exercisePool: weeklyExercisePool,
      seed: 121
    });

    const second = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 4,
      goal: "strength",
      progression: { strengthLevel: 4, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      readinessTrend: { avgSleep: 7.5, avgEnergy: 3, avgSoreness: 2, avgStress: 2 },
      exercisePool: weeklyExercisePool,
      seed: 121
    });

    expect(first).toEqual(second);

    const strengthDays = first.days.filter((day) => day.type === "strength");
    expect(strengthDays).toHaveLength(4);
    expect(strengthDays.some((day) => day.emphasis === "full_body_light")).toBe(true);
    expect(strengthDays.every((day) => day.session.exercises.length === 5)).toBe(true);
  });

  it("adds a fallback note when lower template cannot find a squat slot", () => {
    const noSquatPool = weeklyExercisePool.filter((exercise) => exercise.movementPattern !== "squat");

    const plan = generateWeeklyPlan({
      weekStart: "2026-02-16",
      strengthDays: 3,
      goal: "balanced",
      progression: { strengthLevel: 3, volumeLevel: 4, fatigueScore: 2, deloadCount: 0 },
      exercisePool: noSquatPool,
      seed: 120
    });

    const lowerDay = plan.days.find((day) => day.type === "strength" && day.emphasis === "lower");
    expect(lowerDay).toBeDefined();
    expect(lowerDay?.session.notes).toContain("Missing required slot: squat");
  });
});
