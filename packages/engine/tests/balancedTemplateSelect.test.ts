import { describe, expect, it } from "vitest";
import { buildBalancedTemplateExercisePoolV3, resolveAdaptiveStrengthTargetCount } from "../src/generateWeeklyPlan.js";
import type { ExerciseDefinition } from "../src/types.js";

function createExercise(
  id: string,
  movementPattern: ExerciseDefinition["movementPattern"],
  overrides: Partial<ExerciseDefinition> = {}
): ExerciseDefinition {
  return {
    id,
    name: id,
    category: "accessory",
    movementPattern,
    muscleGroup: "core",
    equipment: "bodyweight",
    difficulty: 2,
    ...overrides
  };
}

const templatePool: ExerciseDefinition[] = [
  createExercise("squat-compound", "squat", { category: "compound", muscleGroup: "legs", equipment: "barbell" }),
  createExercise("squat-accessory", "squat", { category: "accessory", muscleGroup: "legs" }),
  createExercise("hinge-compound", "hinge", { category: "compound", muscleGroup: "legs", equipment: "barbell" }),
  createExercise("hinge-accessory", "hinge", { category: "accessory", muscleGroup: "legs" }),
  createExercise("lunge-compound", "lunge", { category: "compound", muscleGroup: "legs", equipment: "dumbbell" }),
  createExercise("lunge-accessory", "lunge", { category: "accessory", muscleGroup: "legs" }),
  createExercise("push-compound-a", "push", { category: "compound", muscleGroup: "chest", equipment: "barbell" }),
  createExercise("push-compound-b", "push", { category: "compound", muscleGroup: "chest", equipment: "dumbbell" }),
  createExercise("overhead-push-machine", "overhead_push", { category: "accessory", muscleGroup: "shoulders", equipment: "machine" }),
  createExercise("push-cable", "push", { category: "accessory", muscleGroup: "chest", equipment: "cable" }),
  createExercise("pull-compound-a", "pull", { category: "compound", muscleGroup: "back", equipment: "barbell" }),
  createExercise("pull-compound-b", "pull", { category: "compound", muscleGroup: "back", equipment: "dumbbell" }),
  createExercise("overhead-pull-cable", "overhead_pull", { category: "accessory", muscleGroup: "shoulders", equipment: "cable" }),
  createExercise("pull-cable", "pull", { category: "accessory", muscleGroup: "back", equipment: "cable" }),
  createExercise("carry-heavy", "carry", { category: "accessory", muscleGroup: "full_body", equipment: "dumbbell" }),
  createExercise("core-plank", "core", { category: "accessory", muscleGroup: "core" }),
  createExercise("mobility-hips", "mobility", { category: "mobility", muscleGroup: "legs", name: "Hip Airplane" }),
  createExercise("mobility-upper", "mobility", { category: "mobility", muscleGroup: "shoulders", name: "T-Spine Rotation" }),
  createExercise("warmup-ankle", "warmup", { category: "accessory", muscleGroup: "legs", name: "Ankle Rocker" }),
  createExercise("balance-upper", "balance", { category: "accessory", muscleGroup: "shoulders", name: "Shoulder Balance Reach" })
];

describe("balanced template v3", () => {
  it("maps readiness and fatigue to adaptive target count", () => {
    expect(resolveAdaptiveStrengthTargetCount({ sleepHours: 8, energy: 4, soreness: 1, stress: 1 }, 3)).toBe(6);
    expect(resolveAdaptiveStrengthTargetCount({ sleepHours: 6, energy: 2, soreness: 3, stress: 3 }, 5)).toBe(4);
    expect(resolveAdaptiveStrengthTargetCount({ sleepHours: 7, energy: 3, soreness: 2, stress: 3 }, 6)).toBe(5);
  });

  it("enforces lower slots for all target counts and stays deterministic", () => {
    const targetCounts: Array<4 | 5 | 6> = [4, 5, 6];
    for (const count of targetCounts) {
      const first = buildBalancedTemplateExercisePoolV3(templatePool, "lower", count, `lower-seed-${count}`);
      const second = buildBalancedTemplateExercisePoolV3(templatePool, "lower", count, `lower-seed-${count}`);
      expect(first).toEqual(second);
      expect(first.selected).toHaveLength(count);
      expect(first.notes).toEqual([]);

      const squatCount = first.selected.filter((exercise) => exercise.movementPattern === "squat").length;
      const hingeCount = first.selected.filter((exercise) => exercise.movementPattern === "hinge").length;
      expect(squatCount).toBeGreaterThanOrEqual(1);
      expect(hingeCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps push emphasis-dominant for target counts 4/5/6 and deterministic", () => {
    const targetCounts: Array<4 | 5 | 6> = [4, 5, 6];
    for (const count of targetCounts) {
      const first = buildBalancedTemplateExercisePoolV3(templatePool, "push", count, `push-seed-${count}`);
      const second = buildBalancedTemplateExercisePoolV3(templatePool, "push", count, `push-seed-${count}`);
      expect(first).toEqual(second);
      expect(first.selected).toHaveLength(count);

      const pushCount = first.selected.filter((exercise) => ["push", "overhead_push"].includes(exercise.movementPattern)).length;
      const pullCount = first.selected.filter((exercise) => ["pull", "overhead_pull"].includes(exercise.movementPattern)).length;

      if (count === 4) {
        expect(pushCount).toBeGreaterThanOrEqual(2);
      }
      if (count >= 5) {
        expect(pushCount).toBeGreaterThanOrEqual(3);
      }
      expect(pullCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps pull emphasis-dominant for target counts 4/5/6 and deterministic", () => {
    const targetCounts: Array<4 | 5 | 6> = [4, 5, 6];
    for (const count of targetCounts) {
      const first = buildBalancedTemplateExercisePoolV3(templatePool, "pull", count, `pull-seed-${count}`);
      const second = buildBalancedTemplateExercisePoolV3(templatePool, "pull", count, `pull-seed-${count}`);
      expect(first).toEqual(second);
      expect(first.selected).toHaveLength(count);

      const pullCount = first.selected.filter((exercise) => ["pull", "overhead_pull"].includes(exercise.movementPattern)).length;
      const pushCount = first.selected.filter((exercise) => ["push", "overhead_push"].includes(exercise.movementPattern)).length;

      if (count === 4) {
        expect(pullCount).toBeGreaterThanOrEqual(2);
      }
      if (count >= 5) {
        expect(pullCount).toBeGreaterThanOrEqual(3);
      }
      expect(pushCount).toBeGreaterThanOrEqual(1);
    }
  });

  it("adds required-slot notes when a required slot is unavailable", () => {
    const noSquatPool = templatePool.filter((exercise) => exercise.movementPattern !== "squat");
    const selected = buildBalancedTemplateExercisePoolV3(noSquatPool, "lower", 5, "missing-squat-seed");
    expect(selected.notes).toContain("Missing required slot: squat");
  });
});
