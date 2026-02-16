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

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function scoreCandidate(
  exercise: ExerciseDefinition,
  context: SlotSelectContext,
  slotName: string,
  seedKey: string,
  score?: SlotDefinition["score"]
): [number, number, string] {
  const preference = score ? score(exercise, context) : 0;
  const deterministicTieBreaker = hashString(`${seedKey}:${slotName}:${exercise.id}`);
  return [preference, deterministicTieBreaker, exercise.name];
}

function pickForSlot(
  exercisePool: ExerciseDefinition[],
  selectedIds: Set<string>,
  context: SlotSelectContext,
  seedKey: string,
  slot: SlotDefinition
): ExerciseDefinition | undefined {
  const candidates = exercisePool.filter((exercise) => !selectedIds.has(exercise.id) && slot.filter(exercise, context));

  if (candidates.length === 0) {
    return undefined;
  }

  return [...candidates].sort((a, b) => {
    const [aScore, aDeterministic, aName] = scoreCandidate(a, context, slot.name, seedKey, slot.score);
    const [bScore, bDeterministic, bName] = scoreCandidate(b, context, slot.name, seedKey, slot.score);
    return bScore - aScore || aDeterministic - bDeterministic || aName.localeCompare(bName);
  })[0];
}

export function fillTemplateSlots(
  exercisePool: ExerciseDefinition[],
  seed: string | number,
  slotDefinitions: SlotDefinition[]
): SlotFillResult {
  const seedKey = String(seed);
  const selected: ExerciseDefinition[] = [];
  const selectedIds = new Set<string>();
  const missingRequiredSlots: string[] = [];

  slotDefinitions.forEach((slot, slotIndex) => {
    const context: SlotSelectContext = {
      slotIndex,
      selected
    };

    const chosen = pickForSlot(exercisePool, selectedIds, context, seedKey, slot);
    if (!chosen) {
      if (!slot.optional) {
        missingRequiredSlots.push(slot.name);
      }
      return;
    }
    selectedIds.add(chosen.id);
    selected.push(chosen);
  });

  return {
    selected,
    missingRequiredSlots
  };
}
