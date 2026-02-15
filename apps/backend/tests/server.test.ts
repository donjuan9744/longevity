import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "../src/server.js";

vi.mock("../src/middleware/authMiddleware.js", () => ({
  authMiddleware: async (request: { user?: { id: string } }) => {
    request.user = { id: "user-1" };
  }
}));

const mockPrisma = vi.hoisted(() => ({
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  userProfile: {
    findUnique: vi.fn(),
  },
  userProgram: {
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
    update: vi.fn(),
  },
  sessionResult: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
  progressionState: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  exerciseMetadata: {
    findUnique: vi.fn(),
  },
  exercise: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
}));

vi.mock("../src/db/prisma.js", () => ({
  prisma: mockPrisma
}));

describe("backend routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a session", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.readinessEntry.findUnique.mockResolvedValue(null);
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.exercise.findMany.mockResolvedValue([
      {
        id: "ex-1",
        name: "Goblet Squat",
        category: "compound",
        movementPattern: "squat",
        muscleGroup: "legs",
        equipment: "dumbbell",
        difficulty: 1,
        isActive: true
      }
    ]);
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.workoutSession.create.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/generate",
      payload: { date: "2026-02-15" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().engineVersion).toBe("v1");
    await app.close();
  });

  it("stores readiness", async () => {
    mockPrisma.readinessEntry.upsert.mockResolvedValue({ id: "r1" });
    const app = buildServer();

    const response = await app.inject({
      method: "POST",
      url: "/readiness",
      payload: {
        date: "2026-02-15",
        sleepHours: 7,
        energy: 3,
        soreness: 2,
        stress: 2
      }
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe("success");
    await app.close();
  });

  it("returns weekly plan", async () => {
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    const app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/plans/week"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().program.goal).toBe("balanced");
    await app.close();
  });

  it("submits session results", async () => {
    mockPrisma.workoutSession.findUnique.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001", userId: "user-1" });
    mockPrisma.sessionResult.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.workoutSession.update.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 2, deloadCount: 0 });
    mockPrisma.progressionState.upsert.mockResolvedValue({ id: "p1" });

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/00000000-0000-0000-0000-000000000001/submit",
      payload: {
        results: [
          {
            exerciseId: "ex-1",
            plannedSets: 3,
            plannedReps: 8,
            completedSets: 3,
            completedReps: 8,
            rpe: 8
          }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("success");
    await app.close();
  });

  it("returns swap candidates", async () => {
    mockPrisma.workoutSession.findUnique.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001", userId: "user-1" });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex-1",
      movementPattern: "squat",
      muscleGroup: "legs"
    });
    mockPrisma.exercise.findMany.mockResolvedValue([{ id: "ex-2", name: "Front Squat" }]);

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/00000000-0000-0000-0000-000000000001/swap",
      payload: { exerciseId: "ex-1" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().candidates).toHaveLength(1);
    await app.close();
  });
});
