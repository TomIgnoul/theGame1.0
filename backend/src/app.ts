import express, { Request, Response, NextFunction } from 'express';
import { ping } from './db';

const app = express();
app.use(express.json());

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

// Story
app.post('/api/gems/:id/story', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  const body = (req.body || {}) as { theme?: string; language?: string };
  const theme = body.theme ?? 'Culture';
  const language = body.language ?? 'en';
  try {
    const { getOrCreateStory } = await import('./modules/stories/stories.service');
    const result = await getOrCreateStory(id, theme, language);
    if (!result) {
      res.status(404).json({ error: 'Gem not found' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Story generation failed' });
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
