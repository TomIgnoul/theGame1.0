import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp, type AppDependencies } from './app';
import type {
  AnalyticsBreakdownsResponse,
  AnalyticsOverviewResponse,
  AnalyticsTimeseriesResponse,
} from './modules/analytics/read.types';

const ADMIN_PASSPHRASE = 'open-sesame';

async function withTestServer(
  overrides: Partial<AppDependencies>,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createServer(createApp(overrides));

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

async function withAdminAuthEnv(run: () => Promise<void>) {
  const previousPassphrase = process.env.ADMIN_PORTAL_PASSPHRASE;
  process.env.ADMIN_PORTAL_PASSPHRASE = ADMIN_PASSPHRASE;

  try {
    await run();
  } finally {
    if (previousPassphrase === undefined) {
      delete process.env.ADMIN_PORTAL_PASSPHRASE;
      return;
    }

    process.env.ADMIN_PORTAL_PASSPHRASE = previousPassphrase;
  }
}

async function postJson(
  baseUrl: string,
  path: string,
  body: unknown,
  cookie?: string,
) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function getJson(
  baseUrl: string,
  path: string,
  cookie?: string,
) {
  return fetch(`${baseUrl}${path}`, {
    headers: cookie ? { Cookie: cookie } : undefined,
  });
}

async function loginAsAdmin(baseUrl: string) {
  const response = await postJson(baseUrl, '/api/admin/auth/login', {
    passphrase: ADMIN_PASSPHRASE,
  });

  assert.equal(response.status, 200);

  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie);

  return setCookie.split(';', 1)[0];
}

test('POST /api/admin/auth/login succeeds and sets an admin session cookie', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/admin/auth/login', {
        passphrase: ADMIN_PASSPHRASE,
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });

      const setCookie = response.headers.get('set-cookie');
      assert.match(setCookie ?? '', /thegame_admin_session=/);
      assert.match(setCookie ?? '', /HttpOnly/i);
      assert.match(setCookie ?? '', /SameSite=Lax/i);
    });
  });
});

test('POST /api/admin/auth/login rejects an invalid passphrase', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/admin/auth/login', {
        passphrase: 'wrong-passphrase',
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: 'Invalid admin passphrase',
        code: 'invalid_admin_passphrase',
      });
    });
  });
});

test('POST /api/admin/auth/logout clears the admin session cookie', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const adminCookie = await loginAsAdmin(baseUrl);

      const response = await postJson(
        baseUrl,
        '/api/admin/auth/logout',
        {},
        adminCookie,
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });

      const setCookie = response.headers.get('set-cookie');
      assert.match(setCookie ?? '', /thegame_admin_session=;/);
      assert.match(setCookie ?? '', /Max-Age=0/i);
    });
  });
});

test('GET /api/admin/analytics/overview blocks requests without an admin session', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const response = await getJson(
        baseUrl,
        '/api/admin/analytics/overview?from=2026-04-01&to=2026-04-07',
      );

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: 'Admin authentication required',
        code: 'admin_auth_required',
      });
    });
  });
});

test('admin analytics endpoints return contract-compliant payloads for an authorized admin', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer(
      {
        getAnalyticsOverview: async (filters): Promise<AnalyticsOverviewResponse> => ({
          filters,
          hasData: true,
          kpis: {
            routeGenerations: 12,
            routeStarts: 8,
            routeFailures: 2,
            poiDetailViews: 15,
            chatSends: 6,
          },
        }),
        getAnalyticsTimeseries: async (filters): Promise<AnalyticsTimeseriesResponse> => ({
          filters,
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
        }),
        getAnalyticsBreakdowns: async (
          filters,
        ): Promise<AnalyticsBreakdownsResponse> => ({
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
        }),
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);
        const query = '?from=2026-04-01&to=2026-04-07&theme=Culture';

        const overviewResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/overview${query}`,
          adminCookie,
        );
        const timeseriesResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/timeseries${query}`,
          adminCookie,
        );
        const breakdownsResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/breakdowns${query}`,
          adminCookie,
        );

        assert.equal(overviewResponse.status, 200);
        assert.deepEqual(await overviewResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-07',
            theme: 'Culture',
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

        assert.equal(timeseriesResponse.status, 200);
        assert.deepEqual(await timeseriesResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-07',
            theme: 'Culture',
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

        assert.equal(breakdownsResponse.status, 200);
        assert.deepEqual(await breakdownsResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-07',
            theme: 'Culture',
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
      },
    );
  });
});

test('admin analytics endpoints return stable empty-state-friendly payloads', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer(
      {
        getAnalyticsOverview: async (filters): Promise<AnalyticsOverviewResponse> => ({
          filters,
          hasData: false,
          kpis: {
            routeGenerations: 0,
            routeStarts: 0,
            routeFailures: 0,
            poiDetailViews: 0,
            chatSends: 0,
          },
        }),
        getAnalyticsTimeseries: async (filters): Promise<AnalyticsTimeseriesResponse> => ({
          filters,
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
        }),
        getAnalyticsBreakdowns: async (
          filters,
        ): Promise<AnalyticsBreakdownsResponse> => ({
          filters,
          hasData: false,
          themeBreakdown: [],
          poiBreakdown: [],
        }),
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);
        const query = '?from=2026-04-01&to=2026-04-02';

        const overviewResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/overview${query}`,
          adminCookie,
        );
        const timeseriesResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/timeseries${query}`,
          adminCookie,
        );
        const breakdownsResponse = await getJson(
          baseUrl,
          `/api/admin/analytics/breakdowns${query}`,
          adminCookie,
        );

        assert.equal(overviewResponse.status, 200);
        assert.deepEqual(await overviewResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-02',
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

        assert.equal(timeseriesResponse.status, 200);
        assert.deepEqual(await timeseriesResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-02',
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

        assert.equal(breakdownsResponse.status, 200);
        assert.deepEqual(await breakdownsResponse.json(), {
          filters: {
            from: '2026-04-01',
            to: '2026-04-02',
            theme: null,
          },
          hasData: false,
          themeBreakdown: [],
          poiBreakdown: [],
        });
      },
    );
  });
});

test('admin analytics endpoints validate date filters', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const adminCookie = await loginAsAdmin(baseUrl);

      const response = await getJson(
        baseUrl,
        '/api/admin/analytics/overview?from=2026-04-99&to=2026-04-07',
        adminCookie,
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: 'from is required and must be YYYY-MM-DD',
        code: 'invalid_analytics_filters',
      });
    });
  });
});

test('admin analytics endpoints validate theme filters', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const adminCookie = await loginAsAdmin(baseUrl);

      const response = await getJson(
        baseUrl,
        '/api/admin/analytics/breakdowns?from=2026-04-01&to=2026-04-07&theme=InvalidTheme',
        adminCookie,
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error:
          'theme must be one of: Culture, Art, War, Beverages, Leisure, History, Architecture',
        code: 'invalid_analytics_filters',
      });
    });
  });
});
