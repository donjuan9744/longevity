function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
}
function scoreCandidate(exercise, context, slotName, seedKey, score) {
    const preference = score ? score(exercise, context) : 0;
    const deterministicTieBreaker = hashString(`${seedKey}:${slotName}:${exercise.id}`);
    return [preference, deterministicTieBreaker, exercise.name];
}
function pickForSlot(exercisePool, selectedIds, context, seedKey, slot) {
    const candidates = exercisePool.filter((exercise) => !selectedIds.has(exercise.id) && slot.filter(exercise, context));
    if (candidates.length === 0) {
        return undefined;
    }
    return [...candidates].sort((a, b) => {
        const [aScore, aDeterministic, aName] = scoreCandidate(a, context, slot.name, seedKey, slot.score);
        const [bScore, bDeterministic, bName] = scoreCandidate(b, context, slot.name, seedKey, slot.score);
        return bScore - aScore || aDeterministic - bDeterministic || aName.localeCompare(bName);
    })[0];
}
export function fillTemplateSlots(exercisePool, seed, slotDefinitions) {
    const seedKey = String(seed);
    const selected = [];
    const selectedIds = new Set();
    const missingRequiredSlots = [];
    slotDefinitions.forEach((slot, slotIndex) => {
        const context = {
            slotIndex,
            selected
        };
        const chosen = pickForSlot(exercisePool, selectedIds, context, seedKey, slot);
        if (!chosen) {
            if (!slot.optional) {
                missingRequiredSlots.push(slot.name);
            }
            return;
        }
        selectedIds.add(chosen.id);
        selected.push(chosen);
    });
    return {
        selected,
        missingRequiredSlots
    };
}
//# sourceMappingURL=templateSelect.js.map