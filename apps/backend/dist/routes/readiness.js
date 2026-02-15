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
export const readinessRoutes = async (app) => {
    app.post("/readiness", { preHandler: authMiddleware }, async (request, reply) => {
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
                notes: body.notes
            },
            update: {
                sleepHours: body.sleepHours,
                energy: body.energy,
                soreness: body.soreness,
                stress: body.stress,
                notes: body.notes
            }
        });
        reply.code(201).send({ status: "success" });
    });
};
//# sourceMappingURL=readiness.js.map