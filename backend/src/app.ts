import { randomUUID } from 'node:crypto';
import express, { Request, Response, NextFunction } from 'express';
import {
  ALLOWED_THEMES,
  ALLOWED_STORY_LANGUAGES,
  CHAT_MESSAGE_MAX_LENGTH,
  CHAT_RATE_LIMIT_MAX_REQUESTS,
  CHAT_RATE_LIMIT_WINDOW_MS,
  STORY_RATE_LIMIT_MAX_REQUESTS,
  STORY_RATE_LIMIT_WINDOW_MS,
} from './config/constants';
import { ping } from './db';
import { createInMemoryRateLimit } from './middleware/simpleRateLimit';

const app = express();
app.use(express.json());

const storyRateLimit = createInMemoryRateLimit({
  maxRequests: STORY_RATE_LIMIT_MAX_REQUESTS,
  windowMs: STORY_RATE_LIMIT_WINDOW_MS,
  message: 'Too many story requests. Please wait and try again.',
});

const chatRateLimit = createInMemoryRateLimit({
  maxRequests: CHAT_RATE_LIMIT_MAX_REQUESTS,
  windowMs: CHAT_RATE_LIMIT_WINDOW_MS,
  message: 'Too many chat requests. Please wait and try again.',
});

// Basic CORS for frontend dev
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? '*';
  // Allow Vite dev server and same-origin calls
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,x-admin-key',
  );
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

// Health
app.get('/api/health', async (_req: Request, res: Response) => {
  const db = await ping();
  res.json({ ok: true, db });
});

// Gems
app.get('/api/gems', async (req: Request, res: Response) => {
  const theme = req.query.theme as string | undefined;
  if (theme) {
    const { isValidTheme } = await import('./modules/gems/gems.repo');
    if (!isValidTheme(theme)) {
      res.status(400).json({ error: 'Invalid theme value' });
      return;
    }
  }
  const { findByTheme } = await import('./modules/gems/gems.repo');
  const items = await findByTheme(theme);
  res.json({ items });
});

app.get('/api/gems/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  const { findById } = await import('./modules/gems/gems.repo');
  const gem = await findById(id);
  if (!gem) {
    res.status(404).json({ error: 'Gem not found' });
    return;
  }
  res.json(gem);
});

// Routes
app.post('/api/routes', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      theme?: string;
      kmTarget?: number;
      shape?: string;
      start?: { lat: number; lng: number };
      end?: { lat: number; lng: number } | null;
    };
    const { generateRoute } = await import('./modules/routes/routes.service');
    const result = await generateRoute({
      theme: body.theme ?? 'Culture',
      kmTarget: body.kmTarget ?? 8,
      shape: (body.shape as 'loop' | 'a_to_b') ?? 'loop',
      start: body.start ?? { lat: 50.8467, lng: 4.3525 },
      end: body.end,
    });
    res.json(result);
  } catch (err: unknown) {
    const e = err as { status?: number; code?: string; message?: string };
    const status = e.status ?? 500;
    res.status(status).json({
      error: e.message ?? 'Route generation failed',
      code: e.code,
    });
  }
});

// Chat
app.post('/api/chat', chatRateLimit, async (req: Request, res: Response) => {
  const body = (req.body || {}) as {
    message?: unknown;
    sessionId?: unknown;
    gemId?: unknown;
  };

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const gemId = typeof body.gemId === 'string' ? body.gemId.trim() : '';
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

  if (!gemId || !/^[0-9a-f-]{36}$/i.test(gemId)) {
    res.status(400).json({
      error: 'Invalid gemId format',
      code: 'invalid_gem_id',
    });
    return;
  }

  if (!message) {
    res.status(400).json({
      error: 'Message is required',
      code: 'missing_message',
    });
    return;
  }

  if (message.length > CHAT_MESSAGE_MAX_LENGTH) {
    res.status(400).json({
      error: `Message must be ${CHAT_MESSAGE_MAX_LENGTH} characters or fewer`,
      code: 'message_too_long',
    });
    return;
  }

  try {
    const { findById } = await import('./modules/gems/gems.repo');
    const gem = await findById(gemId);
    if (!gem) {
      res.status(404).json({
        error: 'Gem not found',
        code: 'gem_not_found',
      });
      return;
    }

    const { buildChatMessages } = await import('./modules/chat/promptService');
    const { generateChatReply } = await import('./modules/chat/aiService');

    const reply = await generateChatReply(buildChatMessages(gem, message));

    res.json({
      reply,
      sessionId: sessionId || randomUUID(),
    });
  } catch (err: unknown) {
    const { AiRuntimeError } = await import('./modules/ai/aiRuntime');
    if (err instanceof AiRuntimeError) {
      res.status(err.status).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    console.error(err);
    res.status(502).json({
      error: 'Chat generation failed',
      code: 'chat_generation_failed',
    });
  }
});

// Story
app.post('/api/gems/:id/story', storyRateLimit, async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  const body = (req.body || {}) as { theme?: unknown; language?: unknown };
  const theme = typeof body.theme === 'string' ? body.theme.trim() : '';
  const language = typeof body.language === 'string' ? body.language.trim() : '';

  const { isValidTheme } = await import('./modules/gems/gems.repo');
  if (!theme || !isValidTheme(theme)) {
    res.status(400).json({
      error: `Invalid theme value. Allowed values: ${isValidThemeList()}`,
      code: 'invalid_theme',
    });
    return;
  }

  if (!isValidStoryLanguage(language)) {
    res.status(400).json({
      error: `Invalid language value. Allowed values: ${ALLOWED_STORY_LANGUAGES.join(', ')}`,
      code: 'invalid_language',
    });
    return;
  }

  try {
    const { getOrCreateStory } = await import('./modules/stories/stories.service');
    const result = await getOrCreateStory(id, theme, language);
    if (!result) {
      res.status(404).json({ error: 'Gem not found' });
      return;
    }
    res.json(result);
  } catch (err: unknown) {
    const { StoryServiceError } = await import('./modules/stories/stories.service');
    if (err instanceof StoryServiceError) {
      res.status(err.status).json({
        error: err.message,
        code: err.code,
      });
      return;
    }

    console.error(err);
    res.status(500).json({
      error: 'Unexpected story error',
      code: 'story_unexpected_error',
    });
  }
});

// Admin sync (requires x-admin-key)
app.post('/api/admin/datasets/sync', async (req: Request, res: Response) => {
  const key = req.headers['x-admin-key'];
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || key !== expected) {
    res.status(401).json({ error: 'Missing or invalid admin key' });
    return;
  }
  try {
    const { syncDatasets } = await import('./modules/admin/sync.service');
    const result = await syncDatasets();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

function isValidStoryLanguage(value: string): value is (typeof ALLOWED_STORY_LANGUAGES)[number] {
  return ALLOWED_STORY_LANGUAGES.includes(
    value as (typeof ALLOWED_STORY_LANGUAGES)[number],
  );
}

function isValidThemeList() {
  return ALLOWED_THEMES.join(', ');
}
