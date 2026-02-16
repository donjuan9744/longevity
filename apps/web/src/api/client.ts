const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
const API_TOKEN = import.meta.env.VITE_API_TOKEN;

function normalizeUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const cleanBase = API_BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function hasRequestBody(init?: RequestInit): boolean {
  if (!init) {
    return false;
  }

  return typeof init.body !== 'undefined' && init.body !== null;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (API_TOKEN) {
    headers.set('Authorization', `Bearer ${API_TOKEN}`);
  }

  if (hasRequestBody(init) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(normalizeUrl(path), {
    ...init,
    headers
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : null) ??
      (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : null) ??
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
}
