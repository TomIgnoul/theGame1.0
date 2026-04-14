import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp, type AppDependencies } from './app';
import { recordAnalyticsEventSafe } from './modules/analytics/service';
import type { AnalyticsEventInput } from './modules/analytics/types';

const TEST_GEM = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Grand Place',
  theme: 'Culture',
  descriptionShort: 'Historic square',
  address: 'Brussels',
  latitude: 50.8467,
  longitude: 4.3525,
  practicalInfo: {},
  sourceType: 'open_data',
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

async function postJson(
  baseUrl: string,
  path: string,
  body: unknown,
) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

async function getJson(baseUrl: string, path: string) {
  return fetch(`${baseUrl}${path}`);
}

function flushAsyncWork() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

test('POST /api/analytics/events accepts allowlisted frontend analytics writes', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/analytics/events', {
        eventType: 'filter_applied',
        theme: 'Culture',
      });

      assert.equal(response.status, 202);
      assert.deepEqual(await response.json(), { accepted: true });

      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.deepEqual(recordedEvents[0], {
        eventType: 'filter_applied',
        theme: 'Culture',
        source: 'frontend',
      });
    },
  );
});

test('POST /api/analytics/events accepts route_started with safe metadata only', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/analytics/events', {
        eventType: 'route_started',
        theme: 'Culture',
        metadata: {
          shape: 'loop',
          kmTarget: 7,
          kmResult: 6.8,
          gemCount: 5,
        },
      });

      assert.equal(response.status, 202);
      assert.deepEqual(await response.json(), { accepted: true });

      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.deepEqual(recordedEvents[0], {
        eventType: 'route_started',
        theme: 'Culture',
        resultStatus: 'started',
        source: 'frontend',
        metadata: {
          shape: 'loop',
          kmTarget: 7,
          kmResult: 6.8,
          gemCount: 5,
        },
      });
    },
  );
});

test('POST /api/analytics/events rejects unknown event types with 400', async () => {
  await withTestServer({}, async (baseUrl) => {
    const response = await postJson(baseUrl, '/api/analytics/events', {
      eventType: 'made_up_event',
    });

    assert.equal(response.status, 400);

    const body = (await response.json()) as {
      code?: string;
      error?: string;
    };

    assert.equal(body.code, 'invalid_event_type');
    assert.match(body.error ?? '', /Unsupported analytics event type/);
  });
});

test('GET /api/gems/:id records poi_detail_opened analytics events', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      findGemById: async () => TEST_GEM,
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await getJson(baseUrl, `/api/gems/${TEST_GEM.id}`);

      assert.equal(response.status, 200);
      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.deepEqual(recordedEvents[0], {
        eventType: 'poi_detail_opened',
        poiId: TEST_GEM.id,
        theme: 'Culture',
        resultStatus: 'opened',
        source: 'backend',
      });
    },
  );
});

test('route generation still succeeds when analytics persistence fails', async () => {
  await withTestServer(
    {
      generateRoute: async (request) => ({
        shape: request.shape,
        kmTarget: request.kmTarget,
        kmResult: 7.2,
        gems: [{ id: TEST_GEM.id, title: TEST_GEM.title }],
        polyline: 'encoded_polyline',
        warnings: [],
      }),
      recordAnalyticsEventSafe: async () => {
        throw new Error('analytics unavailable');
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/routes', {
        theme: 'Culture',
        kmTarget: 7,
        shape: 'loop',
        start: { lat: 50.8467, lng: 4.3525 },
      });

      assert.equal(response.status, 200);

      const body = (await response.json()) as { kmResult?: number };
      assert.equal(body.kmResult, 7.2);
    },
  );
});

test('route generation records route_generated analytics on success', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      generateRoute: async (request) => ({
        shape: request.shape,
        kmTarget: request.kmTarget,
        kmResult: 7.2,
        gems: [{ id: TEST_GEM.id, title: TEST_GEM.title }],
        polyline: 'encoded_polyline',
        warnings: [],
      }),
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/routes', {
        theme: 'Culture',
        kmTarget: 7,
        shape: 'loop',
        start: { lat: 50.8467, lng: 4.3525 },
      });

      assert.equal(response.status, 200);
      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.equal(recordedEvents[0].eventType, 'route_generated');
      assert.equal(recordedEvents[0].theme, 'Culture');
      assert.equal(recordedEvents[0].source, 'backend');
    },
  );
});

