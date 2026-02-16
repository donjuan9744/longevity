const DAY_COMPLETE_KEY_PREFIX = 'longevity:dayComplete:';

function dayCompleteKey(date: string): string {
  return `${DAY_COMPLETE_KEY_PREFIX}${date}`;
}

export function isDayComplete(date: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(dayCompleteKey(date)) === 'true';
}

export function setDayComplete(date: string, value: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(dayCompleteKey(date), String(value));
}
