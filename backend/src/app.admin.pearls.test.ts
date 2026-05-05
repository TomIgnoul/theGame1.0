import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp, type AppDependencies } from './app';
import { AdminPearlServiceError } from './modules/admin/pearls.service';
import type {
  CreatePearlInput,
  CreatePearlOwnerInput,
  CreatedPearl,
} from './modules/admin/pearls.service';

const ADMIN_PASSPHRASE = 'open-sesame';
const OWNER_ID = '22222222-2222-4222-8222-222222222222';
const PEARL_ID = '33333333-3333-4333-8333-333333333333';

const VALID_PEARL_BODY = {
  name: 'Hidden Courtyard',
  story: 'A small story about a quiet courtyard in Brussels.',
  address: 'Rue Example 12, Brussels',
  theme: 'Culture',
  latitude: 50.8467,
  longitude: 4.3525,
  pearlOwnerId: OWNER_ID,
};

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
    } else {
      process.env.ADMIN_PORTAL_PASSPHRASE = previousPassphrase;
    }
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

function createdPearlFrom(input: CreatePearlInput): CreatedPearl {
  return {
    id: PEARL_ID,
    name: input.name,
    story: input.story,
    address: input.address,
    theme: input.theme,
    latitude: input.latitude,
    longitude: input.longitude,
    pearlOwner: {
      id: input.pearlOwnerId,
      name: 'Visit Brussels',
    },
    isRouteCandidate: true,
  };
}

test('admin Pearl endpoints block requests without an admin session', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const responses = await Promise.all([
        getJson(baseUrl, '/api/admin/pearl-owners'),
        postJson(baseUrl, '/api/admin/pearl-owners', { name: 'Visit Brussels' }),
        postJson(baseUrl, '/api/admin/pearls', VALID_PEARL_BODY),
      ]);

      for (const response of responses) {
        assert.equal(response.status, 401);
        assert.deepEqual(await response.json(), {
          error: 'Admin authentication required',
          code: 'admin_auth_required',
        });
      }
    });
  });
});

test('POST /api/admin/pearl-owners creates a PearlOwner for an authorized admin', async () => {
  await withAdminAuthEnv(async () => {
    let receivedInput: CreatePearlOwnerInput | null = null;

    await withTestServer(
      {
        createPearlOwner: async (input) => {
          receivedInput = input;
          return {
            id: OWNER_ID,
            name: input.name,
          };
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await postJson(
          baseUrl,
          '/api/admin/pearl-owners',
          { name: ' Visit Brussels ' },
          adminCookie,
        );

        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), {
          id: OWNER_ID,
          name: 'Visit Brussels',
        });
        assert.deepEqual(receivedInput, {
          name: 'Visit Brussels',
        });
      },
    );
  });
});

test('GET /api/admin/pearl-owners returns PearlOwners for an authorized admin', async () => {
  await withAdminAuthEnv(async () => {
    let receivedQuery: string | undefined;

    await withTestServer(
      {
        listPearlOwners: async (query) => {
          receivedQuery = query;
          return [
            {
              id: OWNER_ID,
              name: 'Visit Brussels',
            },
          ];
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await getJson(
          baseUrl,
          '/api/admin/pearl-owners?query=Visit',
          adminCookie,
        );

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
          items: [
            {
              id: OWNER_ID,
              name: 'Visit Brussels',
            },
          ],
        });
        assert.equal(receivedQuery, 'Visit');
      },
    );
  });
});

test('POST /api/admin/pearl-owners returns 409 for an existing PearlOwner', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer(
      {
        createPearlOwner: async () => {
          throw new AdminPearlServiceError(
            409,
            'pearl_owner_already_exists',
            'PearlOwner already exists',
          );
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await postJson(
          baseUrl,
          '/api/admin/pearl-owners',
          { name: 'Visit Brussels' },
          adminCookie,
        );

        assert.equal(response.status, 409);
        assert.deepEqual(await response.json(), {
          error: 'PearlOwner already exists',
          code: 'pearl_owner_already_exists',
        });
      },
    );
  });
});

