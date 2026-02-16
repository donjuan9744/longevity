Codex PRD
# Task: Build the Longevity Workout Backend (MVP)

## Goal
Create the full backend implementation for a longevity-focused workout application targeting adults ages 40–55.

The system must:
- Use Supabase (Postgres + Auth)
- Use Node + Fastify
- Use Prisma ORM
- Implement a rule-based workout generation engine
- Keep the Workout Engine as a pure domain module
- Expose REST APIs for workout generation, progression, logging
- Be production-ready, modular, fully typed (TypeScript)

---

# Scope

Codex should generate:

- Complete backend API (Fastify)
- Prisma schema & migrations
- Supabase integration (Auth verification only)
- Workout engine module (pure TypeScript)
- Validation with Zod
- Unit tests (Vitest)
- Dockerfile
- Environment config
- Folder structure exactly as specified

Frontend is NOT included.

---

# Tech Stack

- Node 20+
- Fastify
- Prisma
- PostgreSQL (Supabase)
- Zod
- Vitest
- Docker
- Railway-compatible deployment

---

# Architecture

/apps
  /backend
/packages
  /engine

Backend must import engine but engine must NOT import backend or database code.

Engine must have:
- No database access
- No HTTP access
- Pure functions only

---

# Functional Requirements

## 1. Authentication

- Frontend authenticates with Supabase Auth.
- Backend verifies JWT using Supabase public key.
- Extract user ID from JWT.
- Reject unauthorized requests.

Middleware required:
- `authMiddleware.ts`

---

## 2. Workout Generation

Endpoint:
POST /sessions/generate

Input:
{
  "date": "YYYY-MM-DD"
}

Process:
- Fetch user profile
- Fetch readiness entry for date (if exists)
- Fetch progression_state
- Call engine.generateSession()
- Persist workout session snapshot
- Return session JSON

Output:
{
  "sessionId": "uuid",
  "exercises": [...],
  "engineVersion": "v1"
}

---

## 3. Submit Workout Results

Endpoint:
POST /sessions/:id/submit

Input:
{
  "results": [...]
}

Process:
- Validate session ownership
- Store session_results
- Update progression_state
- Possibly trigger deload logic

Return:
{
  "status": "success"
}

---

## 4. Weekly Plan

Endpoint:
GET /plans/week

Process:
- Fetch current user_program
- Fetch sessions for current week
- Return structured plan

---

## 5. Readiness Entry

Endpoint:
POST /readiness

Store readiness for the date.

---

## 6. Exercise Swap

Endpoint:
POST /sessions/:id/swap

Input:
{
  "exerciseId": "string"
}

Process:
- Fetch metadata
- Return swap candidates

---

# Non-Functional Requirements

- API response < 300ms
- 80%+ unit test coverage for engine
- Zod validation on all request bodies
- Prisma migrations must be included
- All code fully typed
- No any types
- Proper error handling

---

# Database

Use the Supabase schema provided previously.

Codex must generate:
- prisma/schema.prisma
- Migration files
- Database connection config
- Seed script for exercises

---

# File Structure

/apps/backend
  src/
    index.ts
    server.ts
    routes/
      sessions.ts
      readiness.ts
      plans.ts
    middleware/
      authMiddleware.ts
    services/
      sessionService.ts
      progressionService.ts
    db/
      prisma.ts
    config/
      env.ts
  tests/
  Dockerfile
  package.json

/packages/engine
  src/
    generateSession.ts
    progression.ts
    deload.ts
    types.ts
  package.json

/prisma
  schema.prisma

---

# Workout Engine Requirements

Must expose:

generateSession(input)
updateProgression(input)
evaluateDeload(input)

Must:
- Be deterministic
- Use pure functions
- Accept structured objects
- Return structured JSON

No side effects.

---

# Environment Variables

DATABASE_URL=
SUPABASE_JWT_SECRET=
PORT=

---

# Deployment

- Dockerfile required
- Railway compatible
- Production build script

---

# Acceptance Criteria

Codex must produce:

- Complete runnable Fastify backend
- Working Supabase JWT verification
- Prisma connected to Supabase Postgres
- Workout session generation working
- Session submission updates progression
- All endpoints tested
- Docker builds successfully
- No TypeScript errors

---

# Deliverables

- All backend code
- Prisma schema
- Migration files
- Engine module
- Tests
- Dockerfile
- README with setup instructions

End of PRD