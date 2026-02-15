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
function createDeterministicOrder(exercises, seed) {
    return [...exercises].sort((a, b) => {
        const aScore = a.id.charCodeAt(0) + seed;
        const bScore = b.id.charCodeAt(0) + seed;
        return aScore - bScore || a.name.localeCompare(b.name);
    });
}
export function generateSession(input) {
    const readinessScore = scoreReadiness(input.readiness);
    const progressionBias = input.progression.volumeLevel + input.progression.strengthLevel;
    const seed = input.seed ?? Number(input.date.replaceAll("-", ""));
    const ordered = createDeterministicOrder(input.exercisePool, seed);
    const selected = ordered.slice(0, Math.min(5, ordered.length));
    const baseSets = Math.max(2, Math.min(5, 3 + Math.floor(progressionBias / 4) + (readinessScore >= 2 ? 1 : 0)));
    const baseReps = input.goal === "strength" ? 6 : input.goal === "mobility" ? 10 : 8;
    const exercises = selected.map((exercise, index) => {
        const intensity = Math.max(6, Math.min(9, 7 + Math.floor(input.progression.strengthLevel / 3) - (readinessScore < 0 ? 1 : 0)));
        return {
            exerciseId: exercise.id,
            name: exercise.name,
            sets: index === 0 ? baseSets : Math.max(2, baseSets - 1),
            reps: exercise.category === "mobility" ? 12 : baseReps,
            intensity
        };
    });
    const notes = [];
    if (readinessScore < 0) {
        notes.push("Reduced intensity due to readiness.");
    }
    if (input.progression.fatigueScore > 6) {
        notes.push("Monitor fatigue and consider deload if trend continues.");
    }
    return {
        exercises,
        engineVersion: "v1",
        notes
    };
}
//# sourceMappingURL=generateSession.js.map