test('route generation failures emit route_generation_failed analytics events', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      generateRoute: async () => {
        throw {
          status: 404,
          code: 'no_route_possible',
          message: 'No route possible',
        };
      },
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/routes', {
        theme: 'Culture',
        kmTarget: 7,
        shape: 'loop',
        start: { lat: 50.8467, lng: 4.3525 },
      });

      assert.equal(response.status, 404);
      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.equal(recordedEvents[0].eventType, 'route_generation_failed');
      assert.equal(recordedEvents[0].theme, 'Culture');
      assert.equal(recordedEvents[0].source, 'backend');
    },
  );
});

test('POST /api/gems/:id/story records story_generated analytics without storing story text', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];
  const generatedStory =
    'A generated story that must not be copied into analytics.';

  await withTestServer(
    {
      getOrCreateStory: async () => ({
        gemId: TEST_GEM.id,
        theme: 'Culture',
        language: 'en',
        promptVersion: 'v1',
        storyText: generatedStory,
        source: 'generated',
      }),
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(
        baseUrl,
        `/api/gems/${TEST_GEM.id}/story`,
        {
          theme: 'Culture',
          language: 'en',
        },
      );

      assert.equal(response.status, 200);
      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.deepEqual(recordedEvents[0], {
        eventType: 'story_generated',
        poiId: TEST_GEM.id,
        theme: 'Culture',
        resultStatus: 'generated',
        source: 'backend',
        metadata: {
          language: 'en',
          storySource: 'generated',
        },
      });
      assert.doesNotMatch(
        JSON.stringify(recordedEvents[0]),
        new RegExp(generatedStory),
      );
    },
  );
});

test('chat responses still succeed when analytics persistence fails', async () => {
  await withTestServer(
    {
      findGemById: async () => TEST_GEM,
      buildChatMessages: (_gem, message) => [
        { role: 'user', content: message },
      ],
      generateChatReply: async () => 'Hello from the POI guide.',
      recordAnalyticsEventSafe: async () => {
        throw new Error('analytics unavailable');
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/chat', {
        gemId: TEST_GEM.id,
        message: 'Tell me more about this place.',
      });

      assert.equal(response.status, 200);

      const body = (await response.json()) as { reply?: string };
      assert.equal(body.reply, 'Hello from the POI guide.');
    },
  );
});

test('POST /api/analytics/events accepts stop_chat_opened without chat content', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];

  await withTestServer(
    {
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/analytics/events', {
        eventType: 'stop_chat_opened',
        poiId: TEST_GEM.id,
        theme: 'Culture',
      });

      assert.equal(response.status, 202);
      assert.deepEqual(await response.json(), { accepted: true });

      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.deepEqual(recordedEvents[0], {
        eventType: 'stop_chat_opened',
        poiId: TEST_GEM.id,
        theme: 'Culture',
        source: 'frontend',
      });
    },
  );
});

test('chat analytics never persist chat message content', async () => {
  const recordedEvents: AnalyticsEventInput[] = [];
  const sensitivePrompt = 'My private chat message should never be stored';

  await withTestServer(
    {
      findGemById: async () => TEST_GEM,
      buildChatMessages: (_gem, message) => [
        { role: 'user', content: message },
      ],
      generateChatReply: async () => 'Safe answer.',
      recordAnalyticsEventSafe: async (event) => {
        recordedEvents.push(event);
        return true;
      },
    },
    async (baseUrl) => {
      const response = await postJson(baseUrl, '/api/chat', {
        gemId: TEST_GEM.id,
        message: sensitivePrompt,
        sessionId: 'session-123',
      });

      assert.equal(response.status, 200);
      await flushAsyncWork();

      assert.equal(recordedEvents.length, 1);
      assert.equal(recordedEvents[0].eventType, 'stop_chat_sent');
      assert.match(JSON.stringify(recordedEvents[0]), /stop_chat_sent/);
      assert.doesNotMatch(JSON.stringify(recordedEvents[0]), new RegExp(sensitivePrompt));
    },
  );
});

test('analytics write failure logs only event type and source', async () => {
  const sensitiveText = 'Do not leak this text into analytics logs';
  const loggedWarnings: Array<{
    message: string;
    payload: Record<string, unknown>;
  }> = [];

  const wasRecorded = await recordAnalyticsEventSafe(
    {
      eventType: 'stop_chat_sent',
      routeId: 'not-a-uuid',
      resultStatus: sensitiveText,
      source: 'backend',
    },
    {
      warn: (message, payload) => {
        loggedWarnings.push({ message, payload });
      },
    },
  );

  assert.equal(wasRecorded, false);
  assert.deepEqual(loggedWarnings, [
    {
      message: '[analytics] write_failed',
      payload: {
        eventType: 'stop_chat_sent',
        source: 'backend',
      },
    },
  ]);
  assert.doesNotMatch(JSON.stringify(loggedWarnings), new RegExp(sensitiveText));
});
