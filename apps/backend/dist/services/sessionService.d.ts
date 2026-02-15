import { type ExerciseResultInput, type SessionExercise } from "@longevity/engine";
export declare function generateWorkoutSession(userId: string, date: string): Promise<{
    sessionId: string;
    exercises: SessionExercise[];
    engineVersion: string;
}>;
export declare function submitWorkoutResults(userId: string, sessionId: string, results: ExerciseResultInput[]): Promise<{
    status: "success";
}>;
export declare function swapExercise(userId: string, sessionId: string, exerciseId: string): Promise<{
    candidates: Array<{
        id: string;
        name: string;
    }>;
}>;
