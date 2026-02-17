import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
const currentDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(currentDir, "../../.env") });
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    SUPABASE_URL: z.string().url(),
    PORT: z.coerce.number().int().positive().default(3000)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map