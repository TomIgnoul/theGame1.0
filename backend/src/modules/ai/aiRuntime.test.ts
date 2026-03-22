import assert from 'node:assert/strict';
import test from 'node:test';
import { AiRuntimeError, generateAiText } from './aiRuntime';

const originalFetch = globalThis.fetch;
const originalProvider = process.env.AI_PROVIDER;
const originalBaseUrl = process.env.OLLAMA_BASE_URL;
const originalModel = process.env.OLLAMA_MODEL;
const originalApiKey = process.env.OLLAMA_API_KEY;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnv('AI_PROVIDER', originalProvider);
  restoreEnv('OLLAMA_BASE_URL', originalBaseUrl);
  restoreEnv('OLLAMA_MODEL', originalModel);
  restoreEnv('OLLAMA_API_KEY', originalApiKey);
});

test('generateAiText returns assistant text from Ollama response', async () => {
  process.env.AI_PROVIDER = 'ollama';
  process.env.OLLAMA_BASE_URL = 'http://localhost:11434';
  process.env.OLLAMA_MODEL = 'llama3.2';

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        message: { content: 'Hello from Ollama' },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  const reply = await generateAiText([
    { role: 'user', content: 'Tell me something about this POI.' },
  ]);

  assert.equal(reply, 'Hello from Ollama');
});

test('generateAiText supports remote Ollama config with auth headers', async () => {
  process.env.AI_PROVIDER = 'ollama_cloud';
  process.env.OLLAMA_BASE_URL = 'https://example-ollama-host/api';
  process.env.OLLAMA_MODEL = 'gpt-oss:120b';
  process.env.OLLAMA_API_KEY = 'secret-token';

  let receivedUrl = '';
  let receivedHeaders: HeadersInit | undefined;

  globalThis.fetch = async (input, init) => {
    receivedUrl = String(input);
    receivedHeaders = init?.headers;

    return new Response(
      JSON.stringify({
        message: { content: 'Remote Ollama reply' },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  const reply = await generateAiText([
    { role: 'user', content: 'Tell me something about this POI.' },
  ]);

  assert.equal(reply, 'Remote Ollama reply');
  assert.equal(receivedUrl, 'https://example-ollama-host/api/chat');

  const headers = new Headers(receivedHeaders);
  assert.equal(headers.get('authorization'), 'Bearer secret-token');
  assert.equal(headers.get('x-api-key'), 'secret-token');
});

test('generateAiText returns a clean unavailable error when Ollama cannot be reached', async () => {
  process.env.AI_PROVIDER = 'ollama';

  globalThis.fetch = async () => {
    throw new TypeError('fetch failed');
  };

  await assert.rejects(
    () =>
      generateAiText([
        { role: 'user', content: 'Tell me something about this POI.' },
      ]),
    (error: unknown) => {
      assert.ok(error instanceof AiRuntimeError);
      assert.equal(error.code, 'ai_runtime_unavailable');
      assert.match(error.message, /Ollama is unavailable/i);
      return true;
    },
  );
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
