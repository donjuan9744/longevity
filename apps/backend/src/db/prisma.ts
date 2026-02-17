import { PrismaClient } from "@prisma/client";

function hostnameFromUrl(value: string | undefined): string {
  if (!value) {
    return "unset";
  }

  try {
    return new URL(value).hostname || "unset";
  } catch {
    return "invalid";
  }
}

const databaseHost = hostnameFromUrl(process.env.DATABASE_URL);
const directHost = hostnameFromUrl(process.env.DIRECT_URL);
const useDirectUrlInDev = process.env.NODE_ENV === "development" && Boolean(process.env.DIRECT_URL);
const runtimeHost = useDirectUrlInDev ? directHost : databaseHost;

console.info(`[db] database_host=${databaseHost} direct_host=${directHost} prisma_runtime_host=${runtimeHost}`);

const globalForPrisma = globalThis as unknown as { __longevityPrisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return useDirectUrlInDev
    ? new PrismaClient({
        datasources: {
          db: {
            url: process.env.DIRECT_URL
          }
        }
      })
    : new PrismaClient();
}

export const prisma = globalForPrisma.__longevityPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__longevityPrisma = prisma;
}
