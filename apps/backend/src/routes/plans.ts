import { generateWeeklyPlan, type DayPlan, type GeneratedSession, type TrainingGoal } from "@longevity/engine";
import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDatePatternString = "^\\d{4}-\\d{2}-\\d{2}$";
const bearerSecurity = [{ bearerAuth: [] }];

const validationErrorSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    error: { type: "string" },
    details: { type: "object", additionalProperties: true },
    message: { type: "string" },
    statusCode: { type: "integer" }
  }
} as const;

const weekQuerySchema = z.object({
  start: z.string().regex(isoDatePattern).optional(),
  strengthDays: z.number().int().min(2).max(5).optional()
});

const weekRefreshQuerySchema = z.object({
  weekStart: z.string().regex(isoDatePattern).optional(),
  start: z.string().regex(isoDatePattern).optional()
});

type StrengthDays = 2 | 3 | 4 | 5;

type WeekPlanResponse = {
  weekStart: string;
  weekEnd: string;
  engineVersion: string;
  program: {
    goal: string;
    daysPerWeek: number;
    active: boolean;
  } | null;
  days: Array<
    | {
        date: string;
        type: "strength";
        emphasis: "lower" | "push" | "pull" | "full_body_light";
        sessionId: string;
        status: string;
        engineVersion: string;
        session: GeneratedSession;
      }
    | Exclude<DayPlan, { type: "strength" }>
  >;
};

function parseIsoDate(isoDate: string): Date {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid ISO date");
  }
  return parsed;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toMonday(input: Date): Date {
  const day = input.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate())), diffToMonday);
}

function getWeekRange(startIso?: string): { start: Date; end: Date } {
  const baseDate = startIso ? parseIsoDate(startIso) : new Date();
  const start = toMonday(baseDate);
  const end = addDays(start, 7);
  return { start, end };
}

function parseGeneratedSession(snapshot: Prisma.JsonValue): GeneratedSession {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    throw new Error("Invalid session snapshot");
  }

  const value = snapshot as Record<string, unknown>;
  const rawExercises = value.exercises;
  const rawNotes = value.notes;

  if (!Array.isArray(rawExercises) || !Array.isArray(rawNotes) || value.engineVersion !== "v1") {
    throw new Error("Invalid session snapshot");
  }

  const exercises = rawExercises.map((exercise) => {
    if (typeof exercise !== "object" || exercise === null || Array.isArray(exercise)) {
      throw new Error("Invalid session snapshot");
    }

    const candidate = exercise as Record<string, unknown>;
    if (
      typeof candidate.exerciseId !== "string" ||
      typeof candidate.name !== "string" ||
      typeof candidate.sets !== "number" ||
      typeof candidate.reps !== "number" ||
      typeof candidate.intensity !== "number"
    ) {
      throw new Error("Invalid session snapshot");
    }

    return {
      exerciseId: candidate.exerciseId,
      name: candidate.name,
      sets: candidate.sets,
      reps: candidate.reps,
      intensity: candidate.intensity
    };
  });

  if (!rawNotes.every((note) => typeof note === "string")) {
    throw new Error("Invalid session snapshot");
  }

  return {
    exercises,
    engineVersion: "v1",
    notes: rawNotes as string[]
  };
}

function resolveGoal(goal: string | null | undefined): TrainingGoal {
  if (goal === "strength" || goal === "hypertrophy" || goal === "mobility" || goal === "balanced") {
    return goal;
  }

  return "balanced";
}

function resolveStrengthDays(value: number | undefined): StrengthDays {
  if (value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }

  return 3;
}

function toExerciseDefinition(exercise: {
  id: string;
  name: string;
  category: string;
  movementPattern: string;
  muscleGroup: string;
  equipment: string;
  difficulty: number;
}): {
  id: string;
  name: string;
  category: "compound" | "accessory" | "mobility" | "conditioning";
  movementPattern:
    | "squat"
    | "hinge"
    | "lunge"
    | "push"
    | "overhead_push"
    | "pull"
    | "overhead_pull"
    | "carry"
    | "core"
    | "calf"
    | "balance"
    | "mobility"
    | "warmup";
  muscleGroup: "legs" | "back" | "chest" | "shoulders" | "arms" | "core" | "full_body";
  equipment: "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight";
  difficulty: 1 | 2 | 3;
} {
  return {
    id: exercise.id,
    name: exercise.name,
    category: exercise.category as "compound" | "accessory" | "mobility" | "conditioning",
    movementPattern: exercise.movementPattern as
      | "squat"
      | "hinge"
      | "lunge"
      | "push"
      | "overhead_push"
      | "pull"
      | "overhead_pull"
      | "carry"
      | "core"
      | "calf"
      | "balance"
      | "mobility"
      | "warmup",
    muscleGroup: exercise.muscleGroup as "legs" | "back" | "chest" | "shoulders" | "arms" | "core" | "full_body",
    equipment: exercise.equipment as "barbell" | "dumbbell" | "cable" | "machine" | "bodyweight",
    difficulty: exercise.difficulty as 1 | 2 | 3
  };
}

