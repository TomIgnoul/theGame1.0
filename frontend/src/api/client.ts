const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

type FrontendAnalyticsEventPayload =
  | {
      eventType: 'filter_applied';
      theme: string;
    }
  | {
      eventType: 'route_started';
      theme: string;
      metadata?: {
        shape?: 'loop' | 'a_to_b';
        kmTarget?: number;
        kmResult?: number;
        gemCount?: number;
      };
    }
  | {
      eventType: 'stop_chat_opened';
      poiId: string;
      theme?: string;
    };

type AdminAnalyticsFilters = import('../features/admin/types').AdminAnalyticsFilters;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

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
    const payload = err as { error?: string; code?: string };
    throw new ApiError(
      payload.error || res.statusText,
      res.status,
      payload.code,
    );
  }
  return res.json() as Promise<T>;
}

function buildAdminAnalyticsQuery(filters: AdminAnalyticsFilters) {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
  });

  if (filters.theme) {
    params.set('theme', filters.theme);
  }

  return params.toString();
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

export const analyticsApi = {
  capture: (payload: FrontendAnalyticsEventPayload) =>
    api<{ accepted: boolean }>('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminApi = {
  login: (passphrase: string) =>
    api<{ ok: boolean }>('/api/admin/auth/login', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ passphrase }),
    }),
  logout: () =>
    api<{ ok: boolean }>('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({}),
    }),
  overview: (filters: AdminAnalyticsFilters) =>
    api<import('../features/admin/types').AdminOverviewResponse>(
      `/api/admin/analytics/overview?${buildAdminAnalyticsQuery(filters)}`,
      {
        credentials: 'include',
      },
    ),
  timeseries: (filters: AdminAnalyticsFilters) =>
    api<import('../features/admin/types').AdminTimeseriesResponse>(
      `/api/admin/analytics/timeseries?${buildAdminAnalyticsQuery(filters)}`,
      {
        credentials: 'include',
      },
    ),
  breakdowns: (filters: AdminAnalyticsFilters) =>
    api<import('../features/admin/types').AdminBreakdownsResponse>(
      `/api/admin/analytics/breakdowns?${buildAdminAnalyticsQuery(filters)}`,
      {
        credentials: 'include',
      },
    ),
};
