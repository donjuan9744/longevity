Fix weekly refresh behavior so that refreshPlannedStrengthSessions works correctly and does not reuse old sessionIds.

GOAL:
When POST /plans/week/refresh is called:

1. Only affect strength sessions.
2. Only delete sessions with status = PLANNED.
3. Never delete sessions with status = COMPLETED.
4. Always create new workoutSession records for regenerated strength days.
5. Ensure new UUIDs are generated.
6. Ensure returned week contains the new sessionIds.

IMPLEMENTATION DETAILS:

In buildWeeklyPlanForUser (apps/backend/src/routes/plans.ts):

When refreshPlannedStrengthSessions === true:

- Determine week date range (Monday–Sunday).
- Find existing workoutSession records for:
    userId
    date between weekStart and weekEnd
    type = "strength"

- For each session:
    If status === PLANNED:
        delete it
    If status === COMPLETED:
        leave it untouched

- After deletion:
    Regenerate strength sessions for that week
    Insert them as NEW workoutSession rows
    Let Prisma generate new UUIDs

- Ensure recovery, mobility, and zone2 days are NOT deleted or recreated.

Do NOT modify:
- submitWorkoutResults
- progression logic
- completion logic

After implementation:
- Ensure npm run build passes
- Ensure backend tests pass