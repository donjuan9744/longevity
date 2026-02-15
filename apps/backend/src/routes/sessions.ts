import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateWorkoutSession, submitWorkoutResults, swapExercise } from "../services/sessionService.js";

const generateBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
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

const swapBodySchema = z.object({
  exerciseId: z.string().min(1)
});

export const sessionsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/sessions/generate", { preHandler: authMiddleware }, async (request) => {
    const body = generateBodySchema.parse(request.body);
    return generateWorkoutSession(request.user.id, body.date);
  });

  app.post("/sessions/:id/submit", { preHandler: authMiddleware }, async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = submitBodySchema.parse(request.body);

    return submitWorkoutResults(request.user.id, params.id, body.results);
  });

  app.post("/sessions/:id/swap", { preHandler: authMiddleware }, async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = swapBodySchema.parse(request.body);

    return swapExercise(request.user.id, params.id, body.exerciseId);
  });
};
