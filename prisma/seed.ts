import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.exercise.createMany({
    data: [
      {
        id: "squat-goblet",
        name: "Goblet Squat",
        category: "compound",
        movementPattern: "squat",
        muscleGroup: "legs",
        equipment: "dumbbell",
        difficulty: 1
      },
      {
        id: "hinge-rdl",
        name: "Romanian Deadlift",
        category: "compound",
        movementPattern: "hinge",
        muscleGroup: "legs",
        equipment: "barbell",
        difficulty: 2
      },
      {
        id: "push-db-press",
        name: "Dumbbell Bench Press",
        category: "compound",
        movementPattern: "push",
        muscleGroup: "chest",
        equipment: "dumbbell",
        difficulty: 2
      },
      {
        id: "pull-row-cable",
        name: "Seated Cable Row",
        category: "accessory",
        movementPattern: "pull",
        muscleGroup: "back",
        equipment: "cable",
        difficulty: 1
      },
      {
        id: "core-plank",
        name: "Plank",
        category: "accessory",
        movementPattern: "core",
        muscleGroup: "core",
        equipment: "bodyweight",
        difficulty: 1
      },
      {
        id: "mobility-hip-flow",
        name: "Hip Mobility Flow",
        category: "mobility",
        movementPattern: "mobility",
        muscleGroup: "full_body",
        equipment: "bodyweight",
        difficulty: 1
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
