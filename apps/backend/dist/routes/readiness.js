import { z } from "zod";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { prisma } from "../db/prisma.js";
const readinessSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sleepHours: z.number().int().min(0).max(24),
    energy: z.number().int().min(1).max(5),
    soreness: z.number().int().min(1).max(5),
    stress: z.number().int().min(1).max(5),
    notes: z.string().max(500).optional()
});
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
};
export const readinessRoutes = async (app) => {
    app.post("/readiness", {
        preHandler: authMiddleware,
        schema: {
            tags: ["readiness"],
            summary: "Create or update readiness entry for a date",
            security: bearerSecurity,
            body: {
                type: "object",
                additionalProperties: false,
                properties: {
                    date: { type: "string", pattern: isoDatePatternString },
                    sleepHours: { type: "integer", minimum: 0, maximum: 24 },
                    energy: { type: "integer", minimum: 1, maximum: 5 },
                    soreness: { type: "integer", minimum: 1, maximum: 5 },
                    stress: { type: "integer", minimum: 1, maximum: 5 },
                    notes: { type: "string", maxLength: 500 }
                },
                required: ["date", "sleepHours", "energy", "soreness", "stress"]
            },
            response: {
                201: {
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
    }, async (request, reply) => {
        const body = readinessSchema.parse(request.body);
        const date = new Date(`${body.date}T00:00:00.000Z`);
        await prisma.readinessEntry.upsert({
            where: { userId_date: { userId: request.user.id, date } },
            create: {
                userId: request.user.id,
                date,
                sleepHours: body.sleepHours,
                energy: body.energy,
                soreness: body.soreness,
                stress: body.stress,
                ...(typeof body.notes === "string" ? { notes: body.notes } : {})
            },
            update: {
                sleepHours: body.sleepHours,
                energy: body.energy,
                soreness: body.soreness,
                stress: body.stress,
                ...(typeof body.notes === "string" ? { notes: body.notes } : {})
            }
        });
        reply.code(201).send({ status: "success" });
    });
};
//# sourceMappingURL=readiness.js.map