function average(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const weekPlanResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    weekStart: { type: "string", pattern: isoDatePatternString },
    weekEnd: { type: "string", pattern: isoDatePatternString },
    engineVersion: { type: "string" },
    program: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          additionalProperties: false,
          properties: {
            goal: { type: "string" },
            daysPerWeek: { type: "integer" },
            active: { type: "boolean" }
          },
          required: ["goal", "daysPerWeek", "active"]
        }
      ]
    },
    days: {
      type: "array",
      minItems: 7,
      maxItems: 7,
      items: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            properties: {
              date: { type: "string", pattern: isoDatePatternString },
              type: { type: "string", const: "strength" },
              emphasis: { type: "string", enum: ["lower", "push", "pull", "full_body_light"] },
              sessionId: { type: "string", format: "uuid" },
              status: { type: "string" },
              engineVersion: { type: "string" },
              session: { type: "object", additionalProperties: true }
            },
            required: ["date", "type", "emphasis", "sessionId", "status", "engineVersion", "session"]
          },
          {
            type: "object",
            additionalProperties: false,
            properties: {
              date: { type: "string", pattern: isoDatePatternString },
              type: { type: "string", enum: ["zone2", "mobility", "recovery"] },
              minutes: { type: "integer", minimum: 1 },
              notes: { type: "string" },
              session: {
                type: "object",
                additionalProperties: false,
                properties: {
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        exerciseId: { type: "string" },
                        name: { type: "string" },
                        sets: { type: "integer", minimum: 1 },
                        reps: { type: "integer", minimum: 1 },
                        intensity: { type: "integer", minimum: 1 }
                      },
                      required: ["exerciseId", "name", "sets", "reps", "intensity"]
                    }
                  },
                  engineVersion: { type: "string" },
                  notes: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["exercises", "engineVersion"]
              }
            },
            required: ["date", "type", "minutes"]
          }
        ]
      }
    }
  },
  required: ["weekStart", "weekEnd", "engineVersion", "program", "days"]
} as const;

