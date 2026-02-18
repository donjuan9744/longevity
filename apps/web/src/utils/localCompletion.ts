export type CompletionKeyInput = {
  scope: string;
  weekStart: string;
  date: string;
  type: 'zone2' | 'mobility' | 'recovery' | 'strength';
  sessionId?: string | null;
};

const LOCAL_COMPLETION_STORAGE_KEY = 'longevity:localCompletion:v1';

export function toCompletionKey(input: CompletionKeyInput): string {
  if (typeof input.sessionId === 'string' && input.sessionId.length > 0) {
    return `sid:${input.scope}:${input.sessionId}`;
  }

  return `day:${input.scope}:${input.weekStart}:${input.date}`;
}

export function loadCompletionMap(): Record<string, true> {
  if (typeof window === 'undefined') {
    return {};
  }

  const raw = window.localStorage.getItem(LOCAL_COMPLETION_STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    const entries = Object.entries(parsed as Record<string, unknown>).filter(([, value]) => value === true);
    return Object.fromEntries(entries) as Record<string, true>;
  } catch {
    return {};
  }
}

function saveCompletionMap(map: Record<string, true>): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCAL_COMPLETION_STORAGE_KEY, JSON.stringify(map));
}

export function isLocallyCompleted(input: CompletionKeyInput): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const map = loadCompletionMap();
  const newKey = toCompletionKey(input);
  if (map[newKey] === true) {
    return true;
  }

  if (!(typeof input.sessionId === 'string' && input.sessionId.length > 0)) {
    const legacyKey = `day:${input.weekStart}:${input.date}:${input.type}`;
    if (map[legacyKey] === true) {
      return true;
    }
  }

  return false;
}

export function markLocallyCompleted(input: CompletionKeyInput): void {
  if (typeof window === 'undefined') {
    return;
  }

  const key = toCompletionKey(input);
  const map = loadCompletionMap();
  map[key] = true;
  saveCompletionMap(map);
}

export function clearLocalCompletionForSessionId(sessionId: string): void {
  if (typeof window === 'undefined' || !sessionId) {
    return;
  }

  const keySuffix = `:${sessionId}`;
  const map = loadCompletionMap();
  let changed = false;

  Object.keys(map).forEach((key) => {
    if (key.endsWith(keySuffix)) {
      delete map[key];
      changed = true;
    }
  });

  if (changed) {
    saveCompletionMap(map);
  }
}
