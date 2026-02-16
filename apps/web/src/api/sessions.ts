import { apiFetch } from './client';

export async function cancelSession(sessionId: string): Promise<void> {
  try {
    await apiFetch<{ status: string }>(`/sessions/${sessionId}/cancel`, {
      method: 'PATCH'
    });
    return;
  } catch {
    await apiFetch<{ status: string }>(`/sessions/${sessionId}`, {
      method: 'DELETE'
    });
  }
}

type SessionResultInput = {
  exerciseId: string;
  sets: number;
  reps: number;
};

export async function completeSession(
  sessionId: string,
  exercises: SessionResultInput[]
): Promise<void> {
  await apiFetch<{ status: string }>(`/sessions/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      results: exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        plannedSets: exercise.sets,
        plannedReps: exercise.reps,
        completedSets: exercise.sets,
        completedReps: exercise.reps,
        rpe: 7
      }))
    })
  });
}
export { type SessionResultInput };
