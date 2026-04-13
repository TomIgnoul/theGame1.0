import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminApi, ApiError } from '../api/client';
import { AdminPage } from './AdminPage';

describe('AdminPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders KPI cards and charts from mock API data', async () => {
    mockAuthorizedDashboardData();

    renderAdminPage();

    const kpiRegion = await screen.findByRole('region', {
      name: 'Analytics KPIs',
    });

    expect(within(kpiRegion).getByText('Route generations')).toBeTruthy();
    expect(within(kpiRegion).getByText('12')).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: 'Route generations vs starts',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: 'Theme breakdown',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        name: 'POI breakdown',
      }),
    ).toBeTruthy();
  });

  it('shows the login screen when the admin session is unauthorized', async () => {
    const unauthorized = new ApiError(
      'Admin authentication required',
      401,
      'admin_auth_required',
    );

    vi.spyOn(adminApi, 'overview').mockRejectedValue(unauthorized);
    vi.spyOn(adminApi, 'timeseries').mockRejectedValue(unauthorized);
    vi.spyOn(adminApi, 'breakdowns').mockRejectedValue(unauthorized);

    renderAdminPage();

    expect(
      await screen.findByRole('heading', {
        name: 'Analytics access',
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'Open dashboard',
      }),
    ).toBeTruthy();
  });

  it('renders a clean empty state for a dataset without analytics rows', async () => {
    vi.spyOn(adminApi, 'overview').mockResolvedValue({
      filters: {
        from: '2026-04-01',
        to: '2026-04-07',
        theme: null,
      },
      hasData: false,
      kpis: {
        routeGenerations: 0,
        routeStarts: 0,
        routeFailures: 0,
        poiDetailViews: 0,
        chatSends: 0,
      },
    });
    vi.spyOn(adminApi, 'timeseries').mockResolvedValue({
      filters: {
        from: '2026-04-01',
        to: '2026-04-07',
        theme: null,
      },
      hasData: false,
      buckets: [
        {
          date: '2026-04-01',
          routeGenerations: 0,
          routeStarts: 0,
        },
        {
          date: '2026-04-02',
          routeGenerations: 0,
          routeStarts: 0,
        },
      ],
    });
    vi.spyOn(adminApi, 'breakdowns').mockResolvedValue({
      filters: {
        from: '2026-04-01',
        to: '2026-04-07',
        theme: null,
      },
      hasData: false,
      themeBreakdown: [],
      poiBreakdown: [],
    });

    renderAdminPage();

    expect(
      await screen.findByRole('heading', {
        name: 'No analytics found for this range',
      }),
    ).toBeTruthy();
    expect(screen.getAllByText('All themes').length).toBeGreaterThan(0);
  });

  it('renders an admin error state and retries analytics queries', async () => {
    const analyticsError = new ApiError(
      'Overview query failed for the selected range.',
      503,
      'analytics_unavailable',
    );

    const overviewMock = vi
      .spyOn(adminApi, 'overview')
      .mockRejectedValue(analyticsError);
    const timeseriesMock = vi
      .spyOn(adminApi, 'timeseries')
      .mockRejectedValue(analyticsError);
    const breakdownsMock = vi
      .spyOn(adminApi, 'breakdowns')
      .mockRejectedValue(analyticsError);

    renderAdminPage();

    expect(
      await screen.findByRole('heading', {
        name: 'Analytics are unavailable right now',
      }),
    ).toBeTruthy();
    expect(
      screen.getByText('Overview query failed for the selected range.'),
    ).toBeTruthy();

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', {
        name: 'Retry analytics',
      }),
    );

    await waitFor(() => {
      expect(overviewMock.mock.calls.length).toBeGreaterThan(1);
      expect(timeseriesMock.mock.calls.length).toBeGreaterThan(1);
      expect(breakdownsMock.mock.calls.length).toBeGreaterThan(1);
    });
  });

  it('refreshes analytics queries when the date filter is applied', async () => {
    const overviewMock = vi
      .spyOn(adminApi, 'overview')
      .mockImplementation(async (filters) => ({
        filters,
        hasData: true,
        kpis: {
          routeGenerations: filters.from === '2026-03-01' ? 20 : 12,
          routeStarts: 8,
          routeFailures: 2,
          poiDetailViews: 15,
          chatSends: 6,
        },
      }));

    vi.spyOn(adminApi, 'timeseries').mockImplementation(async (filters) => ({
      filters,
      hasData: true,
      buckets: [
        {
          date: filters.from,
          routeGenerations: 4,
          routeStarts: 2,
        },
      ],
    }));

    vi.spyOn(adminApi, 'breakdowns').mockImplementation(async (filters) => ({
      filters,
      hasData: true,
      themeBreakdown: [
        {
          theme: 'Culture',
          totalEvents: 14,
          routeGenerations: 5,
          routeStarts: 4,
          routeFailures: 1,
          filterApplies: 2,
          poiDetailViews: 1,
          storyGenerations: 0,
          chatOpens: 0,
          chatSends: 1,
        },
      ],
      poiBreakdown: [
        {
          poiId: '11111111-1111-4111-8111-111111111111',
          title: 'Grand Place',
          theme: 'Culture',
          totalEvents: 9,
          poiDetailViews: 3,
          storyGenerations: 2,
          chatOpens: 2,
          chatSends: 2,
        },
      ],
    }));

    renderAdminPage();

    const user = userEvent.setup();

    expect(
      await screen.findByRole('heading', {
        name: 'Route generations vs starts',
      }),
    ).toBeTruthy();

    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-03-01' },
    });
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-03-05' },
    });

    await user.click(
      screen.getByRole('button', {
        name: 'Apply filters',
      }),
    );

    await waitFor(() => {
      expect(overviewMock).toHaveBeenCalledWith({
        from: '2026-03-01',
        to: '2026-03-05',
        theme: null,
      });
    });

    expect(await screen.findByText('20')).toBeTruthy();
  });

  it('submits the admin passphrase and opens the dashboard after login succeeds', async () => {
    const unauthorized = new ApiError(
      'Admin authentication required',
      401,
      'admin_auth_required',
    );

    vi.spyOn(adminApi, 'overview')
      .mockRejectedValueOnce(unauthorized)
      .mockResolvedValue({
        filters: {
          from: '2026-04-01',
          to: '2026-04-07',
          theme: null,
        },
        hasData: true,
        kpis: {
          routeGenerations: 12,
          routeStarts: 8,
          routeFailures: 2,
          poiDetailViews: 15,
          chatSends: 6,
        },
      });
    vi.spyOn(adminApi, 'timeseries')
      .mockRejectedValueOnce(unauthorized)
      .mockResolvedValue({
        filters: {
          from: '2026-04-01',
          to: '2026-04-07',
          theme: null,
        },
        hasData: true,
        buckets: [
          {
            date: '2026-04-01',
            routeGenerations: 4,
            routeStarts: 2,
          },
        ],
      });
    vi.spyOn(adminApi, 'breakdowns')
      .mockRejectedValueOnce(unauthorized)
      .mockResolvedValue({
        filters: {
          from: '2026-04-01',
          to: '2026-04-07',
          theme: null,
        },
        hasData: true,
        themeBreakdown: [
          {
            theme: 'Culture',
            totalEvents: 14,
            routeGenerations: 5,
            routeStarts: 4,
            routeFailures: 1,
            filterApplies: 2,
            poiDetailViews: 1,
            storyGenerations: 0,
            chatOpens: 0,
            chatSends: 1,
          },
        ],
        poiBreakdown: [
          {
            poiId: '11111111-1111-4111-8111-111111111111',
            title: 'Grand Place',
            theme: 'Culture',
            totalEvents: 9,
            poiDetailViews: 3,
            storyGenerations: 2,
            chatOpens: 2,
            chatSends: 2,
          },
        ],
      });
    const loginMock = vi
      .spyOn(adminApi, 'login')
      .mockResolvedValue({ ok: true });

    renderAdminPage();

    const user = userEvent.setup();

    expect(
      await screen.findByRole('heading', {
        name: 'Analytics access',
      }),
    ).toBeTruthy();

    await user.type(
      screen.getByLabelText('Admin passphrase'),
      'open-sesame',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Open dashboard',
      }),
    );

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('open-sesame');
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Admin analytics portal',
      }),
    ).toBeTruthy();
  });
});

function renderAdminPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AdminPage />
    </QueryClientProvider>,
  );

  return queryClient;
}

function mockAuthorizedDashboardData() {
  vi.spyOn(adminApi, 'overview').mockResolvedValue({
    filters: {
      from: '2026-04-01',
      to: '2026-04-07',
      theme: null,
    },
    hasData: true,
    kpis: {
      routeGenerations: 12,
      routeStarts: 8,
      routeFailures: 2,
      poiDetailViews: 15,
      chatSends: 6,
    },
  });

  vi.spyOn(adminApi, 'timeseries').mockResolvedValue({
    filters: {
      from: '2026-04-01',
      to: '2026-04-07',
      theme: null,
    },
    hasData: true,
    buckets: [
      {
        date: '2026-04-01',
        routeGenerations: 4,
        routeStarts: 2,
      },
      {
        date: '2026-04-02',
        routeGenerations: 8,
        routeStarts: 6,
      },
    ],
  });

  vi.spyOn(adminApi, 'breakdowns').mockResolvedValue({
    filters: {
      from: '2026-04-01',
      to: '2026-04-07',
      theme: null,
    },
    hasData: true,
    themeBreakdown: [
      {
        theme: 'Culture',
        totalEvents: 14,
        routeGenerations: 5,
        routeStarts: 4,
        routeFailures: 1,
        filterApplies: 2,
        poiDetailViews: 1,
        storyGenerations: 0,
        chatOpens: 0,
        chatSends: 1,
      },
    ],
    poiBreakdown: [
      {
        poiId: '11111111-1111-4111-8111-111111111111',
        title: 'Grand Place',
        theme: 'Culture',
        totalEvents: 9,
        poiDetailViews: 3,
        storyGenerations: 2,
        chatOpens: 2,
        chatSends: 2,
      },
    ],
  });
}
