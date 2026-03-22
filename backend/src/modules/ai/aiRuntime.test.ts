import assert from 'node:assert/strict';
import test from 'node:test';
import { AiRuntimeError, generateAiText } from './aiRuntime';

const originalFetch = globalThis.fetch;
const originalProvider = process.env.AI_PROVIDER;
const originalBaseUrl = process.env.OLLAMA_BASE_URL;
const originalModel = process.env.OLLAMA_MODEL;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnv('AI_PROVIDER', originalProvider);
  restoreEnv('OLLAMA_BASE_URL', originalBaseUrl);
  restoreEnv('OLLAMA_MODEL', originalModel);
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
