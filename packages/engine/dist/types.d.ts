export type TrainingGoal = "strength" | "hypertrophy" | "mobility" | "balanced";
export type StrengthTemplate = "balanced" | "strength" | "mobility";
export interface ExerciseDefinition {
    id: string;
    name: string;
    category: "compound" | "accessory" | "mobility" | "conditioning";
    movementPattern: "squat" | "hinge" | "lunge" | "push" | "overhead_push" | "pull" | "overhead_pull" | "carry" | "core" | "calf" | "balance" | "mobility" | "warmup";
    muscleGroup: "legs" | "back" | "chest" | "shoulders" | "arms" | "core" | "full_body";
    equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
    difficulty: 1 | 2 | 3;
}
export interface ReadinessInput {
    sleepHours?: number;
    energy?: number;
    soreness?: number;
    stress?: number;
}
export interface ProgressionInput {
    strengthLevel: number;
    volumeLevel: number;
    fatigueScore: number;
    deloadCount: number;
}
export interface SessionExercise {
    exerciseId: string;
    name: string;
    sets: number;
    reps: number;
    intensity: number;
}
export interface GenerateSessionInput {
    date: string;
    goal: TrainingGoal;
    readiness?: ReadinessInput;
    progression: ProgressionInput;
    exercisePool: ExerciseDefinition[];
    seed?: number;
}
export interface GeneratedSession {
    exercises: SessionExercise[];
    engineVersion: "v1";
    notes: string[];
}
export interface ExerciseResultInput {
    exerciseId: string;
    plannedSets: number;
    plannedReps: number;
    completedSets: number;
    completedReps: number;
    rpe: number;
}
export interface UpdateProgressionInput {
    previous: ProgressionInput;
    results: ExerciseResultInput[];
}
export interface DeloadEvaluationInput {
    fatigueScore: number;
    averageRpe: number;
    completionRate: number;
}
export interface DeloadDecision {
    shouldDeload: boolean;
    reason: string;
}
