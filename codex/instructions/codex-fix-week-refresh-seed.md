# Codex Task: Make /plans/week/refresh actually change workouts (persisted week seed)

## Problem
Refreshing a week returns the same workouts because the engine uses deterministic seeding (weekStart-based).
Even when `refreshPlannedStrengthSessions: true`, inputs are identical → output is identical.

## Goal
- GET /plans/week should be stable for a given user + weekStart.
- POST /plans/week/refresh should create a NEW week seed, persist it, regenerate planned strength sessions, and return the new week plan.
- After refresh, GET /plans/week should return the refreshed plan (using the persisted seed).

## Requirements
1) Add a new Prisma model to persist a seed per (userId, weekStart).
   Suggested model name: `WeeklyPlanSeed`.

   Example:

   model WeeklyPlanSeed {
     id        String   @id @default(uuid())
     userId    String
     weekStart DateTime
     seed      Int
     updatedAt DateTime @updatedAt

     @@unique([userId, weekStart])
     @@index([userId, weekStart])
   }

   - Use DateTime for weekStart normalized to Monday UTC (same normalization your plan endpoints already use).

2) Migration + prisma client regen must be included.

3) Update backend plan building so engine seed comes from:
   - persisted WeeklyPlanSeed.seed if exists
   - else default deterministic seed: Number(weekStart.replaceAll("-", "")) (current behavior)

4) Update POST /plans/week/refresh:
   - Normalize weekStart (Monday UTC) same as GET.
   - Upsert WeeklyPlanSeed for user+weekStart with a NEW seed (random int).
     - Random seed can be: Math.floor(Date.now() % 2147483647) or a hash of (Date.now + userId + weekStart).
     - Must be an Int safe for JS number and Prisma int.
   - Call buildWeeklyPlanForUser with refreshPlannedStrengthSessions:true AND use the new seed for generation.

5) Update buildWeeklyPlanForUser signature as needed to accept an optional seed override (preferred), or make it load seed internally via prisma.

6) Ensure session regeneration uses the new seed so strength days change.

7) Update Swagger schemas if needed (no new API contract required unless you add optional debug fields).
   Optional (nice): include `planSeed` in week response for debugging.

8) Add/Update tests:
   - A test that calls refresh twice and verifies returned strength sessions differ (at least one exerciseId differs) OR seed differs and sessions differ.
   - A test that GET /plans/week after refresh returns the same plan as the refresh result (seed persistence works).

## Constraints
- Do NOT change existing working endpoints besides adding this seed behavior.
- Keep GET stable.
- Keep refresh semantics: refresh changes plan once and then it stays stable until refreshed again.

## Deliverables
- Prisma schema + migration
- Updated backend code in apps/backend/src/routes/plans.ts (and wherever buildWeeklyPlanForUser lives)
- Tests passing (apps/backend tests + engine tests if affected)
- `npm test` (or repo test command) should pass.