async function buildWeeklyPlanForUser(params: {
  userId: string;
  startIso?: string;
  strengthDaysOverride?: number;
  refreshPlannedStrengthSessions: boolean;
}): Promise<WeekPlanResponse> {
  const { start, end } = getWeekRange(params.startIso);
  const weekStart = formatIsoDate(start);
  const weekEnd = formatIsoDate(addDays(end, -1));
  const readinessTrendStart = addDays(start, -14);

  const [userProfile, program, progression, readinessEntries, exercises, existingSessions] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: params.userId } }),
    prisma.userProgram.findUnique({ where: { userId: params.userId } }),
    prisma.progressionState.findUnique({ where: { userId: params.userId } }),
    prisma.readinessEntry.findMany({
      where: {
        userId: params.userId,
        date: {
          gte: readinessTrendStart,
          lt: start
        }
      },
      orderBy: { date: "desc" },
      take: 7
    }),
    prisma.exercise.findMany({ where: { isActive: true }, orderBy: { id: "asc" } }),
    prisma.workoutSession.findMany({
      where: {
        userId: params.userId,
        sessionDate: {
          gte: start,
          lt: end
        }
      },
      orderBy: [{ sessionDate: "asc" }, { createdAt: "asc" }]
    })
  ]);

  const strengthDays = resolveStrengthDays(params.strengthDaysOverride ?? program?.daysPerWeek);
  const goal = resolveGoal(userProfile?.goal ?? program?.goal);
  const avgSleep = average(readinessEntries.map((entry) => entry.sleepHours));
  const avgEnergy = average(readinessEntries.map((entry) => entry.energy));
  const avgSoreness = average(readinessEntries.map((entry) => entry.soreness));
  const avgStress = average(readinessEntries.map((entry) => entry.stress));
  const readinessTrend = readinessEntries.length
    ? {
        ...(typeof avgSleep === "number" ? { avgSleep } : {}),
        ...(typeof avgEnergy === "number" ? { avgEnergy } : {}),
        ...(typeof avgSoreness === "number" ? { avgSoreness } : {}),
        ...(typeof avgStress === "number" ? { avgStress } : {})
      }
    : undefined;

  const generated = generateWeeklyPlan({
    weekStart,
    strengthDays,
    goal,
    progression: {
      strengthLevel: progression?.strengthLevel ?? 3,
      volumeLevel: progression?.volumeLevel ?? 3,
      fatigueScore: progression?.fatigueScore ?? 0,
      deloadCount: progression?.deloadCount ?? 0
    },
    ...(readinessTrend ? { readinessTrend } : {}),
    exercisePool: exercises.map(toExerciseDefinition)
  });

  const sessionByDate = new Map<string, (typeof existingSessions)[number]>();
  existingSessions.forEach((session) => {
    const sessionDate = formatIsoDate(session.sessionDate);
    if (!sessionByDate.has(sessionDate)) {
      sessionByDate.set(sessionDate, session);
    }
  });

  const strengthDaysInWeek = generated.days.filter(
    (day): day is Extract<DayPlan, { type: "strength" }> => day.type === "strength"
  );

  const missingStrengthDays = strengthDaysInWeek.filter((day) => !sessionByDate.has(day.date));
  if (missingStrengthDays.length > 0) {
    const createdSessions = await Promise.all(
      missingStrengthDays.map((day) =>
        prisma.workoutSession.create({
          data: {
            userId: params.userId,
            sessionDate: parseIsoDate(day.date),
            engineVersion: day.session.engineVersion,
            snapshot: day.session as unknown as Prisma.InputJsonValue,
            status: "PLANNED"
          }
        })
      )
    );

    createdSessions.forEach((session) => {
      sessionByDate.set(formatIsoDate(session.sessionDate), session);
    });
  }

  if (params.refreshPlannedStrengthSessions) {
    const refreshableStrengthDays = strengthDaysInWeek.filter((day) => {
      const session = sessionByDate.get(day.date);
      return session?.status === "PLANNED";
    });

    if (refreshableStrengthDays.length > 0) {
      const refreshedSessions = await Promise.all(
        refreshableStrengthDays.map(async (day) => {
          const session = sessionByDate.get(day.date);
          if (!session) {
            throw new Error(`Missing persisted session for strength day ${day.date}`);
          }

          return prisma.workoutSession.update({
            where: { id: session.id },
            data: {
              engineVersion: day.session.engineVersion,
              snapshot: day.session as unknown as Prisma.InputJsonValue,
              status: "PLANNED"
            }
          });
        })
      );

      refreshedSessions.forEach((session) => {
        sessionByDate.set(formatIsoDate(session.sessionDate), session);
      });
    }
  }

  const days = generated.days.map((day) => {
    if (day.type !== "strength") {
      return day;
    }

    const persistedSession = sessionByDate.get(day.date);
    if (!persistedSession) {
      throw new Error(`Missing persisted session for strength day ${day.date}`);
    }

    let sessionSnapshot = day.session;
    try {
      sessionSnapshot = parseGeneratedSession(persistedSession.snapshot);
    } catch {
      sessionSnapshot = day.session;
    }

    return {
      date: day.date,
      type: day.type,
      emphasis: day.emphasis,
      sessionId: persistedSession.id,
      status: persistedSession.status,
      engineVersion: persistedSession.engineVersion,
      session: sessionSnapshot
    };
  });

  return {
    weekStart,
    weekEnd,
    engineVersion: generated.engineVersion,
    program: program
      ? {
          goal: program.goal,
          daysPerWeek: program.daysPerWeek,
          active: program.active
        }
      : null,
    days
  };
}

export const plansRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/plans/week",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["plans"],
        summary: "Generate and return a weekly plan",
        security: bearerSecurity,
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            start: {
              type: "string",
              pattern: isoDatePatternString,
              description: "Optional week start hint (YYYY-MM-DD). The endpoint normalizes to Monday."
            },
            strengthDays: {
              type: "integer",
              minimum: 2,
              maximum: 5,
              description: "Optional strength training days for this generated week."
            }
          }
        },
        response: {
          200: weekPlanResponseSchema,
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = weekQuerySchema.parse(request.query);
      return buildWeeklyPlanForUser({
        userId: request.user.id,
        ...(query.start ? { startIso: query.start } : {}),
        ...(typeof query.strengthDays === "number" ? { strengthDaysOverride: query.strengthDays } : {}),
        refreshPlannedStrengthSessions: false
      });
    }
  );

  app.post(
    "/plans/week/refresh",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["plans"],
        summary: "Regenerate planned strength sessions for a week",
        security: bearerSecurity,
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            weekStart: {
              type: "string",
              pattern: isoDatePatternString,
              description: "Optional week start hint (YYYY-MM-DD). The endpoint normalizes to Monday UTC."
            }
          }
        },
        response: {
          200: weekPlanResponseSchema,
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = weekRefreshQuerySchema.parse(request.query);
      const startIso = query.weekStart ?? query.start;

      return buildWeeklyPlanForUser({
        userId: request.user.id,
        ...(startIso ? { startIso } : {}),
        refreshPlannedStrengthSessions: true
      });
    }
  );
};
