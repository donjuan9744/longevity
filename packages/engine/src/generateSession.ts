import type {
  ExerciseDefinition,
  GenerateSessionInput,
  GeneratedSession,
  SessionExercise
} from "./types.js";

function scoreReadiness(readiness: GenerateSessionInput["readiness"]): number {
  if (!readiness) {
    return 0;
  }

  const sleepAdj = (readiness.sleepHours ?? 7) >= 7 ? 1 : -1;
  const energyAdj = (readiness.energy ?? 3) >= 3 ? 1 : -1;
  const sorenessAdj = (readiness.soreness ?? 2) <= 2 ? 1 : -1;
  const stressAdj = (readiness.stress ?? 2) <= 2 ? 1 : -1;
  return sleepAdj + energyAdj + sorenessAdj + stressAdj;
}

function createDeterministicOrder(exercises: ExerciseDefinition[], seed: number): ExerciseDefinition[] {
  return [...exercises].sort((a, b) => {
    const aScore = a.id.charCodeAt(0) + seed;
    const bScore = b.id.charCodeAt(0) + seed;
    return aScore - bScore || a.name.localeCompare(b.name);
  });
}

function selectBalancedExercises(ordered: ExerciseDefinition[], maxExercises = 5): ExerciseDefinition[] {
  const selected: ExerciseDefinition[] = [];
  const selectedIds = new Set<string>();

  const addExercise = (exercise: ExerciseDefinition | undefined): void => {
    if (!exercise || selectedIds.has(exercise.id) || selected.length >= maxExercises) {
      return;
    }
    selected.push(exercise);
    selectedIds.add(exercise.id);
  };

  const byCompoundThenAny = (matcher: (exercise: ExerciseDefinition) => boolean): ExerciseDefinition | undefined =>
    ordered.find((exercise) => !selectedIds.has(exercise.id) && exercise.category === "compound" && matcher(exercise)) ??
    ordered.find((exercise) => !selectedIds.has(exercise.id) && matcher(exercise));

  addExercise(byCompoundThenAny((exercise) => ["squat", "hinge", "lunge"].includes(exercise.movementPattern)));
  addExercise(byCompoundThenAny((exercise) => ["push", "overhead_push"].includes(exercise.movementPattern)));
  addExercise(byCompoundThenAny((exercise) => ["pull", "overhead_pull"].includes(exercise.movementPattern)));
  addExercise(ordered.find((exercise) => !selectedIds.has(exercise.id) && ["core", "carry"].includes(exercise.movementPattern)));
  addExercise(
    ordered.find(
      (exercise) =>
        !selectedIds.has(exercise.id) &&
        (exercise.category === "mobility" || ["mobility", "warmup"].includes(exercise.movementPattern))
    )
  );

  const remaining = ordered.filter((exercise) => !selectedIds.has(exercise.id));
  while (selected.length < maxExercises && remaining.length > 0) {
    const selectedPatterns = new Set(selected.map((exercise) => exercise.movementPattern));
    const varietyIndex = remaining.findIndex((exercise) => !selectedPatterns.has(exercise.movementPattern));
    const pickIndex = varietyIndex >= 0 ? varietyIndex : 0;
    const [next] = remaining.splice(pickIndex, 1);
    addExercise(next);
  }

  return selected;
}

export function generateSession(input: GenerateSessionInput): GeneratedSession {
  const readinessScore = scoreReadiness(input.readiness);
  const progressionBias = input.progression.volumeLevel + input.progression.strengthLevel;
  const seed = input.seed ?? Number(input.date.replaceAll("-", ""));

  const ordered = createDeterministicOrder(input.exercisePool, seed);
  const maxExercises = input.goal === "balanced" && input.exercisePool.length === 6 ? 6 : 5;
  const selected = selectBalancedExercises(ordered, maxExercises);

  const baseSets = Math.max(2, Math.min(5, 3 + Math.floor(progressionBias / 4) + (readinessScore >= 2 ? 1 : 0)));
  const baseReps = input.goal === "strength" ? 6 : input.goal === "mobility" ? 10 : 8;

  const exercises: SessionExercise[] = selected.map((exercise, index) => {
    const intensity = Math.max(6, Math.min(9, 7 + Math.floor(input.progression.strengthLevel / 3) - (readinessScore < 0 ? 1 : 0)));
    return {
      exerciseId: exercise.id,
      name: exercise.name,
      sets: index === 0 ? baseSets : Math.max(2, baseSets - 1),
      reps: exercise.category === "mobility" ? 12 : baseReps,
      intensity
    };
  });

  const notes: string[] = [];
  if (readinessScore < 0) {
    notes.push("Reduced intensity due to readiness.");
  }
  if (input.progression.fatigueScore > 6) {
    notes.push("Monitor fatigue and consider deload if trend continues.");
  }

  return {
    exercises,
    engineVersion: "v1",
    notes
  };
}
