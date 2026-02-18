import type { FastifyPluginAsync } from "fastify";
import { createHash } from "node:crypto";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  applyExerciseSwap,
  cancelWorkoutSession,
  generateWorkoutSession,
  submitWorkoutResults,
  swapExercise
} from "../services/sessionService.js";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDatePatternString = "^\\d{4}-\\d{2}-\\d{2}$";

function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const generateBodySchema = z.object({
  date: z.string().regex(isoDatePattern).optional()
});

const submitBodySchema = z.object({
  results: z
    .array(
      z.object({
        exerciseId: z.string().min(1),
        plannedSets: z.number().int().min(1).max(10),
        plannedReps: z.number().int().min(1).max(30),
        completedSets: z.number().int().min(0).max(10),
        completedReps: z.number().int().min(0).max(30),
        rpe: z.number().min(1).max(10)
      })
    )
    .min(1)
});
const submitQuerySchema = z.object({
  demoClientId: z.string().min(1).optional()
});
const demoClientQuerySchema = z.object({
  demoClientId: z.string().min(1).optional()
});

const swapBodySchema = z.object({
  exerciseId: z.string().min(1)
});

const applySwapBodySchema = z.object({
  fromExerciseId: z.string().min(1),
  toExerciseId: z.string().min(1)
});

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toDemoUserId(demoClientId: string): string {
  const hex = createHash("sha256").update(demoClientId).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function resolveEffectiveUserId(authUserId: string, demoClientId?: string): string {
  if (!demoClientId) {
    return authUserId;
  }

  return uuidPattern.test(demoClientId) ? demoClientId : toDemoUserId(demoClientId);
}

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

export const sessionsRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/sessions/generate",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["sessions"],
        summary: "Generate a workout session for a date",
        security: bearerSecurity,
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: {
              type: "string",
              pattern: isoDatePatternString,
              description: "ISO date (YYYY-MM-DD). Defaults to today's date when omitted."
            }
          }
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              sessionId: { type: "string", format: "uuid" },
              engineVersion: { type: "string" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    exerciseId: { type: "string", minLength: 1 },
                    name: { type: "string" },
                    sets: { type: "integer", minimum: 1 },
                    reps: { type: "integer", minimum: 1 },
                    intensity: { type: "number", minimum: 0 }
                  },
                  required: ["exerciseId", "name", "sets", "reps", "intensity"]
                }
              }
            },
            required: ["sessionId", "engineVersion", "exercises"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const body = generateBodySchema.parse(request.body);
      return generateWorkoutSession(request.user.id, body.date ?? getTodayIsoDate());
    }
  );

  app.delete(
    "/sessions/:id",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["sessions"],
        summary: "Cancel a workout session",
        security: bearerSecurity,
        params: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" }
          },
          required: ["id"]
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            demoClientId: { type: "string", minLength: 1 }
          }
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["success"] }
            },
            required: ["status"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = demoClientQuerySchema.parse(request.query);
      const effectiveUserId = resolveEffectiveUserId(request.user.id, query.demoClientId);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      return cancelWorkoutSession(effectiveUserId, params.id);
    }
  );

  app.post(
    "/sessions/:id/submit",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["sessions"],
        summary: "Submit completed workout results",
        security: bearerSecurity,
        params: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" }
          },
          required: ["id"]
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            results: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  exerciseId: { type: "string", minLength: 1 },
                  plannedSets: { type: "integer", minimum: 1, maximum: 10 },
                  plannedReps: { type: "integer", minimum: 1, maximum: 30 },
                  completedSets: { type: "integer", minimum: 0, maximum: 10 },
                  completedReps: { type: "integer", minimum: 0, maximum: 30 },
                  rpe: { type: "number", minimum: 1, maximum: 10 }
                },
                required: ["exerciseId", "plannedSets", "plannedReps", "completedSets", "completedReps", "rpe"]
              }
            }
          },
          required: ["results"]
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            demoClientId: { type: "string", minLength: 1 }
          }
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["success"] }
            },
            required: ["status"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = submitQuerySchema.parse(request.query);
      const effectiveUserId = resolveEffectiveUserId(request.user.id, query.demoClientId);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = submitBodySchema.parse(request.body);

      return submitWorkoutResults(effectiveUserId, params.id, body.results);
    }
  );

  app.post(
    "/sessions/:id/swap",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["sessions"],
        summary: "Get swap candidates for an exercise in a session",
        security: bearerSecurity,
        params: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" }
          },
          required: ["id"]
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            exerciseId: { type: "string", minLength: 1 }
          },
          required: ["exerciseId"]
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              candidates: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string", minLength: 1 },
                    name: { type: "string" }
                  },
                  required: ["id", "name"]
                }
              }
            },
            required: ["candidates"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = demoClientQuerySchema.parse(request.query);
      const effectiveUserId = resolveEffectiveUserId(request.user.id, query.demoClientId);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = swapBodySchema.parse(request.body);

      return swapExercise(effectiveUserId, params.id, body.exerciseId);
    }
  );

  app.post(
    "/sessions/:id/swap/apply",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["sessions"],
        summary: "Apply an exercise swap in a planned session snapshot",
        security: bearerSecurity,
        params: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string", format: "uuid" }
          },
          required: ["id"]
        },
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            fromExerciseId: { type: "string", minLength: 1 },
            toExerciseId: { type: "string", minLength: 1 }
          },
          required: ["fromExerciseId", "toExerciseId"]
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            demoClientId: { type: "string", minLength: 1 }
          }
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              status: { type: "string", enum: ["success"] },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    exerciseId: { type: "string", minLength: 1 },
                    name: { type: "string" },
                    sets: { type: "integer", minimum: 1 },
                    reps: { type: "integer", minimum: 1 },
                    intensity: { type: "number", minimum: 0 }
                  },
                  required: ["exerciseId", "name", "sets", "reps", "intensity"]
                }
              }
            },
            required: ["status", "exercises"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const query = demoClientQuerySchema.parse(request.query);
      const effectiveUserId = resolveEffectiveUserId(request.user.id, query.demoClientId);
      const params = z.object({ id: z.string().uuid() }).parse(request.params);
      const body = applySwapBodySchema.parse(request.body);

      return applyExerciseSwap(effectiveUserId, params.id, body.fromExerciseId, body.toExerciseId);
    }
  );
};
