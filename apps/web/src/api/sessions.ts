import { apiFetch } from './client';
import type { SessionExercise } from '../types/api';

function buildDemoClientQuery(demoClientId?: string): string {
  if (!demoClientId) {
    return '';
  }

  const params = new URLSearchParams({ demoClientId });
  return `?${params.toString()}`;
}

export async function cancelSession(sessionId: string, demoClientId?: string): Promise<void> {
  const query = buildDemoClientQuery(demoClientId);

  try {
    await apiFetch<{ status: string }>(`/sessions/${sessionId}/cancel${query}`, {
      method: 'PATCH'
    });
    return;
  } catch {
    await apiFetch<{ status: string }>(`/sessions/${sessionId}${query}`, {
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
  exercises: SessionResultInput[],
  demoClientId?: string
): Promise<void> {
  const params = new URLSearchParams();
  if (demoClientId) {
    params.set('demoClientId', demoClientId);
  }
  const query = params.toString();
  const endpoint = query ? `/sessions/${sessionId}/submit?${query}` : `/sessions/${sessionId}/submit`;

  await apiFetch<{ status: string }>(endpoint, {
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

export type SwapCandidate = {
  id: string;
  name: string;
};

export async function getSwapCandidates(
  sessionId: string,
  exerciseId: string,
  demoClientId?: string
): Promise<SwapCandidate[]> {
  const query = buildDemoClientQuery(demoClientId);
  const response = await apiFetch<{ candidates: SwapCandidate[] }>(`/sessions/${sessionId}/swap${query}`, {
    method: 'POST',
    body: JSON.stringify({ exerciseId })
  });

  return response.candidates;
}

export async function applyExerciseSwap(
  sessionId: string,
  fromExerciseId: string,
  toExerciseId: string,
  demoClientId?: string
): Promise<{ exercises: SessionExercise[] }> {
  const query = buildDemoClientQuery(demoClientId);
  const response = await apiFetch<{ status: string; exercises: SessionExercise[] }>(
    `/sessions/${sessionId}/swap/apply${query}`,
    {
      method: 'POST',
      body: JSON.stringify({ fromExerciseId, toExerciseId })
    }
  );

  return { exercises: response.exercises };
}
export { type SessionResultInput };
