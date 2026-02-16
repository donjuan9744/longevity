import type { ExerciseDefinition, GeneratedSession, ProgressionInput, SessionExercise, StrengthTemplate, TrainingGoal } from "./types.js";
type NonStrengthSession = {
    exercises: SessionExercise[];
    engineVersion: "v1";
    notes?: string[];
};
type StrengthEmphasis = "lower" | "push" | "pull" | "full_body_light";
type BalancedStrengthEmphasis = Exclude<StrengthEmphasis, "full_body_light">;
type AdaptiveExerciseCount = 4 | 5 | 6;
export type DayPlan = {
    date: string;
    type: "strength";
    emphasis: StrengthEmphasis;
    session: GeneratedSession;
} | {
    date: string;
    type: "zone2";
    minutes: number;
    notes?: string;
    session?: NonStrengthSession;
} | {
    date: string;
    type: "mobility";
    minutes: number;
    notes?: string;
    session?: NonStrengthSession;
} | {
    date: string;
    type: "recovery";
    minutes: number;
    notes?: string;
    session: NonStrengthSession;
};
export interface GenerateWeeklyPlanInput {
    weekStart: string;
    strengthDays: 2 | 3 | 4 | 5;
    goal: TrainingGoal;
    progression: ProgressionInput;
    readinessTrend?: {
        avgSleep?: number;
        avgEnergy?: number;
        avgSoreness?: number;
        avgStress?: number;
    };
    exercisePool: ExerciseDefinition[];
    seed?: number;
}
export declare function resolveStrengthTemplate(goal: TrainingGoal): StrengthTemplate;
export declare function resolveAdaptiveStrengthTargetCount(readiness?: {
    sleepHours?: number;
    energy?: number;
    soreness?: number;
    stress?: number;
}, fatigueScore?: number): AdaptiveExerciseCount;
export declare function buildBalancedTemplateExercisePoolV3(exercisePool: ExerciseDefinition[], emphasis: BalancedStrengthEmphasis, targetCount: AdaptiveExerciseCount, seedKey: string): {
    selected: ExerciseDefinition[];
    notes: string[];
};
export declare function generateWeeklyPlan(input: GenerateWeeklyPlanInput): {
    days: DayPlan[];
    engineVersion: string;
};
export {};
