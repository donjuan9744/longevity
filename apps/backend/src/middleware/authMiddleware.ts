import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";
import { env } from "../config/env.js";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      email?: string;
    };
  }
}

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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

    const typedPayload = payload as unknown as SupabaseJwtPayload;
    if (!typedPayload.sub) {
      reply.code(401).send({ error: "Invalid token payload" });
      return;
    }

    request.user = {
      id: typedPayload.sub,
      email: typedPayload.email
    };
  } catch {
    reply.code(401).send({ error: "Invalid token" });
  }
}
