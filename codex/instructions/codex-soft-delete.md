You are working in the existing monorepo. Implement soft-delete (cancel) for workout sessions and whole weeks.

GOALS
1) Add a "soft delete" capability by marking sessions as CANCELLED (do not hard delete rows).
2) Provide two endpoints:
   - DELETE /sessions/:id
     Soft-delete a single session for the authenticated user.
     Response: { "status": "success" }
   - DELETE /plans/week
     Accept weekStart as a querystring param: ?weekStart=YYYY-MM-DD
     Soft-delete (cancel) ALL workout sessions in that week for the authenticated user.
     Response: { "status": "success", "cancelledCount": number, "weekStart": string, "weekEnd": string }

BEHAVIOR
- "Soft delete" means: update workoutSession.status = "CANCELLED"
- Any "week plan" read endpoint should NOT return cancelled sessions (unless there's already an explicit include flag; if none, just exclude by default).
- Ensure Swagger/OpenAPI docs show these endpoints clearly (params, response shapes).
- Use existing auth (bearer token) and keep consistent error handling conventions.

DB / PRISMA
- Check the Prisma schema for the workout session status enum.
- If CANCELLED doesn't exist, add it to the enum and create the required migration.
  (Postgres enum migrations are supported by Prisma; keep migration minimal and safe.)  [oai_citation:1‡GitHub](https://github.com/prisma/prisma/issues/15731?utm_source=chatgpt.com)
- No data loss.

TESTS
- Add/extend Vitest coverage in apps/backend tests:
  1) Create a session, call DELETE /sessions/:id, verify it returns success and session is excluded from /plans/week.
  2) Generate/seed multiple sessions in a week, call DELETE /plans/week?weekStart=..., verify cancelledCount and that /plans/week excludes them.
- Ensure existing tests still pass.

QUALITY
- Follow existing project patterns for route registration, schema validation (uuid format), and Prisma usage.
- Run: npm test (repo root) and fix any failures.
- Provide a short summary of changes and the exact commands you ran.
