import type { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { prisma } from "../db/prisma.js";

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

function getWeekRange(input: Date): { start: Date; end: Date } {
  const date = new Date(input);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + diffToMonday));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

export const plansRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/plans/week",
    {
      preHandler: authMiddleware,
      schema: {
        tags: ["plans"],
        summary: "Get current week plan and generated sessions",
        security: bearerSecurity,
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            start: {
              type: "string",
              pattern: isoDatePatternString,
              description: "Optional start date (YYYY-MM-DD). Current implementation uses the current week."
            }
          }
        },
        response: {
          200: {
            type: "object",
            additionalProperties: false,
            properties: {
              weekStart: { type: "string", pattern: isoDatePatternString },
              weekEnd: { type: "string", pattern: isoDatePatternString },
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
              sessions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string", format: "uuid" },
                    date: { type: "string", pattern: isoDatePatternString },
                    status: { type: "string" },
                    engineVersion: { type: "string" },
                    snapshot: { type: "object", additionalProperties: true }
                  },
                  required: ["id", "date", "status", "engineVersion", "snapshot"]
                }
              }
            },
            required: ["weekStart", "weekEnd", "program", "sessions"]
          },
          400: validationErrorSchema
        }
      }
    },
    async (request) => {
      const now = new Date();
      const { start, end } = getWeekRange(now);

      const [program, sessions] = await Promise.all([
        prisma.userProgram.findUnique({ where: { userId: request.user.id } }),
        prisma.workoutSession.findMany({
          where: {
            userId: request.user.id,
            sessionDate: {
              gte: start,
              lt: end
            }
          },
          orderBy: { sessionDate: "asc" }
        })
      ]);

      return {
        weekStart: start.toISOString().slice(0, 10),
        weekEnd: new Date(end.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        program: program
          ? {
              goal: program.goal,
              daysPerWeek: program.daysPerWeek,
              active: program.active
            }
          : null,
        sessions: sessions.map((session) => ({
          id: session.id,
          date: session.sessionDate.toISOString().slice(0, 10),
          status: session.status,
          engineVersion: session.engineVersion,
          snapshot: session.snapshot
        }))
      };
    }
  );
};
