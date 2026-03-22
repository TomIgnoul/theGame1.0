const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const gemsApi = {
  list: (theme?: string) =>
    api<{ items: import('../types').GemPin[] }>(
      theme ? `/api/gems?theme=${encodeURIComponent(theme)}` : '/api/gems'
    ),
  get: (id: string) =>
    api<import('../types').Gem>(`/api/gems/${id}`),
  story: (id: string, theme: string, language = 'en') =>
    api<import('../types').StoryResponse>(
      `/api/gems/${id}/story`,
      {
        method: 'POST',
        body: JSON.stringify({ theme, language }),
      }
    ),
};

export const routesApi = {
  generate: (config: {
    theme: string;
    kmTarget: number;
    shape: 'loop' | 'a_to_b';
    start: { lat: number; lng: number };
    end?: { lat: number; lng: number } | null;
  }) =>
    api<import('../types').RouteResultState>('/api/routes', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
};

export const chatApi = {
  send: (payload: import('../features/chat/types').ChatRequest) =>
    api<import('../features/chat/types').ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
