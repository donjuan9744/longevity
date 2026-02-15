import { evaluateDeload, updateProgression, type ExerciseResultInput, type ProgressionInput } from "@longevity/engine";
import { prisma } from "../db/prisma.js";

export interface ProgressionUpdateOutput {
  progression: ProgressionInput;
  deloadTriggered: boolean;
}

export async function applyProgressionUpdate(userId: string, results: ExerciseResultInput[]): Promise<ProgressionUpdateOutput> {
  const current = await prisma.progressionState.findUnique({ where: { userId } });
  const previous: ProgressionInput = {
    strengthLevel: current?.strengthLevel ?? 3,
    volumeLevel: current?.volumeLevel ?? 3,
    fatigueScore: current?.fatigueScore ?? 0,
    deloadCount: current?.deloadCount ?? 0
  };

  const next = updateProgression({ previous, results });
  const completionRate =
    results.reduce((acc, result) => acc + result.completedSets / Math.max(1, result.plannedSets), 0) /
    Math.max(1, results.length);
  const averageRpe =
    results.reduce((acc, result) => acc + result.rpe, 0) / Math.max(1, results.length);

  const deloadDecision = evaluateDeload({
    fatigueScore: next.fatigueScore,
    averageRpe,
    completionRate
  });

  await prisma.progressionState.upsert({
    where: { userId },
    create: {
      userId,
      strengthLevel: next.strengthLevel,
      volumeLevel: next.volumeLevel,
      fatigueScore: next.fatigueScore,
      deloadCount: deloadDecision.shouldDeload ? previous.deloadCount + 1 : previous.deloadCount
    },
    update: {
      strengthLevel: next.strengthLevel,
      volumeLevel: next.volumeLevel,
      fatigueScore: deloadDecision.shouldDeload ? Math.max(0, next.fatigueScore - 3) : next.fatigueScore,
      deloadCount: deloadDecision.shouldDeload ? previous.deloadCount + 1 : previous.deloadCount
    }
  });

  return {
    progression: next,
    deloadTriggered: deloadDecision.shouldDeload
  };
}
