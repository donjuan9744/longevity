# Task: Add endpoint to refresh a weekly plan (regenerate PLANNED sessions)

## Goal
Add an API endpoint that rebuilds a week's plan by regenerating only PLANNED strength sessions (and their snapshots). Completed sessions remain unchanged.

## New Endpoint
POST /plans/week/refresh

## Auth
- Requires Bearer token (same auth middleware)

## Input
Query params (same as GET /plans/week):
- weekStart (optional, YYYY-MM-DD; default = current week Monday UTC)

## Behavior
1) Determine weekStart and the 7 dates in that week.
2) Load user settings/state (same as GET /plans/week):
   - strengthDaysPerWeek from UserProgram (default 3)
   - goal (UserProfile/UserProgram)
   - progression state
   - optional readiness trend
   - active exercise pool
3) Generate the weekly plan using the engine weekly generator.
4) For each day where type === "strength":
   - Find an existing WorkoutSession for (userId, sessionDate).
   - If exists and status === "COMPLETED": leave it unchanged.
   - If exists and status === "PLANNED": update snapshot + engineVersion + status remains PLANNED.
   - If not exists: create it (same as current /plans/week behavior).
5) Return the same response shape as GET /plans/week.

## Files Likely To Modify
- apps/backend/src/routes/plans.ts (add route + swagger schema)
- apps/backend/src/services (if you have a plan service, put logic there)
- apps/backend/tests/server.test.ts (add test)

## Tests
- Create a planned session for a week date, then call refresh and verify snapshot changes (or at least endpoint returns 200 and includes 7 days).
- Ensure completed sessions are not modified (mock or create with status COMPLETED and assert unchanged).

## Acceptance Criteria
- POST /plans/week/refresh returns 7-day plan.
- Planned strength sessions for the week are regenerated/updated.
- Completed strength sessions remain unchanged.
- Swagger shows the endpoint.
- npm test passes.
