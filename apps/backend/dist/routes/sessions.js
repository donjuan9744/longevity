import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateWorkoutSession, submitWorkoutResults, swapExercise } from "../services/sessionService.js";
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoDatePatternString = "^\\d{4}-\\d{2}-\\d{2}$";
function getTodayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}
const generateBodySchema = z.object({
    date: z.string().regex(isoDatePattern).optional()
});
const submitBodySchema = z.object({
    results: z
        .array(z.object({
        exerciseId: z.string().min(1),
        plannedSets: z.number().int().min(1).max(10),
        plannedReps: z.number().int().min(1).max(30),
        completedSets: z.number().int().min(0).max(10),
        completedReps: z.number().int().min(0).max(30),
        rpe: z.number().min(1).max(10)
    }))
        .min(1)
});
const swapBodySchema = z.object({
    exerciseId: z.string().min(1)
});
export const sessionsRoutes = async (app) => {
    app.post("/sessions/generate", {
        preHandler: authMiddleware,
        schema: {
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
                    additionalProperties: true,
                    properties: {
                        sessionId: { type: "string", format: "uuid" },
                        engineVersion: { type: "string" },
                        date: { type: "string", pattern: isoDatePatternString },
                        exercises: {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: true,
                                properties: {
                                    name: { type: "string" },
                                    type: { type: "string", enum: ["reps", "timed", "distance"] },
                                    sets: { type: "integer" },
                                    reps: { type: "integer" },
                                    seconds: { type: "integer" },
                                    notes: { type: "string" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request) => {
        const body = generateBodySchema.parse(request.body);
        return generateWorkoutSession(request.user.id, body.date ?? getTodayIsoDate());
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
//# sourceMappingURL=sessions.js.map