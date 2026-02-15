import { type ExerciseResultInput, type ProgressionInput } from "@longevity/engine";
export interface ProgressionUpdateOutput {
    progression: ProgressionInput;
    deloadTriggered: boolean;
}
export declare function applyProgressionUpdate(userId: string, results: ExerciseResultInput[]): Promise<ProgressionUpdateOutput>;
