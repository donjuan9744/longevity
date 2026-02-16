-- CreateTable
CREATE TABLE "WeeklyPlanSeed" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "seed" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyPlanSeed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyPlanSeed_userId_weekStart_key" ON "WeeklyPlanSeed"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "WeeklyPlanSeed_userId_weekStart_idx" ON "WeeklyPlanSeed"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "WeeklyPlanSeed" ADD CONSTRAINT "WeeklyPlanSeed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
