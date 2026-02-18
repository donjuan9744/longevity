import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
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
    upsert: vi.fn(),
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
    deleteMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
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
  weeklyPlanSeed: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
}));

vi.mock("../src/db/prisma.js", () => ({
  prisma: mockPrisma
}));

const weeklyExercisePool = [
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
    name: "Romanian Deadlift",
    category: "compound",
    movementPattern: "hinge",
    muscleGroup: "legs",
    equipment: "barbell",
    difficulty: 2,
    isActive: true
  },
  {
    id: "ex-3",
    name: "Reverse Lunge",
    category: "accessory",
    movementPattern: "lunge",
    muscleGroup: "legs",
    equipment: "dumbbell",
    difficulty: 2,
    isActive: true
  },
  {
    id: "ex-4",
    name: "Bench Press",
    category: "compound",
    movementPattern: "push",
    muscleGroup: "chest",
    equipment: "barbell",
    difficulty: 2,
    isActive: true
  },
  {
    id: "ex-5",
    name: "Overhead Press",
    category: "compound",
    movementPattern: "overhead_push",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    difficulty: 2,
    isActive: true
  },
  {
    id: "ex-6",
    name: "Bent Over Row",
    category: "compound",
    movementPattern: "pull",
    muscleGroup: "back",
    equipment: "barbell",
    difficulty: 2,
    isActive: true
  },
  {
    id: "ex-7",
    name: "Lat Pulldown",
    category: "accessory",
    movementPattern: "overhead_pull",
    muscleGroup: "back",
    equipment: "machine",
    difficulty: 1,
    isActive: true
  },
  {
    id: "ex-8",
    name: "Farmer Carry",
    category: "accessory",
    movementPattern: "carry",
    muscleGroup: "core",
    equipment: "dumbbell",
    difficulty: 1,
    isActive: true
  },
  {
    id: "ex-9",
    name: "Pallof Press",
    category: "accessory",
    movementPattern: "core",
    muscleGroup: "core",
    equipment: "cable",
    difficulty: 1,
    isActive: true
  },
  {
    id: "ex-10",
    name: "90/90 Hip Switch",
    category: "mobility",
    movementPattern: "mobility",
    muscleGroup: "legs",
    equipment: "bodyweight",
    difficulty: 1,
    isActive: true
  },
  {
    id: "ex-11",
    name: "Assault Bike",
    category: "conditioning",
    movementPattern: "warmup",
    muscleGroup: "full_body",
    equipment: "machine",
    difficulty: 1,
    isActive: true
  }
];

