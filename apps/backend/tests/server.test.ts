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
    findMany: vi.fn(),
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
      },
      {
        id: "ex-2",
        name: "90/90 Hip Switch",
        category: "mobility",
        movementPattern: "mobility",
        muscleGroup: "legs",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-3",
        name: "Cat-Cow Flow",
        category: "accessory",
        movementPattern: "core",
        muscleGroup: "core",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-4",
        name: "Incline Walk",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-5",
        name: "Bike Erg",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      },
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
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
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
      },
      {
        id: "ex-2",
        name: "90/90 Hip Switch",
        category: "mobility",
        movementPattern: "mobility",
        muscleGroup: "legs",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-3",
        name: "Box Breathing",
        category: "accessory",
        movementPattern: "core",
        muscleGroup: "core",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-4",
        name: "Incline Walk",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-5",
        name: "Bike Erg",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      }
    ]);
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    let createCount = 0;
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date } }) => {
      createCount += 1;
      return {
        id: `00000000-0000-0000-0000-00000000000${createCount}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: [] },
        status: "PLANNED"
      };
    });
    const app = buildServer();

    const response = await app.inject({
      method: "GET",
      url: "/plans/week?strengthDays=3"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().program.goal).toBe("balanced");
    expect(response.json().days).toHaveLength(7);
    const mobilityDay = response.json().days.find((day: { type: string }) => day.type === "mobility");
    const zone2Day = response.json().days.find((day: { type: string }) => day.type === "zone2");
    const recoveryDay = response.json().days.find((day: { type: string }) => day.type === "recovery");
    expect(mobilityDay?.session?.exercises?.length ?? 0).toBeGreaterThan(0);
    expect(zone2Day?.session?.exercises?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(recoveryDay?.session?.exercises?.length ?? 0).toBeGreaterThan(0);
    await app.close();
  });

  it("refreshes planned strength sessions for a week", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
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
      },
      {
        id: "ex-2",
        name: "90/90 Hip Switch",
        category: "mobility",
        movementPattern: "mobility",
        muscleGroup: "legs",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-3",
        name: "Box Breathing",
        category: "accessory",
        movementPattern: "core",
        muscleGroup: "core",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-4",
        name: "Incline Walk",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      }
    ]);
    mockPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000101",
        userId: "user-1",
        sessionDate: new Date("2026-02-16T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000102",
        userId: "user-1",
        sessionDate: new Date("2026-02-17T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000103",
        userId: "user-1",
        sessionDate: new Date("2026-02-18T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000104",
        userId: "user-1",
        sessionDate: new Date("2026-02-19T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000105",
        userId: "user-1",
        sessionDate: new Date("2026-02-20T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000106",
        userId: "user-1",
        sessionDate: new Date("2026-02-21T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      },
      {
        id: "00000000-0000-0000-0000-000000000107",
        userId: "user-1",
        sessionDate: new Date("2026-02-22T00:00:00.000Z"),
        engineVersion: "v0",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
        status: "PLANNED"
      }
    ]);
    mockPrisma.workoutSession.update.mockImplementation(async (args: {
      where: { id: string };
      data: { engineVersion: string; snapshot: unknown; status: string };
    }) => ({
      id: args.where.id,
      userId: "user-1",
      sessionDate: new Date("2026-02-16T00:00:00.000Z"),
      engineVersion: args.data.engineVersion,
      snapshot: args.data.snapshot,
      status: args.data.status
    }));

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().days).toHaveLength(7);
    expect(mockPrisma.workoutSession.update).toHaveBeenCalled();
    expect(mockPrisma.workoutSession.create).not.toHaveBeenCalled();
    await app.close();
  });

  it("does not modify completed sessions during week refresh", async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
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
      },
      {
        id: "ex-2",
        name: "90/90 Hip Switch",
        category: "mobility",
        movementPattern: "mobility",
        muscleGroup: "legs",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-3",
        name: "Box Breathing",
        category: "accessory",
        movementPattern: "core",
        muscleGroup: "core",
        equipment: "bodyweight",
        difficulty: 1,
        isActive: true
      },
      {
        id: "ex-4",
        name: "Incline Walk",
        category: "conditioning",
        movementPattern: "warmup",
        muscleGroup: "full_body",
        equipment: "machine",
        difficulty: 1,
        isActive: true
      }
    ]);
    mockPrisma.workoutSession.findMany.mockResolvedValue([
      {
        id: "00000000-0000-0000-0000-000000000201",
        userId: "user-1",
        sessionDate: new Date("2026-02-16T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000202",
        userId: "user-1",
        sessionDate: new Date("2026-02-17T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000203",
        userId: "user-1",
        sessionDate: new Date("2026-02-18T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000204",
        userId: "user-1",
        sessionDate: new Date("2026-02-19T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000205",
        userId: "user-1",
        sessionDate: new Date("2026-02-20T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000206",
        userId: "user-1",
        sessionDate: new Date("2026-02-21T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      },
      {
        id: "00000000-0000-0000-0000-000000000207",
        userId: "user-1",
        sessionDate: new Date("2026-02-22T00:00:00.000Z"),
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: ["completed"] },
        status: "COMPLETED"
      }
    ]);

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().days).toHaveLength(7);
    expect(mockPrisma.workoutSession.update).not.toHaveBeenCalled();
    expect(mockPrisma.workoutSession.create).not.toHaveBeenCalled();
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

  it("applies swap and persists updated snapshot", async () => {
    mockPrisma.workoutSession.findUnique.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "user-1",
      snapshot: {
        exercises: [
          {
            exerciseId: "ex-1",
            name: "Goblet Squat",
            sets: 3,
            reps: 8,
            intensity: 7
          }
        ],
        engineVersion: "v1",
        notes: []
      }
    });
    mockPrisma.exercise.findUnique
      .mockResolvedValueOnce({
        id: "ex-1",
        movementPattern: "squat",
        muscleGroup: "legs"
      })
      .mockResolvedValueOnce({
        id: "ex-2",
        name: "Front Squat",
        movementPattern: "squat",
        muscleGroup: "legs",
        isActive: true
      });
    mockPrisma.workoutSession.update.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/00000000-0000-0000-0000-000000000001/swap/apply",
      payload: {
        fromExerciseId: "ex-1",
        toExerciseId: "ex-2"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("success");
    expect(response.json().exercises[0].exerciseId).toBe("ex-2");
    expect(mockPrisma.workoutSession.update).toHaveBeenCalledWith({
      where: { id: "00000000-0000-0000-0000-000000000001" },
      data: {
        snapshot: {
          exercises: [
            {
              exerciseId: "ex-2",
              name: "Front Squat",
              sets: 3,
              reps: 8,
              intensity: 7
            }
          ],
          engineVersion: "v1",
          notes: []
        }
      }
    });
    await app.close();
  });

  it("rejects swap apply when target exercise already exists in session", async () => {
    mockPrisma.workoutSession.findUnique.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: "user-1",
      snapshot: {
        exercises: [
          {
            exerciseId: "ex-1",
            name: "Goblet Squat",
            sets: 3,
            reps: 8,
            intensity: 7
          },
          {
            exerciseId: "ex-2",
            name: "Front Squat",
            sets: 3,
            reps: 8,
            intensity: 7
          }
        ],
        engineVersion: "v1",
        notes: []
      }
    });
    mockPrisma.exercise.findUnique
      .mockResolvedValueOnce({
        id: "ex-1",
        movementPattern: "squat",
        muscleGroup: "legs"
      })
      .mockResolvedValueOnce({
        id: "ex-2",
        name: "Front Squat",
        movementPattern: "squat",
        muscleGroup: "legs",
        isActive: true
      });

    const app = buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/00000000-0000-0000-0000-000000000001/swap/apply",
      payload: {
        fromExerciseId: "ex-1",
        toExerciseId: "ex-2"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Exercise already in session. Choose another candidate."
    });
    expect(mockPrisma.workoutSession.update).not.toHaveBeenCalled();
    await app.close();
  });
});
