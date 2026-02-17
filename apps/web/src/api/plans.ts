import { apiFetch } from './client';
import type { WeekResponse } from '../types/api';

type GetWeekOptions = {
  weekStart: string;
  strengthDays?: 2 | 3 | 4 | 5;
  demoClientId?: string;
};

async function getWeekWithWeekStart(options: GetWeekOptions): Promise<WeekResponse> {
  const params = new URLSearchParams({ weekStart: options.weekStart });
  if (typeof options.strengthDays === 'number') {
    params.set('strengthDays', String(options.strengthDays));
  }
  if (options.demoClientId) {
    params.set('demoClientId', options.demoClientId);
  }
  return apiFetch<WeekResponse>(`/plans/week?${params.toString()}`);
}

async function getWeekWithStart(options: GetWeekOptions): Promise<WeekResponse> {
  const params = new URLSearchParams({ start: options.weekStart });
  if (typeof options.strengthDays === 'number') {
    params.set('strengthDays', String(options.strengthDays));
  }
  if (options.demoClientId) {
    params.set('demoClientId', options.demoClientId);
  }
  return apiFetch<WeekResponse>(`/plans/week?${params.toString()}`);
}

export async function getWeek(
  weekStart: string,
  strengthDays?: 2 | 3 | 4 | 5,
  demoClientId?: string
): Promise<WeekResponse> {
  const options: GetWeekOptions = {
    weekStart,
    ...(typeof strengthDays === 'number' ? { strengthDays } : {}),
    ...(demoClientId ? { demoClientId } : {})
  };
  try {
    return await getWeekWithWeekStart(options);
  } catch {
    return getWeekWithStart(options);
  }
}

export async function refreshWeek(
  weekStart: string,
  strengthDays?: 2 | 3 | 4 | 5,
  demoClientId?: string
): Promise<WeekResponse> {
  const params = new URLSearchParams({ weekStart });
  if (demoClientId) {
    params.set('demoClientId', demoClientId);
  }
  await apiFetch<unknown>(`/plans/week/refresh?${params.toString()}`, { method: 'POST' });

  return getWeek(weekStart, strengthDays, demoClientId);
}
