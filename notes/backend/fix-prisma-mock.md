# Task: Fix test mock initialization

## Goal
Update the mocking code so it uses `vi.hoisted` properly before the `vi.mock` factory.

## File to Modify
`apps/backend/tests/server.test.ts`

## Change
Replace the existing mock of `../src/db/prisma.js` with the following:

```ts
import { vi } from "vitest";

// hoisted mock object
const mockPrisma = vi.hoisted(() => ({
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  readinessEntry: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  workoutSession: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  sessionResult: {
    create: vi.fn(),
  },
  progressionState: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  exerciseMetadata: {
    findUnique: vi.fn(),
  },
  exercise: {
    findMany: vi.fn(),
  },
}));

vi.mock("../src/db/prisma.js", () => ({
  prisma: mockPrisma,
}));
```

## Acceptance Criteria
- The mock code is placed at the top of `server.test.ts`
- Tests run without mock initialization errors
