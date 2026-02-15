function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
export function updateProgression(input) {
    if (input.results.length === 0) {
        return input.previous;
    }
    const completionRate = input.results.reduce((acc, result) => acc + result.completedSets / Math.max(1, result.plannedSets), 0) /
        input.results.length;
    const averageRpe = input.results.reduce((acc, result) => acc + result.rpe, 0) / input.results.length;
    const strengthDelta = completionRate >= 1 && averageRpe <= 8 ? 1 : completionRate < 0.85 ? -1 : 0;
    const volumeDelta = completionRate >= 0.95 ? 1 : completionRate < 0.8 ? -1 : 0;
    const fatigueDelta = averageRpe >= 8.5 ? 2 : averageRpe <= 7 ? -1 : 1;
    return {
        strengthLevel: clamp(input.previous.strengthLevel + strengthDelta, 1, 10),
        volumeLevel: clamp(input.previous.volumeLevel + volumeDelta, 1, 10),
        fatigueScore: clamp(input.previous.fatigueScore + fatigueDelta, 0, 10),
        deloadCount: input.previous.deloadCount
    };
}
//# sourceMappingURL=progression.js.map