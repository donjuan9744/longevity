import { generateSession } from "./generateSession.js";
const WEEKLY_ENGINE_VERSION = "v1-weekly";
const NON_STRENGTH_ENGINE_VERSION = "v1";
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function parseIsoDate(isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid weekStart date");
    }
    return parsed;
}
function formatIsoDate(date) {
    return date.toISOString().slice(0, 10);
}
function addDays(date, days) {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + days);
    return next;
}
function getStrengthSlots(strengthDays) {
    if (strengthDays === 2) {
        return [1, 4];
    }
    if (strengthDays === 3) {
        return [0, 2, 4];
    }
    if (strengthDays === 4) {
        return [0, 1, 3, 5];
    }
    return [0, 1, 2, 4, 5];
}
function getEmphasisOrder(seed) {
    const base = ["lower", "push", "pull", "full_body_light"];
    const shift = Math.abs(seed) % base.length;
    return base.map((_, index) => base[(index + shift) % base.length]);
}
function getBalancedEmphasisOrder(seed) {
    const base = ["lower", "push", "pull"];
    const shift = Math.abs(seed) % base.length;
    return base.map((_, index) => base[(index + shift) % base.length]);
}
const LOWER_PATTERNS = new Set(["squat", "hinge", "lunge", "calf", "balance"]);
const PUSH_PATTERNS = new Set(["push", "overhead_push"]);
const PULL_PATTERNS = new Set(["pull", "overhead_pull"]);
const CORE_CARRY_PATTERNS = new Set(["core", "carry"]);
const STABILITY_PATTERNS = new Set(["mobility", "warmup", "balance"]);
const FULL_BODY_LIGHT_PATTERNS = new Set([
    "squat",
    "hinge",
    "lunge",
    "push",
    "overhead_push",
    "pull",
    "overhead_pull",
    "core",
    "carry"
]);
export function resolveStrengthTemplate(goal) {
    if (goal === "balanced") {
        return "balanced";
    }
    if (goal === "mobility") {
        return "mobility";
    }
    return "strength";
}
function scoreReadiness(readiness) {
    if (!readiness) {
        return 0;
    }
    const sleepAdj = (readiness.sleepHours ?? 7) >= 7 ? 1 : -1;
    const energyAdj = (readiness.energy ?? 3) >= 3 ? 1 : -1;
    const sorenessAdj = (readiness.soreness ?? 2) <= 2 ? 1 : -1;
    const stressAdj = (readiness.stress ?? 2) <= 2 ? 1 : -1;
    return sleepAdj + energyAdj + sorenessAdj + stressAdj;
}
export function resolveAdaptiveStrengthTargetCount(readiness, fatigueScore = 0) {
    const readinessScore = scoreReadiness(readiness);
    if (readinessScore >= 2 && fatigueScore <= 4) {
        return 6;
    }
    if (readinessScore < 0 || fatigueScore >= 7) {
        return 4;
    }
    return 5;
}
function getSlotTemplate(emphasis, targetCount) {
    if (emphasis === "lower") {
        const slots = [
            {
                key: "squat",
                patterns: ["squat"],
                required: true,
                extraFilter: (exercise) => exercise.category === "compound" &&
                    !exercise.id.includes("leg-extension") &&
                    !exercise.name.toLowerCase().includes("extension")
            },
            { key: "hinge", patterns: ["hinge"], required: true },
            { key: "core_or_carry", patterns: ["core", "carry"] },
            { key: "stability", patterns: ["balance", "mobility", "warmup"] }
        ];
        if (targetCount >= 5) {
            slots.splice(2, 0, { key: "unilateral", patterns: ["lunge"], required: true });
        }
        return {
            slots,
            fallbackPatterns: ["squat", "hinge", "lunge", "core", "carry", "balance", "mobility", "warmup"]
        };
    }
    if (emphasis === "push") {
        return {
            slots: [
                { key: "push_primary", patterns: ["push", "overhead_push"], required: true },
                { key: "push_secondary", patterns: ["push", "overhead_push"], required: true },
                { key: "push_accessory", patterns: ["push", "overhead_push"] },
                { key: "pull_shoulder_health", patterns: ["pull", "overhead_pull"] },
                { key: "core_or_mobility", patterns: ["core", "carry", "mobility", "warmup", "balance"] }
            ],
            fallbackPatterns: ["push", "overhead_push", "pull", "overhead_pull", "core", "carry", "mobility", "warmup", "balance"]
        };
    }
    return {
        slots: [
            { key: "pull_primary", patterns: ["pull", "overhead_pull"], required: true },
            { key: "pull_secondary", patterns: ["pull", "overhead_pull"], required: true },
            { key: "pull_accessory", patterns: ["pull", "overhead_pull"] },
            { key: "push_joint_balance", patterns: ["push", "overhead_push"] },
            { key: "core_or_mobility", patterns: ["core", "carry", "mobility", "warmup", "balance"] }
        ],
        fallbackPatterns: ["pull", "overhead_pull", "push", "overhead_push", "core", "carry", "mobility", "warmup", "balance"]
    };
}
function pickExercisesBySlots(exercisePool, seedKey, slots, fallbackPatterns, targetCount) {
    const selected = [];
    const selectedIds = new Set();
    const notes = [];
    const activeSlots = slots.slice(0, Math.min(targetCount, slots.length));
    activeSlots.forEach((slot) => {
        const candidates = exercisePool.filter((exercise) => !selectedIds.has(exercise.id) &&
            slot.patterns.includes(exercise.movementPattern) &&
            (slot.extraFilter ? slot.extraFilter(exercise) : true));
        const chosen = deterministicOrder(candidates, `${seedKey}:${slot.key}`)[0];
        if (!chosen) {
            if (slot.required) {
                notes.push(`Missing required slot: ${slot.key}`);
            }
            return;
        }
        selected.push(chosen);
        selectedIds.add(chosen.id);
    });
    if (selected.length < targetCount) {
        const fallbackPatternSet = new Set(fallbackPatterns);
        const fallbackCandidates = exercisePool.filter((exercise) => !selectedIds.has(exercise.id) && fallbackPatternSet.has(exercise.movementPattern));
        const fallbackOrdered = deterministicOrder(fallbackCandidates, `${seedKey}:fallback`);
        for (const exercise of fallbackOrdered) {
            if (selected.length >= targetCount) {
                break;
            }
            selected.push(exercise);
            selectedIds.add(exercise.id);
        }
    }
    return { selected, notes };
}
export function buildBalancedTemplateExercisePoolV3(exercisePool, emphasis, targetCount, seedKey) {
    const template = getSlotTemplate(emphasis, targetCount);
    return pickExercisesBySlots(exercisePool, `${seedKey}:${emphasis}:${targetCount}`, template.slots, template.fallbackPatterns, targetCount);
}
function getStrengthExercisePoolByEmphasis(exercisePool, emphasis, seedKey = "weekly:strength") {
    let filtered;
    if (emphasis === "lower") {
        filtered = exercisePool.filter((exercise) => LOWER_PATTERNS.has(exercise.movementPattern) || CORE_CARRY_PATTERNS.has(exercise.movementPattern));
    }
    else if (emphasis === "push") {
        filtered = exercisePool.filter((exercise) => PUSH_PATTERNS.has(exercise.movementPattern) || exercise.movementPattern === "core");
    }
    else if (emphasis === "pull") {
        const pullOnly = exercisePool.filter((exercise) => PULL_PATTERNS.has(exercise.movementPattern));
        filtered =
            pullOnly.length < 5
                ? exercisePool.filter((exercise) => PULL_PATTERNS.has(exercise.movementPattern) || exercise.movementPattern === "core")
                : pullOnly;
    }
    else {
        filtered = exercisePool.filter((exercise) => FULL_BODY_LIGHT_PATTERNS.has(exercise.movementPattern));
    }
    return filtered.length > 0 ? deterministicOrder(filtered, `${seedKey}:filtered`) : deterministicOrder(exercisePool, `${seedKey}:global`);
}
function applyFullBodyLightAdjustments(session) {
    return {
        ...session,
        exercises: session.exercises.map((exercise) => ({
            ...exercise,
            intensity: Math.max(6, exercise.intensity - 1)
        }))
    };
}
function reorderSessionExercisesByPoolOrder(session, orderedPool) {
    const orderById = new Map(orderedPool.map((exercise, index) => [exercise.id, index]));
    return {
        ...session,
        exercises: [...session.exercises].sort((a, b) => {
            const aIndex = orderById.get(a.exerciseId) ?? Number.MAX_SAFE_INTEGER;
            const bIndex = orderById.get(b.exerciseId) ?? Number.MAX_SAFE_INTEGER;
            return aIndex - bIndex;
        })
    };
}
function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
}
function deterministicOrder(exercises, seedKey) {
    return [...exercises].sort((a, b) => {
        const aScore = hashString(`${seedKey}:${a.id}`);
        const bScore = hashString(`${seedKey}:${b.id}`);
        return aScore - bScore || a.name.localeCompare(b.name);
    });
}
function isTimeLikeExercise(exercise) {
    const token = `${exercise.name} ${exercise.id} ${exercise.movementPattern}`.toLowerCase();
    return ["walk", "bike", "row", "elliptical", "swim", "breath", "breathing", "carry", "hold", "stretch"].some((keyword) => token.includes(keyword));
}
function isMobilityLikeStrengthSlot(exercise) {
    return exercise.category === "mobility" || STABILITY_PATTERNS.has(exercise.movementPattern);
}
function buildBalancedStrengthSessionFromSlots(selected, exercisePool, targetCount, goal, progression, seedKey, notes = []) {
    const dedupedSelected = [];
    const selectedIds = new Set();
    selected.forEach((exercise) => {
        if (!selectedIds.has(exercise.id)) {
            dedupedSelected.push(exercise);
            selectedIds.add(exercise.id);
        }
    });
    if (dedupedSelected.length < targetCount) {
        const orderedFallback = deterministicOrder(exercisePool, `${seedKey}:balanced-direct-fill`);
        orderedFallback.forEach((exercise) => {
            if (dedupedSelected.length >= targetCount || selectedIds.has(exercise.id)) {
                return;
            }
            dedupedSelected.push(exercise);
            selectedIds.add(exercise.id);
        });
    }
    if (dedupedSelected.length < targetCount && dedupedSelected.length > 0) {
        const orderedRepeats = deterministicOrder(dedupedSelected, `${seedKey}:balanced-direct-repeat`);
        let cursor = 0;
        while (dedupedSelected.length < targetCount) {
            dedupedSelected.push(orderedRepeats[cursor % orderedRepeats.length]);
            cursor += 1;
        }
    }
    const strengthIntensity = clamp(7 + Math.floor(progression.strengthLevel / 3) - (progression.fatigueScore >= 7 ? 1 : 0), 6, 9);
    const baseSets = clamp(3 + Math.floor((progression.volumeLevel + progression.strengthLevel) / 6), 2, 5);
    const exercises = dedupedSelected.slice(0, targetCount).map((exercise, index) => {
        const mobilityLike = isMobilityLikeStrengthSlot(exercise);
        return {
            exerciseId: exercise.id,
            name: exercise.name,
            sets: index === 0 ? baseSets : Math.max(2, baseSets - 1),
            reps: mobilityLike ? (isTimeLikeExercise(exercise) ? 30 : 12) : goal === "strength" ? 6 : 8,
            intensity: mobilityLike ? 6 : strengthIntensity
        };
    });
    return {
        exercises,
        engineVersion: NON_STRENGTH_ENGINE_VERSION,
        notes
    };
}
function buildMobilitySession(date, baseSeed, exercisePool) {
    const mobilityPool = exercisePool.filter((exercise) => exercise.category === "mobility" || ["mobility", "warmup"].includes(exercise.movementPattern));
    const selected = deterministicOrder(mobilityPool, `mobility:${baseSeed}:${date}`).slice(0, 5);
    return {
        exercises: selected.map((exercise) => {
            const tokenSeed = hashString(`${date}:${exercise.id}:mobility`);
            return {
                exerciseId: exercise.id,
                name: exercise.name,
                sets: 2 + (tokenSeed % 2),
                reps: isTimeLikeExercise(exercise) ? 30 : 10 + (tokenSeed % 3),
                intensity: 6
            };
        }),
        engineVersion: NON_STRENGTH_ENGINE_VERSION
    };
}
function getConditioningModality(exercise) {
    const token = `${exercise.name} ${exercise.id}`.toLowerCase();
    if (token.includes("bike") || token.includes("cycle") || token.includes("spin")) {
        return "bike";
    }
    if (token.includes("row")) {
        return "row";
    }
    if (token.includes("elliptical")) {
        return "elliptical";
    }
    if (token.includes("swim")) {
        return "swim";
    }
    if (token.includes("incline") || token.includes("walk") || token.includes("hike")) {
        return "walk";
    }
    return "other";
}
function buildZone2Session(date, minutes, baseSeed, exercisePool) {
    const conditioning = exercisePool.filter((exercise) => exercise.category === "conditioning");
    const ordered = deterministicOrder(conditioning, `zone2:${baseSeed}:${date}`);
    const modalities = Array.from(new Set(ordered.map(getConditioningModality)));
    const primaryModality = modalities.length > 0 ? modalities[hashString(`${date}:${baseSeed}:modality`) % modalities.length] : undefined;
    const primaryPool = primaryModality !== undefined ? ordered.filter((exercise) => getConditioningModality(exercise) === primaryModality) : [];
    const selected = (primaryPool.length > 0 ? primaryPool : ordered).slice(0, 2);
    return {
        exercises: selected.map((exercise) => ({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 1,
            reps: minutes,
            intensity: 6
        })),
        engineVersion: NON_STRENGTH_ENGINE_VERSION,
        notes: ["Zone 2 conversational pace."]
    };
}
function buildRecoverySession(date, minutes, baseSeed, exercisePool) {
    const selectedIds = new Set();
    const addSelected = (exercise, selected) => {
        if (!exercise || selectedIds.has(exercise.id)) {
            return;
        }
        selectedIds.add(exercise.id);
        selected.push({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 1,
            reps: minutes,
            intensity: 5
        });
    };
    const preferredConditioningKeywords = ["walk", "bike steady", "incline walk", "row steady", "swim steady"];
    const conditioningPool = exercisePool.filter((exercise) => exercise.category === "conditioning" && exercise.difficulty <= 2);
    const orderedConditioning = deterministicOrder(conditioningPool, `recovery:conditioning:${baseSeed}:${date}`);
    const preferredConditioning = orderedConditioning.filter((exercise) => {
        const token = exercise.name.toLowerCase();
        return preferredConditioningKeywords.some((keyword) => token.includes(keyword));
    });
    const breathingPool = exercisePool.filter((exercise) => {
        const token = `${exercise.name} ${exercise.id}`.toLowerCase();
        return (exercise.difficulty <= 2 &&
            (token.includes("breathing") || exercise.id.toLowerCase().includes("breathing") || exercise.movementPattern === "core"));
    });
    const orderedBreathing = deterministicOrder(breathingPool, `recovery:breathing:${baseSeed}:${date}`);
    const mobilityPool = exercisePool.filter((exercise) => exercise.category === "mobility" && exercise.difficulty <= 2);
    const orderedMobility = deterministicOrder(mobilityPool, `recovery:mobility:${baseSeed}:${date}`);
    const exercises = [];
    const conditioningSelection = preferredConditioning[0] ?? orderedConditioning[0];
    if (!conditioningSelection) {
        throw new Error("Recovery day requires at least one conditioning exercise with difficulty <= 2");
    }
    addSelected(conditioningSelection, exercises);
    const breathingSelection = orderedBreathing.find((exercise) => !selectedIds.has(exercise.id));
    if (!breathingSelection) {
        throw new Error("Recovery day requires at least one breathing/core control exercise with difficulty <= 2");
    }
    const tokenSeed = hashString(`${date}:${breathingSelection.id}:recovery:breathing`);
    selectedIds.add(breathingSelection.id);
    exercises.push({
        exerciseId: breathingSelection.id,
        name: breathingSelection.name,
        sets: 2,
        reps: tokenSeed % 2 === 0 ? 60 : 8 + (tokenSeed % 5),
        intensity: 5
    });
    const mobilityTarget = 1 + (hashString(`${date}:${baseSeed}:recovery:mobility-count`) % 2);
    orderedMobility.forEach((exercise) => {
        if (exercises.length >= 2 + mobilityTarget || selectedIds.has(exercise.id)) {
            return;
        }
        const tokenSeed = hashString(`${date}:${exercise.id}:recovery:mobility`);
        selectedIds.add(exercise.id);
        exercises.push({
            exerciseId: exercise.id,
            name: exercise.name,
            sets: 2 + (tokenSeed % 2),
            reps: isTimeLikeExercise(exercise) ? 30 : 10 + (tokenSeed % 21),
            intensity: 5 + (tokenSeed % 2)
        });
    });
    if (exercises.length < 3) {
        throw new Error("Recovery day requires at least one mobility drill with difficulty <= 2");
    }
    return {
        exercises,
        engineVersion: NON_STRENGTH_ENGINE_VERSION,
        notes: ["Light effort only. Move easy and focus on breathing."]
    };
}
function buildActiveDay(date, dayIndex, baseSeed, exercisePool, progression, readinessTrend) {
    const fatiguePenalty = progression.fatigueScore >= 7 || (readinessTrend?.avgSoreness ?? 0) >= 4 || (readinessTrend?.avgStress ?? 0) >= 4;
    const lowEnergy = (readinessTrend?.avgEnergy ?? 3) <= 2;
    const rotation = fatiguePenalty
        ? ["mobility", "recovery", "zone2"]
        : ["zone2", "mobility", "recovery"];
    const dayType = rotation[Math.abs(baseSeed + dayIndex) % rotation.length];
    if (dayType === "zone2") {
        const minutes = clamp(30 + progression.volumeLevel * 3 - (fatiguePenalty ? 8 : 0), 20, 60);
        const notes = fatiguePenalty ? "Keep effort conversational (nasal-breathing pace)." : undefined;
        return {
            date,
            type: "zone2",
            minutes,
            session: buildZone2Session(date, minutes, baseSeed, exercisePool),
            ...(notes ? { notes } : {})
        };
    }
    if (dayType === "mobility") {
        const minutes = clamp(18 + Math.floor((progression.volumeLevel + progression.strengthLevel) / 2), 15, 35);
        const notes = lowEnergy ? "Focus on hips, t-spine, and controlled breathing." : undefined;
        return {
            date,
            type: "mobility",
            minutes,
            session: buildMobilitySession(date, baseSeed, exercisePool),
            ...(notes ? { notes } : {})
        };
    }
    const minutes = clamp(20 - (fatiguePenalty ? 0 : 4), 12, 24);
    return {
        date,
        type: "recovery",
        minutes,
        notes: "Easy walk and light stretching.",
        session: buildRecoverySession(date, minutes, baseSeed, exercisePool)
    };
}
export function generateWeeklyPlan(input) {
    const weekStart = parseIsoDate(input.weekStart);
    const baseSeed = input.seed ?? Number(input.weekStart.replaceAll("-", ""));
    const strengthTemplate = resolveStrengthTemplate(input.goal);
    const dates = Array.from({ length: 7 }, (_, index) => formatIsoDate(addDays(weekStart, index)));
    const strengthSlots = new Set(getStrengthSlots(input.strengthDays));
    const emphasisOrder = strengthTemplate === "balanced" ? getBalancedEmphasisOrder(baseSeed) : getEmphasisOrder(baseSeed);
    const baseReadiness = input.readinessTrend
        ? {
            ...(typeof input.readinessTrend.avgSleep === "number" ? { sleepHours: input.readinessTrend.avgSleep } : {}),
            ...(typeof input.readinessTrend.avgEnergy === "number" ? { energy: input.readinessTrend.avgEnergy } : {}),
            ...(typeof input.readinessTrend.avgSoreness === "number" ? { soreness: input.readinessTrend.avgSoreness } : {}),
            ...(typeof input.readinessTrend.avgStress === "number" ? { stress: input.readinessTrend.avgStress } : {})
        }
        : undefined;
    let strengthIndex = 0;
    const days = dates.map((date, dayIndex) => {
        if (!strengthSlots.has(dayIndex)) {
            return buildActiveDay(date, dayIndex, baseSeed, input.exercisePool, input.progression, input.readinessTrend);
        }
        const emphasis = emphasisOrder[strengthIndex % emphasisOrder.length] ?? "full_body_light";
        const targetCount = strengthTemplate === "balanced" ? resolveAdaptiveStrengthTargetCount(baseReadiness, input.progression.fatigueScore) : 5;
        if (strengthTemplate === "balanced" && emphasis !== "full_body_light") {
            const selected = buildBalancedTemplateExercisePoolV3(input.exercisePool, emphasis, targetCount, `${baseSeed}:${date}:${emphasis}`);
            const session = buildBalancedStrengthSessionFromSlots(selected.selected, input.exercisePool, targetCount, input.goal, input.progression, `${baseSeed}:${date}:${emphasis}`, selected.notes);
            strengthIndex += 1;
            return {
                date,
                type: "strength",
                emphasis,
                session
            };
        }
        let selectionNotes = [];
        let shouldReorderBySlotOrder = false;
        const sessionPool = emphasis === "full_body_light"
            ? getStrengthExercisePoolByEmphasis(input.exercisePool, emphasis, `${baseSeed}:${date}:${emphasis}`)
            : (() => {
                const selected = buildBalancedTemplateExercisePoolV3(input.exercisePool, emphasis, targetCount, `${baseSeed}:${date}:${emphasis}`);
                selectionNotes = selected.notes;
                shouldReorderBySlotOrder = true;
                return selected.selected;
            })();
        const generatedSession = generateSession({
            date,
            goal: input.goal,
            progression: input.progression,
            ...(baseReadiness ? { readiness: baseReadiness } : {}),
            exercisePool: sessionPool,
            seed: baseSeed + dayIndex * 17
        });
        const sessionWithSlotOrder = shouldReorderBySlotOrder
            ? reorderSessionExercisesByPoolOrder(generatedSession, sessionPool)
            : generatedSession;
        const sessionWithEmphasisAdjustments = emphasis === "full_body_light" ? applyFullBodyLightAdjustments(sessionWithSlotOrder) : sessionWithSlotOrder;
        const session = selectionNotes.length > 0
            ? {
                ...sessionWithEmphasisAdjustments,
                notes: [...sessionWithEmphasisAdjustments.notes, ...selectionNotes]
            }
            : sessionWithEmphasisAdjustments;
        strengthIndex += 1;
        return {
            date,
            type: "strength",
            emphasis,
            session
        };
    });
    return {
        days,
        engineVersion: WEEKLY_ENGINE_VERSION
    };
}
//# sourceMappingURL=generateWeeklyPlan.js.map