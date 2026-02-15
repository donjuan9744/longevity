import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { ZodError } from "zod";
import { sessionsRoutes } from "./routes/sessions.js";
import { readinessRoutes } from "./routes/readiness.js";
import { plansRoutes } from "./routes/plans.js";
export function buildServer() {
    const app = Fastify({ logger: true });
    app.register(swagger, {
        openapi: {
            info: {
                title: "Longevity API",
                version: "1.0.0",
            },
        },
    });
    app.register(swaggerUI, {
        routePrefix: "/docs",
    });
    app.register(sessionsRoutes);
    app.register(readinessRoutes);
    app.register(plansRoutes);
    app.get("/health", async () => ({ status: "ok" }));
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof ZodError) {
            reply.code(400).send({ error: "Validation failed", details: error.flatten() });
            return;
        }
        if (error instanceof Error) {
            if (error.message === "User profile not found") {
                reply.code(404).send({ error: error.message });
                return;
            }
            if (error.message === "Session not found" || error.message === "Exercise not found") {
                reply.code(404).send({ error: error.message });
                return;
            }
        }
        reply.code(500).send({ error: "Internal server error" });
    });
    return app;
}
//# sourceMappingURL=server.js.map