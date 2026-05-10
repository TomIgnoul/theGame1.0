import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp, type AppDependencies } from './app';

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

test('GET /api/gems exposes sourceType so the map can distinguish admin Pearls', async () => {
  await withTestServer(
    {
      findGemsByTheme: async () => [
        {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Grand Place',
          theme: 'Culture',
          latitude: 50.8467,
          longitude: 4.3525,
          address: 'Brussels',
          practicalInfo: {},
          sourceType: 'open_data',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          title: 'Hidden Courtyard',
          theme: 'Culture',
          latitude: 50.8472,
          longitude: 4.353,
          address: 'Rue Example 12, Brussels',
          practicalInfo: {},
          sourceType: 'manual',
        },
      ],
    },
    async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/gems?theme=Culture`);

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Grand Place',
            theme: 'Culture',
            latitude: 50.8467,
            longitude: 4.3525,
            address: 'Brussels',
            practicalInfo: {},
            sourceType: 'open_data',
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            title: 'Hidden Courtyard',
            theme: 'Culture',
            latitude: 50.8472,
            longitude: 4.353,
            address: 'Rue Example 12, Brussels',
            practicalInfo: {},
            sourceType: 'manual',
          },
        ],
      });
    },
  );
});
