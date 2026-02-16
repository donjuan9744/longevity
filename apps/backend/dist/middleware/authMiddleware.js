import { createLocalJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;
let jwksCache;
async function getJwksKeySet() {
    if (jwksCache && jwksCache.expiresAt > Date.now()) {
        return jwksCache.keySet;
    }
    const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");
    const jwksUrl = `${baseUrl}/auth/v1/.well-known/jwks.json`;
    const response = await fetch(jwksUrl);
    if (!response.ok) {
        throw new Error("Failed to fetch Supabase JWKS");
    }
    const jwks = (await response.json());
    const keySet = createLocalJWKSet(jwks);
    jwksCache = {
        keySet,
        expiresAt: Date.now() + JWKS_CACHE_TTL_MS
    };
    return keySet;
}
export async function authMiddleware(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.code(401).send({ error: "Missing bearer token" });
        return;
    }
    const token = authHeader.slice("Bearer ".length);
    try {
        const jwks = await getJwksKeySet();
        const { payload } = await jwtVerify(token, jwks, {
            algorithms: ["ES256"]
        });
        const typedPayload = payload;
        if (!typedPayload.sub) {
            reply.code(401).send({ error: "Invalid token payload" });
            return;
        }
        request.user = typedPayload.email
            ? {
                id: typedPayload.sub,
                email: typedPayload.email
            }
            : {
                id: typedPayload.sub
            };
    }
    catch {
        reply.code(401).send({ error: "Invalid token" });
    }
}
//# sourceMappingURL=authMiddleware.js.map