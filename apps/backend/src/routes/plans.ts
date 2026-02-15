import type { FastifyPluginAsync } from "fastify";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { prisma } from "../db/prisma.js";

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
  app.get("/plans/week", { preHandler: authMiddleware }, async (request) => {
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
  });
};
