import { jwtVerify } from "jose";
import { env } from "../config/env.js";
export async function authMiddleware(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.code(401).send({ error: "Missing bearer token" });
        return;
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(env.SUPABASE_JWT_SECRET), {
            algorithms: ["HS256"]
        });
        const typedPayload = payload;
        if (!typedPayload.sub) {
            reply.code(401).send({ error: "Invalid token payload" });
            return;
        }
        request.user = {
            id: typedPayload.sub,
            email: typedPayload.email
        };
    }
    catch {
        reply.code(401).send({ error: "Invalid token" });
    }
}
//# sourceMappingURL=authMiddleware.js.map