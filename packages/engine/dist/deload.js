export function evaluateDeload(input) {
    const highFatigue = input.fatigueScore >= 8;
    const highEffort = input.averageRpe >= 9;
    const lowCompletion = input.completionRate < 0.8;
    if ((highFatigue && highEffort) || (highFatigue && lowCompletion)) {
        return {
            shouldDeload: true,
            reason: "High fatigue with poor recovery markers"
        };
    }
    return {
        shouldDeload: false,
        reason: "Progression can continue"
    };
}
//# sourceMappingURL=deload.js.map