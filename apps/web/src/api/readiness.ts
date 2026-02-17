import { apiFetch } from './client';

export type ReadinessInput = {
  date: string;
  sleepHours: number;
  energy: number;
  soreness: number;
  stress: number;
};

export async function upsertReadiness(input: ReadinessInput): Promise<void> {
  await apiFetch<{ status: string }>('/readiness', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}
