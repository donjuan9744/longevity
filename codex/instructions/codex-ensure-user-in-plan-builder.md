Goal:
Guarantee that the User row exists before any weekly plan logic runs.

Tasks:

1. Locate buildWeeklyPlanForUser in:
   apps/backend/src/routes/plans.ts

2. At the very top of the function, before ANY Prisma queries:

   await prisma.user.upsert({
     where: { id: params.userId },
     update: {},
     create: {
       id: params.userId,
       email: `${params.userId}@local.dev`
     }
   });

3. Ensure this runs before any Promise.all calls.

4. Do NOT modify business logic.
5. Do NOT modify schema.
6. Ensure TypeScript passes.
7. Run build and tests.

Result:
User always exists before WorkoutSession or WeeklyPlanSeed are written.