test('POST /api/admin/pearls creates an active route-eligible Pearl with an existing PearlOwner', async () => {
  await withAdminAuthEnv(async () => {
    let receivedInput: CreatePearlInput | null = null;

    await withTestServer(
      {
        createAdminPearl: async (input) => {
          receivedInput = input;
          return createdPearlFrom(input);
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await postJson(
          baseUrl,
          '/api/admin/pearls',
          VALID_PEARL_BODY,
          adminCookie,
        );

        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), {
          id: PEARL_ID,
          name: 'Hidden Courtyard',
          story: 'A small story about a quiet courtyard in Brussels.',
          address: 'Rue Example 12, Brussels',
          theme: 'Culture',
          latitude: 50.8467,
          longitude: 4.3525,
          pearlOwner: {
            id: OWNER_ID,
            name: 'Visit Brussels',
          },
          isRouteCandidate: true,
        });
        assert.deepEqual(receivedInput, VALID_PEARL_BODY);
      },
    );
  });
});

test('POST /api/admin/pearls rejects missing required fields before saving', async () => {
  await withAdminAuthEnv(async () => {
    let createCalled = false;

    await withTestServer(
      {
        createAdminPearl: async (input) => {
          createCalled = true;
          return createdPearlFrom(input);
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await postJson(
          baseUrl,
          '/api/admin/pearls',
          { ...VALID_PEARL_BODY, story: '' },
          adminCookie,
        );

        assert.equal(response.status, 400);
        assert.deepEqual(await response.json(), {
          error: 'story is required',
          code: 'missing_story',
        });
        assert.equal(createCalled, false);
      },
    );
  });
});

test('POST /api/admin/pearls rejects themes outside the PRL-00 whitelist', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const adminCookie = await loginAsAdmin(baseUrl);

      const response = await postJson(
        baseUrl,
        '/api/admin/pearls',
        { ...VALID_PEARL_BODY, theme: 'Art' },
        adminCookie,
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: 'theme must be one of: War, Museum, Streetart, Food, Culture',
        code: 'invalid_theme',
      });
    });
  });
});

test('POST /api/admin/pearls rejects invalid latitude and longitude values', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer({}, async (baseUrl) => {
      const adminCookie = await loginAsAdmin(baseUrl);

      const latitudeResponse = await postJson(
        baseUrl,
        '/api/admin/pearls',
        { ...VALID_PEARL_BODY, latitude: 91 },
        adminCookie,
      );
      const longitudeResponse = await postJson(
        baseUrl,
        '/api/admin/pearls',
        { ...VALID_PEARL_BODY, longitude: 181 },
        adminCookie,
      );

      assert.equal(latitudeResponse.status, 400);
      assert.deepEqual(await latitudeResponse.json(), {
        error: 'latitude must be a number between -90 and 90',
        code: 'invalid_latitude',
      });

      assert.equal(longitudeResponse.status, 400);
      assert.deepEqual(await longitudeResponse.json(), {
        error: 'longitude must be a number between -180 and 180',
        code: 'invalid_longitude',
      });
    });
  });
});

test('POST /api/admin/pearls returns 404 when the PearlOwner does not exist', async () => {
  await withAdminAuthEnv(async () => {
    await withTestServer(
      {
        createAdminPearl: async () => {
          throw new AdminPearlServiceError(
            404,
            'pearl_owner_not_found',
            'PearlOwner not found',
          );
        },
      },
      async (baseUrl) => {
        const adminCookie = await loginAsAdmin(baseUrl);

        const response = await postJson(
          baseUrl,
          '/api/admin/pearls',
          VALID_PEARL_BODY,
          adminCookie,
        );

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), {
          error: 'PearlOwner not found',
          code: 'pearl_owner_not_found',
        });
      },
    );
  });
});
