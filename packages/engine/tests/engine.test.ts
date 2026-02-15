import { describe, expect, it } from "vitest";
import { evaluateDeload, generateSession, updateProgression } from "../src/index.js";
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
});
