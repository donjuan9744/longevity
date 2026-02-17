import { prisma } from "../db/prisma.js";

export async function ensureUserProfile(userId: string) {
  return prisma.userProfile.upsert({
    where: { userId },
    update: {},
    create: { userId }
  });
}
