import type { FastifyReply, FastifyRequest } from "fastify";
declare module "fastify" {
    interface FastifyRequest {
        user: {
            id: string;
            email?: string;
        };
    }
}
export declare function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
