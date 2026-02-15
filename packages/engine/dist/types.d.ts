export type TrainingGoal = "strength" | "hypertrophy" | "mobility" | "balanced";
export interface ExerciseDefinition {
    id: string;
    name: string;
    category: "compound" | "accessory" | "mobility";
    movementPattern: "squat" | "hinge" | "push" | "pull" | "carry" | "core" | "mobility";
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