function toDemoUserId(demoClientId: string): string {
  const hex = createHash("sha256").update(demoClientId).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

describe("backend routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.workoutSession.deleteMany.mockResolvedValue({ count: 0 });
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

    const app = await buildServer();
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
    const app = await buildServer();

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
    const app = await buildServer();

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

  it("generates a weekly plan for a fresh user without foreign key errors", async () => {
    mockPrisma.userProfile.upsert.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProfile.findUnique.mockResolvedValue(null);
    mockPrisma.userProgram.findUnique.mockResolvedValue(null);
    mockPrisma.progressionState.findUnique.mockResolvedValue(null);
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
    mockPrisma.exercise.findMany.mockResolvedValue(weeklyExercisePool);
    mockPrisma.weeklyPlanSeed.findUnique.mockResolvedValue(null);
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    let createCount = 0;
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date } }) => {
      createCount += 1;
      return {
        id: `00000000-0000-0000-0000-00000000041${createCount}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: [] },
        status: "PLANNED"
      };
    });

    const app = await buildServer();
    const response = await app.inject({
      method: "GET",
      url: "/plans/week?start=2026-02-16&strengthDays=3"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().days).toHaveLength(7);
    expect(mockPrisma.userProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      update: {},
      create: { userId: "user-1" }
    });
    expect(mockPrisma.workoutSession.create).toHaveBeenCalled();
    expect(mockPrisma.userProfile.upsert.mock.invocationCallOrder[0]).toBeLessThan(
      mockPrisma.workoutSession.create.mock.invocationCallOrder[0] as number
    );

    await app.close();
  });

  it("ensures user exists before writing weekly plan seed on refresh", async () => {
    mockPrisma.userProfile.upsert.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProfile.findUnique.mockResolvedValue(null);
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
    mockPrisma.exercise.findMany.mockResolvedValue(weeklyExercisePool);
    mockPrisma.weeklyPlanSeed.upsert.mockResolvedValue({ id: "seed-1", userId: "user-1", weekStart: new Date(), seed: 12345 });
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    let createCount = 0;
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date } }) => {
      createCount += 1;
      return {
        id: `00000000-0000-0000-0000-00000000051${createCount}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: [] },
        status: "PLANNED"
      };
    });

    const app = await buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(response.statusCode).toBe(200);
    expect(mockPrisma.userProfile.upsert).toHaveBeenCalled();
    expect(mockPrisma.weeklyPlanSeed.upsert).toHaveBeenCalled();
    expect(mockPrisma.userProfile.upsert.mock.invocationCallOrder[0]).toBeLessThan(
      mockPrisma.weeklyPlanSeed.upsert.mock.invocationCallOrder[0] as number
    );

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
    const sessions = [
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
    ];
    let createdCount = 0;
    mockPrisma.workoutSession.findMany.mockImplementation(async () => sessions);
    mockPrisma.workoutSession.deleteMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) => {
      const ids = new Set(args.where.id.in);
      const retained = sessions.filter((session) => !ids.has(session.id));
      sessions.length = 0;
      sessions.push(...retained);
      return { count: ids.size };
    });
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date; engineVersion: string; snapshot: unknown; status: string } }) => {
      createdCount += 1;
      const suffix = String(900 + createdCount).padStart(12, "0");
      const created = {
        id: `00000000-0000-0000-0000-${suffix}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: args.data.engineVersion,
        snapshot: args.data.snapshot,
        status: args.data.status
      };
      sessions.push(created);
      return created;
    });

    const app = await buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().days).toHaveLength(7);
    expect(mockPrisma.workoutSession.deleteMany).toHaveBeenCalled();
    expect(mockPrisma.workoutSession.create).toHaveBeenCalled();
    expect(mockPrisma.workoutSession.update).not.toHaveBeenCalled();
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

    const app = await buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().days).toHaveLength(7);
    expect(mockPrisma.workoutSession.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.workoutSession.update).not.toHaveBeenCalled();
    expect(mockPrisma.workoutSession.create).not.toHaveBeenCalled();
    await app.close();
  });

  it("refreshes with a new persisted seed and changes at least one strength session", async () => {
    const weekDates = ["2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-02-21", "2026-02-22"];
    const sessions = weekDates.map((date, index) => ({
      id: `00000000-0000-0000-0000-0000000003${index + 1}0`,
      userId: "user-1",
      sessionDate: new Date(`${date}T00:00:00.000Z`),
      engineVersion: "v0",
      snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
      status: "PLANNED"
    }));

    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
    mockPrisma.exercise.findMany.mockResolvedValue(weeklyExercisePool);
    mockPrisma.weeklyPlanSeed.upsert.mockImplementation(async (args: { create: { seed: number } }) => ({
      id: "weekly-seed-1",
      userId: "user-1",
      weekStart: new Date("2026-02-16T00:00:00.000Z"),
      seed: args.create.seed,
      updatedAt: new Date("2026-02-16T00:00:00.000Z")
    }));
    mockPrisma.workoutSession.findMany.mockImplementation(async () => sessions);
    let createdCount = 0;
    mockPrisma.workoutSession.deleteMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) => {
      const ids = new Set(args.where.id.in);
      const retained = sessions.filter((session) => !ids.has(session.id));
      sessions.length = 0;
      sessions.push(...retained);
      return { count: ids.size };
    });
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date; engineVersion: string; snapshot: unknown; status: string } }) => {
      createdCount += 1;
      const created = {
        id: `00000000-0000-0000-0000-0000000005${createdCount}0`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: args.data.engineVersion,
        snapshot: args.data.snapshot as { exercises: unknown[]; engineVersion: string; notes: string[] },
        status: args.data.status
      };
      sessions.push(created);
      return created;
    });

    const dateNowSpy = vi.spyOn(Date, "now");
    dateNowSpy.mockReturnValueOnce(1700000000000).mockReturnValueOnce(1700000001000);

    const app = await buildServer();
    const firstRefresh = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });
    const secondRefresh = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });

    expect(firstRefresh.statusCode).toBe(200);
    expect(secondRefresh.statusCode).toBe(200);
    expect(firstRefresh.json().planSeed).not.toBe(secondRefresh.json().planSeed);

    const firstStrength = firstRefresh
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { session: { exercises: Array<{ exerciseId: string }> } }) =>
        day.session.exercises.map((exercise) => exercise.exerciseId).join("|")
      );
    const secondStrength = secondRefresh
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { session: { exercises: Array<{ exerciseId: string }> } }) =>
        day.session.exercises.map((exercise) => exercise.exerciseId).join("|")
      );

    expect(firstStrength).not.toEqual(secondStrength);
    expect(mockPrisma.weeklyPlanSeed.upsert).toHaveBeenCalledTimes(2);

    dateNowSpy.mockRestore();
    await app.close();
  });

  it("returns the refreshed plan on later GET for the same week", async () => {
    const weekDates = ["2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-02-21", "2026-02-22"];
    const sessions = weekDates.map((date, index) => ({
      id: `00000000-0000-0000-0000-0000000004${index + 1}0`,
      userId: "user-1",
      sessionDate: new Date(`${date}T00:00:00.000Z`),
      engineVersion: "v0",
      snapshot: { exercises: [], engineVersion: "v1", notes: ["old"] },
      status: "PLANNED"
    }));
    let persistedSeed: number | null = null;

    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 4, active: true });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 0, deloadCount: 0 });
    mockPrisma.readinessEntry.findMany.mockResolvedValue([]);
    mockPrisma.exercise.findMany.mockResolvedValue(weeklyExercisePool);
    mockPrisma.weeklyPlanSeed.upsert.mockImplementation(async (args: { create: { seed: number } }) => {
      persistedSeed = args.create.seed;
      return {
        id: "weekly-seed-2",
        userId: "user-1",
        weekStart: new Date("2026-02-16T00:00:00.000Z"),
        seed: persistedSeed,
        updatedAt: new Date("2026-02-16T00:00:00.000Z")
      };
    });
    mockPrisma.weeklyPlanSeed.findUnique.mockImplementation(async () =>
      persistedSeed === null
        ? null
        : {
            id: "weekly-seed-2",
            userId: "user-1",
            weekStart: new Date("2026-02-16T00:00:00.000Z"),
            seed: persistedSeed,
            updatedAt: new Date("2026-02-16T00:00:00.000Z")
          }
    );
    mockPrisma.workoutSession.findMany.mockImplementation(async () => sessions);
    let createdCount = 0;
    mockPrisma.workoutSession.deleteMany.mockImplementation(async (args: { where: { id: { in: string[] } } }) => {
      const ids = new Set(args.where.id.in);
      const retained = sessions.filter((session) => !ids.has(session.id));
      sessions.length = 0;
      sessions.push(...retained);
      return { count: ids.size };
    });
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date; engineVersion: string; snapshot: unknown; status: string } }) => {
      createdCount += 1;
      const created = {
        id: `00000000-0000-0000-0000-0000000006${createdCount}0`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: args.data.engineVersion,
        snapshot: args.data.snapshot as { exercises: unknown[]; engineVersion: string; notes: string[] },
        status: args.data.status
      };
      sessions.push(created);
      return created;
    });

    vi.spyOn(Date, "now").mockReturnValue(1700000010000);

    const app = await buildServer();
    const refreshResponse = await app.inject({
      method: "POST",
      url: "/plans/week/refresh?weekStart=2026-02-16"
    });
    const getResponse = await app.inject({
      method: "GET",
      url: "/plans/week?start=2026-02-16"
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().planSeed).toBe(refreshResponse.json().planSeed);

    const refreshStrength = refreshResponse
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { session: { exercises: Array<{ exerciseId: string }> } }) =>
        day.session.exercises.map((exercise) => exercise.exerciseId).join("|")
      );
    const getStrength = getResponse
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { session: { exercises: Array<{ exerciseId: string }> } }) =>
        day.session.exercises.map((exercise) => exercise.exerciseId).join("|")
      );

    expect(getStrength).toEqual(refreshStrength);
    expect(mockPrisma.weeklyPlanSeed.findUnique).toHaveBeenCalled();
    vi.restoreAllMocks();
    await app.close();
  });

  it("submits session results", async () => {
    mockPrisma.workoutSession.findUnique.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001", userId: "user-1" });
    mockPrisma.sessionResult.createMany.mockResolvedValue({ count: 1 });
    mockPrisma.workoutSession.update.mockResolvedValue({ id: "00000000-0000-0000-0000-000000000001" });
    mockPrisma.progressionState.findUnique.mockResolvedValue({ strengthLevel: 3, volumeLevel: 3, fatigueScore: 2, deloadCount: 0 });
    mockPrisma.progressionState.upsert.mockResolvedValue({ id: "p1" });

    const app = await buildServer();
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

  it("cancels a session and excludes it from weekly plan output", async () => {
    const cancelledSessionId = "00000000-0000-0000-0000-000000000901";
    let createdCount = 0;

    mockPrisma.workoutSession.findUnique.mockResolvedValue({ id: cancelledSessionId, userId: "user-1" });
    mockPrisma.workoutSession.update.mockResolvedValue({ id: cancelledSessionId, status: "CANCELLED" });
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 3, active: true });
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
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date } }) => {
      createdCount += 1;
      return {
        id: `00000000-0000-0000-0000-00000000091${createdCount}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: [] },
        status: "PLANNED"
      };
    });

    const app = await buildServer();
    const cancelResponse = await app.inject({
      method: "DELETE",
      url: `/sessions/${cancelledSessionId}`
    });
    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json()).toEqual({ status: "success" });

    const weekResponse = await app.inject({
      method: "GET",
      url: "/plans/week?start=2026-02-16&strengthDays=3"
    });
    expect(weekResponse.statusCode).toBe(200);
    const returnedSessionIds = weekResponse
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { sessionId: string }) => day.sessionId);
    expect(returnedSessionIds).not.toContain(cancelledSessionId);
    await app.close();
  });

  it("cancels all sessions in a week and excludes them from weekly plan output", async () => {
    const cancelledIds = [
      "00000000-0000-0000-0000-000000000801",
      "00000000-0000-0000-0000-000000000802",
      "00000000-0000-0000-0000-000000000803"
    ];
    let createdCount = 0;

    mockPrisma.workoutSession.updateMany.mockResolvedValue({ count: cancelledIds.length });
    mockPrisma.userProfile.findUnique.mockResolvedValue({ userId: "user-1", goal: "balanced" });
    mockPrisma.userProgram.findUnique.mockResolvedValue({ goal: "balanced", daysPerWeek: 3, active: true });
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
    mockPrisma.workoutSession.findMany.mockResolvedValue([]);
    mockPrisma.workoutSession.create.mockImplementation(async (args: { data: { sessionDate: Date } }) => {
      createdCount += 1;
      return {
        id: `00000000-0000-0000-0000-00000000082${createdCount}`,
        userId: "user-1",
        sessionDate: args.data.sessionDate,
        engineVersion: "v1",
        snapshot: { exercises: [], engineVersion: "v1", notes: [] },
        status: "PLANNED"
      };
    });

    const app = await buildServer();
    const cancelResponse = await app.inject({
      method: "DELETE",
      url: "/plans/week?weekStart=2026-02-16"
    });
    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.json()).toEqual({
      status: "success",
      cancelledCount: cancelledIds.length,
      weekStart: "2026-02-16",
      weekEnd: "2026-02-22"
    });
    expect(mockPrisma.workoutSession.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        sessionDate: {
          gte: new Date("2026-02-16T00:00:00.000Z"),
          lt: new Date("2026-02-23T00:00:00.000Z")
        },
        status: {
          not: "CANCELLED"
        }
      },
      data: {
        status: "CANCELLED"
      }
    });

    const weekResponse = await app.inject({
      method: "GET",
      url: "/plans/week?start=2026-02-16&strengthDays=3"
    });
    expect(weekResponse.statusCode).toBe(200);
    const returnedSessionIds = weekResponse
      .json()
      .days.filter((day: { type: string }) => day.type === "strength")
      .map((day: { sessionId: string }) => day.sessionId);
    expect(returnedSessionIds).not.toEqual(expect.arrayContaining(cancelledIds));
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

    const app = await buildServer();
    const response = await app.inject({
      method: "POST",
      url: "/sessions/00000000-0000-0000-0000-000000000001/swap",
      payload: { exerciseId: "ex-1" }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().candidates).toHaveLength(1);
    await app.close();
  });

  it("returns swap candidates for demo coach client sessions", async () => {
    const demoClientId = "john-davis";
    mockPrisma.workoutSession.findUnique.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      userId: toDemoUserId(demoClientId)
    });
    mockPrisma.exercise.findUnique.mockResolvedValue({
      id: "ex-1",
      movementPattern: "squat",
      muscleGroup: "legs"
    });
    mockPrisma.exercise.findMany.mockResolvedValue([{ id: "ex-2", name: "Front Squat" }]);

    const app = await buildServer();
    const response = await app.inject({
      method: "POST",
      url: `/sessions/00000000-0000-0000-0000-000000000001/swap?demoClientId=${demoClientId}`,
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

    const app = await buildServer();
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

    const app = await buildServer();
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
