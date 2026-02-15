# Task: Add complete Swagger schemas for all API routes

## Goal
Update all Fastify routes to include proper request/response JSON Schemas so Swagger UI (/docs) accurately documents the entire API.

## Files to Modify
- apps/backend/src/routes/sessions.ts
- apps/backend/src/routes/readiness.ts
- apps/backend/src/routes/plans.ts
(If routes are split differently, update the correct route files.)

## Requirements (apply to every route)
1) Every route must define `schema` with:
- `tags` (group endpoints): ["sessions"], ["readiness"], ["plans"]
- `summary` (short description)
- `security` using bearer auth (so Swagger shows Authorization header)
- `body` (if POST)
- `params` (if route has :id)
- `response` schemas for success and validation errors

2) Use FULL JSON Schema objects (must include `type` at top-level for body/params/response).

3) Keep business logic unchanged. Only add schemas and validation wiring.

4) Validation:
- If Zod is already used, keep Zod for runtime validation.
- Ensure Swagger JSON Schema matches Zod constraints.

## Route-specific schemas

### POST /sessions/generate
Body:
- date?: string (YYYY-MM-DD)

200 Response:
{
  sessionId: string,
  engineVersion: string,
  date: string,
  exercises: [
    {
      id?: string,
      name: string,
      type: "reps" | "timed" | "distance",
      sets?: number,
      reps?: number,
      seconds?: number,
      notes?: string
    }
  ]
}

### POST /sessions/:id/submit
Params:
- id: string (uuid)

Body:
{
  results: array of {
    exerciseId?: string,
    name?: string,
    setsCompleted?: number,
    reps?: number[],
    load?: number,
    rpe?: number,
    pain?: { joint?: string, level?: number },
    notes?: string
  }
}

200 Response:
{ status: "success" }

### POST /sessions/:id/swap
Params:
- id: string (uuid)

Body:
{ exerciseId: string }

200 Response:
{
  exerciseId: string,
  candidates: [
    { exerciseId: string, name?: string, reason?: string }
  ]
}

### POST /readiness
Body:
- date?: string (YYYY-MM-DD)
- sleepQuality?: number (1-5)
- stressLevel?: number (1-5)
- energy?: number (1-5)
- soreness?: object { upperBody?: 0-3, lowerBody?: 0-3 }
- pain?: object { shoulder?:0-10,knee?:0-10,lowBack?:0-10,hip?:0-10,ankle?:0-10,wrist?:0-10 }
- sharpPain?: boolean

201 Response:
{ id: string, date: string, createdAt: string }

### GET /plans/week
Querystring (optional):
- start?: string (YYYY-MM-DD)  // if omitted, backend uses current week

200 Response:
{
  weekStart: string,
  days: [
    {
      date: string,
      sessionId?: string,
      hasSession: boolean
    }
  ]
}

## Acceptance Criteria
- Swagger UI (/docs) shows correct request body for every POST route.
- Swagger UI shows params for routes with :id.
- Swagger UI shows response models for all routes (200/201 and 400).
- TypeScript builds with no errors.
- Existing tests still pass.
