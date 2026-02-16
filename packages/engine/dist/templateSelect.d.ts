import type { ExerciseDefinition } from "./types.js";
export interface SlotSelectContext {
    slotIndex: number;
    selected: ExerciseDefinition[];
}
export interface SlotDefinition {
    name: string;
    optional?: boolean;
    filter: (exercise: ExerciseDefinition, context: SlotSelectContext) => boolean;
    score?: (exercise: ExerciseDefinition, context: SlotSelectContext) => number;
}
export interface SlotFillResult {
    selected: ExerciseDefinition[];
    missingRequiredSlots: string[];
}
export declare function fillTemplateSlots(exercisePool: ExerciseDefinition[], seed: string | number, slotDefinitions: SlotDefinition[]): SlotFillResult;
