# Task: Add Swagger schemas for POST /sessions/generate

## Goal
Update the Fastify route schema so Swagger UI shows the request body and response for `POST /sessions/generate`.

## File to Modify
apps/backend/src/routes/sessions.ts

## Requirements
1) Add a `schema` object to the `POST /sessions/generate` route with:
- Body: `{ date?: string }` (optional ISO date string; if omitted, backend uses today's date)
- Response 200: JSON object including:
  - sessionId: string (uuid)
  - engineVersion: string
  - date: string (YYYY-MM-DD)
  - exercises: array of objects with at least:
    - name: string
    - type: string ("reps" | "timed" | "distance")
    - sets?: number
    - reps?: number
    - seconds?: number
    - notes?: string

2) Use Zod for runtime validation and also provide Fastify JSON schema for Swagger.
   - If you already have Zod validators, reuse them.
   - Ensure the Swagger schema matches validation.

3) Do not change business logic. Only add/adjust schema/validation.

## Acceptance Criteria
- Swagger UI at `/docs` shows request body fields for `/sessions/generate`.
- Swagger UI shows a structured 200 response schema for `/sessions/generate`.
- TypeScript builds with no errors.
