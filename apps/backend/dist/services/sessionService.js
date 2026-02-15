import { generateSession } from "@longevity/engine";
import { prisma } from "../db/prisma.js";
import { applyProgressionUpdate } from "./progressionService.js";
export async function generateWorkoutSession(userId, date) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!userProfile) {
        throw new Error("User profile not found");
    }
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    const [readiness, progression, exercises] = await Promise.all([
        prisma.readinessEntry.findUnique({
            where: { userId_date: { userId, date: parsedDate } }
        }),
        prisma.progressionState.findUnique({ where: { userId } }),
        prisma.exercise.findMany({ where: { isActive: true }, orderBy: { id: "asc" } })
    ]);
    const program = await prisma.userProgram.findUnique({ where: { userId } });
    const goal = userProfile.goal ?? program?.goal ?? "balanced";
    const workout = generateSession({
        date,
        goal,
        progression: {
            strengthLevel: progression?.strengthLevel ?? 3,
            volumeLevel: progression?.volumeLevel ?? 3,
            fatigueScore: progression?.fatigueScore ?? 0,
            deloadCount: progression?.deloadCount ?? 0
        },
        readiness: readiness
            ? {
                sleepHours: readiness.sleepHours,
                energy: readiness.energy,
                soreness: readiness.soreness,
                stress: readiness.stress
            }
            : undefined,
        exercisePool: exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            category: exercise.category,
            movementPattern: exercise.movementPattern,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
            difficulty: exercise.difficulty
        }))
    });
    const session = await prisma.workoutSession.create({
        data: {
            userId,
            sessionDate: parsedDate,
            engineVersion: workout.engineVersion,
            snapshot: workout,
            status: "PLANNED"
        }
    });
    return {
        sessionId: session.id,
        exercises: workout.exercises,
        engineVersion: workout.engineVersion
    };
}
export async function submitWorkoutResults(userId, sessionId, results) {
    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
        throw new Error("Session not found");
    }
    await prisma.$transaction(async (tx) => {
        await tx.sessionResult.createMany({
            data: results.map((result) => ({
                sessionId,
                exerciseId: result.exerciseId,
                plannedSets: result.plannedSets,
                plannedReps: result.plannedReps,
                completedSets: result.completedSets,
                completedReps: result.completedReps,
                rpe: result.rpe
            }))
        });
        await tx.workoutSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                submittedAt: new Date()
            }
        });
    });
    await applyProgressionUpdate(userId, results);
    return { status: "success" };
}
export async function swapExercise(userId, sessionId, exerciseId) {
    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
        throw new Error("Session not found");
    }
    const source = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!source) {
        throw new Error("Exercise not found");
    }
    const candidates = await prisma.exercise.findMany({
        where: {
            id: { not: exerciseId },
            isActive: true,
            movementPattern: source.movementPattern,
            muscleGroup: source.muscleGroup
        },
        take: 5
    });
    return {
        candidates: candidates.map((candidate) => ({ id: candidate.id, name: candidate.name }))
    };
}
//# sourceMappingURL=sessionService.js.map