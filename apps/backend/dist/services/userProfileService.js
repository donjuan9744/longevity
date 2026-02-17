import { prisma } from "../db/prisma.js";
export async function ensureUserProfile(userId) {
    return prisma.userProfile.upsert({
        where: { userId },
        update: {},
        create: { userId }
    });
}
//# sourceMappingURL=userProfileService.js.map