import { generateSession } from "@longevity/engine";
import { SessionStatus } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { applyProgressionUpdate } from "./progressionService.js";
function toExerciseDefinition(exercise) {
    return {
        id: exercise.id,
        name: exercise.name,
        category: exercise.category,
        movementPattern: exercise.movementPattern,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty
    };
}
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
    const readinessInput = readiness
        ? {
            sleepHours: readiness.sleepHours,
            energy: readiness.energy,
            soreness: readiness.soreness,
            stress: readiness.stress
        }
        : undefined;
    const workout = generateSession({
        date,
        goal,
        progression: {
            strengthLevel: progression?.strengthLevel ?? 3,
            volumeLevel: progression?.volumeLevel ?? 3,
            fatigueScore: progression?.fatigueScore ?? 0,
            deloadCount: progression?.deloadCount ?? 0
        },
        ...(readinessInput ? { readiness: readinessInput } : {}),
        exercisePool: exercises.map(toExerciseDefinition)
    });
    const session = await prisma.workoutSession.create({
        data: {
            userId,
            sessionDate: parsedDate,
            engineVersion: workout.engineVersion,
            snapshot: workout,
            status: SessionStatus.PLANNED
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
                status: SessionStatus.COMPLETED,
                submittedAt: new Date()
            }
        });
    });
    await applyProgressionUpdate(userId, results);
    return { status: "success" };
}
export async function cancelWorkoutSession(userId, sessionId) {
    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
        throw new Error("Session not found");
    }
    await prisma.workoutSession.update({
        where: { id: sessionId },
        data: {
            status: SessionStatus.CANCELLED
        }
    });
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
function parseSessionSnapshot(snapshot) {
    if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
        throw new Error("Invalid session snapshot");
    }
    const rawExercises = snapshot.exercises;
    if (!Array.isArray(rawExercises)) {
        throw new Error("Invalid session snapshot");
    }
    const exercises = rawExercises.map((exercise) => {
        if (typeof exercise !== "object" || exercise === null || Array.isArray(exercise)) {
            throw new Error("Invalid session snapshot");
        }
        const value = exercise;
        if (typeof value.exerciseId !== "string" ||
            typeof value.name !== "string" ||
            typeof value.sets !== "number" ||
            typeof value.reps !== "number" ||
            typeof value.intensity !== "number") {
            throw new Error("Invalid session snapshot");
        }
        return {
            exerciseId: value.exerciseId,
            name: value.name,
            sets: value.sets,
            reps: value.reps,
            intensity: value.intensity
        };
    });
    const engineVersion = snapshot.engineVersion;
    const notes = snapshot.notes;
    if (engineVersion !== "v1" || !Array.isArray(notes) || !notes.every((note) => typeof note === "string")) {
        throw new Error("Invalid session snapshot");
    }
    return {
        exercises,
        engineVersion,
        notes
    };
}
export async function applyExerciseSwap(userId, sessionId, fromExerciseId, toExerciseId) {
    const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
        throw new Error("Session not found");
    }
    const [fromExercise, toExercise] = await Promise.all([
        prisma.exercise.findUnique({ where: { id: fromExerciseId } }),
        prisma.exercise.findUnique({ where: { id: toExerciseId } })
    ]);
    if (!fromExercise || !toExercise || !toExercise.isActive) {
        throw new Error("Exercise not found");
    }
    if (fromExercise.movementPattern !== toExercise.movementPattern ||
        fromExercise.muscleGroup !== toExercise.muscleGroup) {
        throw new Error("Invalid swap target");
    }
    const snapshot = parseSessionSnapshot(session.snapshot);
    const exerciseIndex = snapshot.exercises.findIndex((exercise) => exercise.exerciseId === fromExerciseId);
    if (exerciseIndex === -1) {
        throw new Error("Exercise not in session");
    }
    const currentExercise = snapshot.exercises[exerciseIndex];
    if (!currentExercise) {
        throw new Error("Exercise not in session");
    }
    const hasDuplicateTarget = snapshot.exercises.some((exercise, index) => exercise.exerciseId === toExerciseId && index !== exerciseIndex);
    if (hasDuplicateTarget) {
        throw new Error("Exercise already in session. Choose another candidate.");
    }
    const updatedExercises = [...snapshot.exercises];
    updatedExercises[exerciseIndex] = {
        ...currentExercise,
        exerciseId: toExercise.id,
        name: toExercise.name
    };
    const updatedSnapshot = {
        ...snapshot,
        exercises: updatedExercises
    };
    await prisma.workoutSession.update({
        where: { id: sessionId },
        data: {
            snapshot: updatedSnapshot
        }
    });
    return {
        status: "success",
        exercises: updatedExercises
    };
}
//# sourceMappingURL=sessionService.js.map