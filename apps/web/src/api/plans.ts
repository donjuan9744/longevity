import { apiFetch } from './client';
import type { WeekResponse } from '../types/api';

async function getWeekWithWeekStart(weekStart: string): Promise<WeekResponse> {
  const params = new URLSearchParams({ weekStart });
  return apiFetch<WeekResponse>(`/plans/week?${params.toString()}`);
}

async function getWeekWithStart(weekStart: string): Promise<WeekResponse> {
  const params = new URLSearchParams({ start: weekStart });
  return apiFetch<WeekResponse>(`/plans/week?${params.toString()}`);
}

export async function getWeek(weekStart: string): Promise<WeekResponse> {
  try {
    return await getWeekWithWeekStart(weekStart);
  } catch {
    return getWeekWithStart(weekStart);
  }
}

export async function refreshWeek(weekStart: string): Promise<WeekResponse> {
  await apiFetch<unknown>('/plans/week/refresh', {
    method: 'POST',
    body: JSON.stringify({ weekStart })
  });

  return getWeek(weekStart);
}
