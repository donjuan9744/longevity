import { config } from "dotenv";
import { z } from "zod";
config();
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    SUPABASE_JWT_SECRET: z.string().min(1),
    PORT: z.coerce.number().int().positive().default(3000)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map