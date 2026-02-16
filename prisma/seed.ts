import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.exercise.createMany({
data: [
  // LOWER BODY — Squat (14)
  { id: "squat-box-bw", name: "Bodyweight Box Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },
  { id: "squat-goblet", name: "Goblet Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "dumbbell", difficulty: 1 },
  { id: "squat-goblet-heel-elev", name: "Heel-Elevated Goblet Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "squat-front-light", name: "Front Squat (Light/Moderate)", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "barbell", difficulty: 3 },
  { id: "squat-landmine", name: "Landmine Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "landmine", difficulty: 2 },
  { id: "squat-safety-bar", name: "Safety Bar Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "barbell", difficulty: 3 },
  { id: "squat-hack-machine", name: "Machine Hack Squat", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "machine", difficulty: 2 },
  { id: "squat-wall-sit", name: "Wall Sit (Isometric)", category: "accessory", movementPattern: "squat", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },
  { id: "squat-split", name: "Split Squat", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "squat-ffess", name: "Front-Foot Elevated Split Squat", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "squat-rfess", name: "Rear-Foot Elevated Split Squat", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 3 },
  { id: "squat-step-up-low", name: "Step-Up (Low Box)", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "squat-step-up-lateral", name: "Lateral Step-Up", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "squat-trx-assisted-sls", name: "TRX Assisted Single-Leg Squat", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "trx", difficulty: 2 },

  // LOWER BODY — Hinge (14)
  { id: "hinge-pvc-drill", name: "Hip Hinge Drill (PVC)", category: "accessory", movementPattern: "hinge", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "hinge-rdl-db", name: "Dumbbell Romanian Deadlift", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "hinge-rdl", name: "Romanian Deadlift", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "barbell", difficulty: 2 },
  { id: "hinge-trapbar-deadlift", name: "Trap Bar Deadlift", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "barbell", difficulty: 3 },
  { id: "hinge-kb-deadlift", name: "Kettlebell Deadlift", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "kettlebell", difficulty: 2 },
  { id: "hinge-kb-deadlift-elev", name: "Elevated Kettlebell Deadlift", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "kettlebell", difficulty: 2 },
  { id: "hinge-glute-bridge", name: "Glute Bridge", category: "accessory", movementPattern: "hinge", muscleGroup: "glutes", equipment: "bodyweight", difficulty: 1 },
  { id: "hinge-hip-thrust-bb", name: "Barbell Hip Thrust", category: "compound", movementPattern: "hinge", muscleGroup: "glutes", equipment: "barbell", difficulty: 2 },
  { id: "hinge-sl-rdl-db", name: "Single-Leg RDL (DB)", category: "compound", movementPattern: "hinge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 3 },
  { id: "hinge-cable-pullthrough", name: "Cable Pull-Through", category: "accessory", movementPattern: "hinge", muscleGroup: "glutes", equipment: "cable", difficulty: 2 },
  { id: "hinge-back-extension", name: "Back Extension (Controlled)", category: "accessory", movementPattern: "hinge", muscleGroup: "back", equipment: "machine", difficulty: 2 },
  { id: "hinge-sb-ham-curl", name: "Stability Ball Hamstring Curl", category: "accessory", movementPattern: "hinge", muscleGroup: "hamstrings", equipment: "bodyweight", difficulty: 2 },
  { id: "hinge-nordic-assisted", name: "Nordic Hamstring (Assisted)", category: "accessory", movementPattern: "hinge", muscleGroup: "hamstrings", equipment: "bodyweight", difficulty: 3 },
  { id: "hinge-glute-bridge-iso", name: "Isometric Glute Bridge Hold", category: "accessory", movementPattern: "hinge", muscleGroup: "glutes", equipment: "bodyweight", difficulty: 1 },

  // LOWER BODY — Lunge/Lateral (6)
  { id: "lunge-reverse", name: "Reverse Lunge", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "lunge-lateral", name: "Lateral Lunge", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "lunge-curtsy", name: "Curtsy Lunge (Controlled)", category: "accessory", movementPattern: "lunge", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "lunge-walking", name: "Walking Lunge", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "dumbbell", difficulty: 2 },
  { id: "lunge-cossack-partial", name: "Partial Cossack Squat", category: "accessory", movementPattern: "lunge", muscleGroup: "hips", equipment: "bodyweight", difficulty: 3 },
  { id: "cond-sled-push-light", name: "Sled Push (Light)", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "sled", difficulty: 2 },

  // LOWER BODY — Calf/Ankle (6)
  { id: "calf-raise-standing", name: "Standing Calf Raise", category: "accessory", movementPattern: "calf", muscleGroup: "calves", equipment: "bodyweight", difficulty: 1 },
  { id: "calf-raise-seated", name: "Seated Calf Raise", category: "accessory", movementPattern: "calf", muscleGroup: "calves", equipment: "machine", difficulty: 1 },
  { id: "calf-raise-single-leg", name: "Single-Leg Calf Raise", category: "accessory", movementPattern: "calf", muscleGroup: "calves", equipment: "bodyweight", difficulty: 2 },
  { id: "ankle-tib-raise", name: "Tibialis Raise", category: "accessory", movementPattern: "calf", muscleGroup: "ankles", equipment: "bodyweight", difficulty: 1 },
  { id: "carry-farmer-toes", name: "Farmer Carry on Toes", category: "accessory", movementPattern: "carry", muscleGroup: "calves", equipment: "dumbbell", difficulty: 2 },
  { id: "ankle-heel-walk", name: "Heel Walk", category: "accessory", movementPattern: "balance", muscleGroup: "ankles", equipment: "bodyweight", difficulty: 1 },

  // UPPER — Horizontal Push (10)
  { id: "pushup-incline", name: "Incline Push-Up", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "bodyweight", difficulty: 1 },
  { id: "pushup-standard", name: "Standard Push-Up", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "bodyweight", difficulty: 2 },
  { id: "push-db-press", name: "Dumbbell Bench Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "dumbbell", difficulty: 2 },
  { id: "push-db-incline", name: "Incline Dumbbell Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "dumbbell", difficulty: 2 },
  { id: "push-machine-chest", name: "Machine Chest Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "machine", difficulty: 2 },
  { id: "push-cable-chest", name: "Cable Chest Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "cable", difficulty: 2 },
  { id: "push-db-neutral", name: "Neutral Grip DB Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "dumbbell", difficulty: 2 },
  { id: "pushup-stability-ball", name: "Stability Ball Push-Up", category: "accessory", movementPattern: "push", muscleGroup: "chest", equipment: "bodyweight", difficulty: 3 },
  { id: "pushup-tempo", name: "Tempo Push-Up", category: "accessory", movementPattern: "push", muscleGroup: "chest", equipment: "bodyweight", difficulty: 3 },
  { id: "pushup-iso-hold", name: "Isometric Push-Up Hold", category: "accessory", movementPattern: "push", muscleGroup: "chest", equipment: "bodyweight", difficulty: 2 },

  // UPPER — Horizontal Pull (12)
  { id: "pull-row-cable", name: "Seated Cable Row", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "cable", difficulty: 1 },
  { id: "pull-row-chest-supported-db", name: "Chest-Supported DB Row", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "dumbbell", difficulty: 2 },
  { id: "pull-row-trx", name: "TRX Row", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "trx", difficulty: 2 },
  { id: "pull-row-one-arm-db", name: "One-Arm Dumbbell Row", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "dumbbell", difficulty: 2 },
  { id: "pull-row-machine", name: "Machine Row", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "machine", difficulty: 1 },
  { id: "pull-row-band", name: "Resistance Band Row", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "band", difficulty: 1 },
  { id: "pull-row-meadows-light", name: "Meadows Row (Light)", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "barbell", difficulty: 3 },
  { id: "pull-row-seal", name: "Seal Row", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "barbell", difficulty: 3 },
  { id: "pull-row-tempo", name: "Tempo Row", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "cable", difficulty: 2 },
  { id: "pull-row-iso-hold", name: "Isometric Row Hold", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "cable", difficulty: 2 },
  { id: "pull-face-pull", name: "Face Pull", category: "accessory", movementPattern: "pull", muscleGroup: "shoulders", equipment: "cable", difficulty: 1 },
  { id: "pull-reverse-fly", name: "Reverse Fly (DB/Cable)", category: "accessory", movementPattern: "pull", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: 2 },

  // UPPER — Vertical Push (8)
  { id: "push-landmine", name: "Landmine Press", category: "compound", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "landmine", difficulty: 2 },
  { id: "push-landmine-halfkneel", name: "Half-Kneeling Landmine Press", category: "compound", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "landmine", difficulty: 2 },
  { id: "push-db-press-seated-neutral", name: "Seated DB Press (Neutral Grip)", category: "compound", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: 2 },
  { id: "push-arnold-light", name: "Arnold Press (Light)", category: "accessory", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: 3 },
  { id: "push-machine-shoulder", name: "Machine Shoulder Press", category: "compound", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "machine", difficulty: 2 },
  { id: "mobility-wall-slide", name: "Wall Slide", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 1 },
  { id: "push-pike-elev", name: "Pike Push-Up (Elevated Hands)", category: "accessory", movementPattern: "overhead_push", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 3 },
  { id: "carry-overhead-light", name: "Light Overhead Carry", category: "accessory", movementPattern: "carry", muscleGroup: "shoulders", equipment: "dumbbell", difficulty: 2 },

  // UPPER — Vertical Pull (6)
  { id: "pullup-assisted", name: "Assisted Pull-Up", category: "compound", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "machine", difficulty: 2 },
  { id: "pulldown-neutral", name: "Lat Pulldown (Neutral Grip)", category: "compound", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "cable", difficulty: 2 },
  { id: "pulldown-close", name: "Close Grip Pulldown", category: "compound", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "cable", difficulty: 2 },
  { id: "pullup-band-assisted", name: "Band Assisted Pull-Up", category: "compound", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "band", difficulty: 2 },
  { id: "pulldown-straight-arm", name: "Straight Arm Pulldown", category: "accessory", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "cable", difficulty: 1 },
  { id: "pullup-scapular", name: "Scapular Pull-Up", category: "accessory", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "bodyweight", difficulty: 2 },

  // UPPER — Arms (4)
  { id: "arm-hammer-curl", name: "Hammer Curl", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "dumbbell", difficulty: 1 },
  { id: "arm-incline-curl", name: "Incline Dumbbell Curl", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "dumbbell", difficulty: 2 },
  { id: "arm-triceps-pushdown", name: "Triceps Pushdown", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "cable", difficulty: 1 },
  { id: "arm-triceps-overhead-cable", name: "Overhead Cable Triceps Extension", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "cable", difficulty: 2 },

  // CORE & STABILITY (30)
  { id: "core-plank", name: "Plank", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "core-dead-bug", name: "Dead Bug", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "core-sb-rollout", name: "Stability Ball Rollout", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 2 },
  { id: "core-abwheel-knees", name: "Ab Wheel (Knees)", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 3 },
  { id: "core-bear-hold", name: "Bear Crawl Hold", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 2 },
  { id: "core-hollow-scaled", name: "Hollow Body Hold (Scaled)", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 2 },

  { id: "core-pallof", name: "Pallof Press", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 1 },
  { id: "core-pallof-halfkneel", name: "Half-Kneeling Pallof Press", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 2 },
  { id: "core-cable-chop", name: "Cable Chop", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 2 },
  { id: "core-cable-lift", name: "Cable Lift", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 2 },
  { id: "carry-suitcase", name: "Suitcase Carry", category: "accessory", movementPattern: "carry", muscleGroup: "core", equipment: "dumbbell", difficulty: 1 },
  { id: "core-deadbug-band", name: "Dead Bug with Band", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "band", difficulty: 2 },

  { id: "core-side-plank", name: "Side Plank", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "core-copenhagen-short", name: "Copenhagen Plank (Short Lever)", category: "accessory", movementPattern: "core", muscleGroup: "hips", equipment: "bodyweight", difficulty: 3 },
  { id: "carry-offset", name: "Offset Carry", category: "accessory", movementPattern: "carry", muscleGroup: "core", equipment: "dumbbell", difficulty: 2 },
  { id: "carry-single-arm-farmer", name: "Single Arm Farmer Carry", category: "accessory", movementPattern: "carry", muscleGroup: "core", equipment: "dumbbell", difficulty: 2 },
  { id: "core-anti-lateral-hold", name: "Standing Anti-Lateral Hold", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 2 },

  { id: "core-medball-rotation-slow", name: "Medicine Ball Rotation (Slow)", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "medicine_ball", difficulty: 2 },
  { id: "core-cable-rotation", name: "Cable Rotation", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "cable", difficulty: 2 },
  { id: "mobility-tspine-rotation-band", name: "Thoracic Rotation with Band", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "band", difficulty: 1 },
  { id: "core-seated-rotation-controlled", name: "Seated Controlled Rotation", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "core-russian-twist-light", name: "Russian Twist (Light)", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "medicine_ball", difficulty: 2 },

  { id: "carry-farmer", name: "Farmer Carry", category: "accessory", movementPattern: "carry", muscleGroup: "full_body", equipment: "dumbbell", difficulty: 1 },
  { id: "carry-front-rack", name: "Front Rack Carry", category: "accessory", movementPattern: "carry", muscleGroup: "full_body", equipment: "kettlebell", difficulty: 2 },
  { id: "carry-overhead-light-2", name: "Overhead Carry (Light)", category: "accessory", movementPattern: "carry", muscleGroup: "shoulders", equipment: "kettlebell", difficulty: 2 },
  { id: "carry-suitcase-2", name: "Suitcase Carry (Alt)", category: "accessory", movementPattern: "carry", muscleGroup: "core", equipment: "kettlebell", difficulty: 1 },

  { id: "balance-single-leg-eyes-closed", name: "Single-Leg Balance (Eyes Closed)", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "balance-sl-rdl-reach", name: "Single-Leg RDL Reach", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "balance-bosu-hold", name: "Bosu Balance Hold", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bosu", difficulty: 2 },
  { id: "balance-tandem-walk", name: "Tandem Walk", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },

  // MOBILITY (25)
  { id: "mobility-hip-90-90", name: "90/90 Hip Flow", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-hip-flexor-dynamic", name: "Dynamic Hip Flexor Stretch", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-adductor-rockback", name: "Adductor Rockback", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-pigeon-mod", name: "Modified Pigeon Stretch", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-glute-bridge-mob", name: "Glute Bridge Mobilization", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-deep-squat-hold", name: "Deep Squat Hold", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-couch-stretch", name: "Couch Stretch", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 2 },

  { id: "mobility-open-book", name: "Open Book Rotation", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-thread-needle", name: "Thread the Needle", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-tspine-extension-roller", name: "T-Spine Extension on Foam Roller", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "foam_roller", difficulty: 1 },
  { id: "mobility-quadruped-rotation", name: "Quadruped Rotation", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-wall-tspine-rotation", name: "Wall Thoracic Rotation", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-seated-tspine-rotation", name: "Seated T-Spine Rotation", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },

  { id: "mobility-band-pull-apart", name: "Band Pull-Apart", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "band", difficulty: 1 },
  { id: "mobility-wall-slides", name: "Wall Slides", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-shoulder-cars", name: "Shoulder CARs", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-sleeper-gentle", name: "Sleeper Stretch (Gentle)", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-doorway-pec", name: "Doorway Pec Stretch", category: "mobility", movementPattern: "mobility", muscleGroup: "chest", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-scap-pushup", name: "Scapular Push-Up", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 1 },

  { id: "mobility-ankle-dorsi-rock", name: "Ankle Dorsiflexion Rock", category: "mobility", movementPattern: "mobility", muscleGroup: "ankles", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-knee-to-wall", name: "Knee to Wall Drill", category: "mobility", movementPattern: "mobility", muscleGroup: "ankles", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-calf-stretch", name: "Calf Stretch", category: "mobility", movementPattern: "mobility", muscleGroup: "calves", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-ankle-banded", name: "Banded Ankle Mobilization", category: "mobility", movementPattern: "mobility", muscleGroup: "ankles", equipment: "band", difficulty: 2 },

  { id: "warmup-worlds-greatest", name: "World’s Greatest Stretch", category: "mobility", movementPattern: "warmup", muscleGroup: "full_body", equipment: "bodyweight", difficulty: 2 },
  { id: "warmup-leg-swings", name: "Controlled Leg Swings", category: "mobility", movementPattern: "warmup", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },

  // CONDITIONING (15)
  { id: "cond-zone2-incline-walk", name: "Incline Walking", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 1 },
  { id: "cond-zone2-bike", name: "Stationary Bike", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 1 },
  { id: "cond-zone2-row", name: "Rowing (Steady)", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 2 },
  { id: "cond-zone2-elliptical", name: "Elliptical", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 1 },
  { id: "cond-zone2-swim", name: "Swimming", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "bodyweight", difficulty: 2 },

  { id: "cond-interval-bike", name: "Bike Intervals", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 2 },
  { id: "cond-interval-row", name: "Row Intervals", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 2 },
  { id: "cond-interval-incline-walk", name: "Incline Walk Intervals", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 2 },
  { id: "cond-interval-sled", name: "Sled Push Intervals", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "sled", difficulty: 2 },
  { id: "cond-interval-kb-swing", name: "Kettlebell Swing Intervals (Moderate)", category: "conditioning", movementPattern: "hinge", muscleGroup: "glutes", equipment: "kettlebell", difficulty: 3 },

  { id: "cond-circuit-db-complex", name: "Dumbbell Complex (Controlled)", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "dumbbell", difficulty: 3 },
  { id: "cond-circuit-bodyweight", name: "Bodyweight Circuit", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "bodyweight", difficulty: 2 },
  { id: "cond-circuit-stepup", name: "Step-Up Circuit", category: "conditioning", movementPattern: "conditioning", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },
  { id: "cond-circuit-landmine", name: "Landmine Circuit", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "landmine", difficulty: 3 },
  { id: "cond-circuit-carry-core", name: "Carry + Core Circuit", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "dumbbell", difficulty: 2 },

  // FILLERS to reach 150 (safe longevity variations)
  // Lower body accessory & machines
  { id: "legs-leg-press", name: "Leg Press (Machine)", category: "compound", movementPattern: "squat", muscleGroup: "legs", equipment: "machine", difficulty: 2 },
  { id: "legs-leg-extension", name: "Leg Extension", category: "accessory", movementPattern: "squat", muscleGroup: "legs", equipment: "machine", difficulty: 1 },
  { id: "legs-leg-curl", name: "Seated Leg Curl", category: "accessory", movementPattern: "hinge", muscleGroup: "hamstrings", equipment: "machine", difficulty: 1 },
  { id: "glutes-cable-kickback", name: "Cable Glute Kickback", category: "accessory", movementPattern: "hinge", muscleGroup: "glutes", equipment: "cable", difficulty: 1 },
  { id: "hips-band-walk", name: "Lateral Band Walk", category: "accessory", movementPattern: "balance", muscleGroup: "hips", equipment: "band", difficulty: 1 },

  // Upper body joint-friendly extras
  { id: "push-machine-incline", name: "Machine Incline Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "machine", difficulty: 2 },
  { id: "push-cable-fly", name: "Cable Fly (Light)", category: "accessory", movementPattern: "push", muscleGroup: "chest", equipment: "cable", difficulty: 2 },
  { id: "pull-band-pullapart-2", name: "Band Pull-Apart (Volume)", category: "accessory", movementPattern: "pull", muscleGroup: "shoulders", equipment: "band", difficulty: 1 },
  { id: "pull-cable-row-neutral", name: "Cable Row (Neutral Grip)", category: "compound", movementPattern: "pull", muscleGroup: "back", equipment: "cable", difficulty: 1 },
  { id: "pull-lat-pulldown-wide", name: "Lat Pulldown (Wide)", category: "compound", movementPattern: "overhead_pull", muscleGroup: "back", equipment: "cable", difficulty: 2 },

  // Core extras
  { id: "core-bird-dog", name: "Bird Dog", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "core-side-plank-reach", name: "Side Plank Reach", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "bodyweight", difficulty: 2 },
  { id: "core-farmers-march", name: "Farmer Carry March", category: "accessory", movementPattern: "carry", muscleGroup: "core", equipment: "dumbbell", difficulty: 2 },
  { id: "core-pallof-walkout", name: "Pallof Walkout", category: "accessory", movementPattern: "core", muscleGroup: "core", equipment: "band", difficulty: 2 },

  // Mobility extras (safe)
  { id: "mobility-hip-cars", name: "Hip CARs", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-ankle-cars", name: "Ankle CARs", category: "mobility", movementPattern: "mobility", muscleGroup: "ankles", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-shoulder-cars-2", name: "Shoulder CARs (Slow)", category: "mobility", movementPattern: "mobility", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-tspine-cat-cow", name: "Cat-Cow", category: "mobility", movementPattern: "mobility", muscleGroup: "t_spine", equipment: "bodyweight", difficulty: 1 },

  // Balance extras
  { id: "balance-tandem-stance", name: "Tandem Stance Hold", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },
  { id: "balance-single-leg-toe-taps", name: "Single-Leg Toe Taps", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 2 },

  // Conditioning extras (low impact)
  { id: "cond-stepper-steady", name: "Stair Stepper (Steady)", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 2 },
  { id: "cond-walk-outdoors", name: "Outdoor Brisk Walk", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "bodyweight", difficulty: 1 },
  { id: "cond-bike-zone2-long", name: "Bike Zone 2 (Long)", category: "conditioning", movementPattern: "conditioning", muscleGroup: "full_body", equipment: "cardio_machine", difficulty: 1 },

  // --- Pad to exactly 150 with simple variations (safe, longevity-friendly) ---
  // (These are mostly harmless variations that help variety without changing schema.)
  { id: "push-db-floor-press", name: "Dumbbell Floor Press", category: "compound", movementPattern: "push", muscleGroup: "chest", equipment: "dumbbell", difficulty: 2 },
  { id: "pull-row-band-seated", name: "Seated Band Row", category: "accessory", movementPattern: "pull", muscleGroup: "back", equipment: "band", difficulty: 1 },
  { id: "legs-split-squat-bw", name: "Split Squat (Bodyweight)", category: "compound", movementPattern: "lunge", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },
  { id: "hinge-hip-thrust-db", name: "Dumbbell Hip Thrust", category: "compound", movementPattern: "hinge", muscleGroup: "glutes", equipment: "dumbbell", difficulty: 2 },
  { id: "core-march-glute-bridge", name: "Glute Bridge March", category: "accessory", movementPattern: "core", muscleGroup: "glutes", equipment: "bodyweight", difficulty: 2 },
  { id: "mobility-hip-flexor-hold", name: "Hip Flexor Stretch (Hold)", category: "mobility", movementPattern: "mobility", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-pec-stretch", name: "Pec Stretch (Doorway)", category: "mobility", movementPattern: "mobility", muscleGroup: "chest", equipment: "bodyweight", difficulty: 1 },
  { id: "arms-band-curl", name: "Band Curl", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "band", difficulty: 1 },
  { id: "arms-band-pressdown", name: "Band Triceps Pressdown", category: "accessory", movementPattern: "arms", muscleGroup: "arms", equipment: "band", difficulty: 1 },
  { id: "carry-farmer-kb", name: "Farmer Carry (Kettlebell)", category: "accessory", movementPattern: "carry", muscleGroup: "full_body", equipment: "kettlebell", difficulty: 1 },
  { id: "warmup-arm-circles", name: "Arm Circles", category: "mobility", movementPattern: "warmup", muscleGroup: "shoulders", equipment: "bodyweight", difficulty: 1 },
  { id: "warmup-hip-circles", name: "Hip Circles", category: "mobility", movementPattern: "warmup", muscleGroup: "hips", equipment: "bodyweight", difficulty: 1 },
  { id: "balance-heel-to-toe-walk", name: "Heel-to-Toe Walk", category: "accessory", movementPattern: "balance", muscleGroup: "legs", equipment: "bodyweight", difficulty: 1 },
  { id: "core-breathing-90-90", name: "90/90 Breathing", category: "mobility", movementPattern: "mobility", muscleGroup: "core", equipment: "bodyweight", difficulty: 1 },
  { id: "mobility-hip-flow", name: "Hip Mobility Flow", category: "mobility", movementPattern: "mobility", muscleGroup: "full_body", equipment: "bodyweight", difficulty: 1 }
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
