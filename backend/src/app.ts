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
import {
  findById,
  findByTheme,
  isValidTheme,
} from './modules/gems/gems.repo';
import { generateRoute, type RouteRequest } from './modules/routes/routes.service';
import { buildChatMessages } from './modules/chat/promptService';
import { generateChatReply } from './modules/chat/aiService';
import {
  getOrCreateStory,
  StoryServiceError,
} from './modules/stories/stories.service';
import { syncDatasets } from './modules/admin/sync.service';
import {
  parseFrontendAnalyticsEvent,
  recordAnalyticsEventSafe,
} from './modules/analytics/service';
import {
  getAnalyticsBreakdowns,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  parseAnalyticsReadFilters,
} from './modules/analytics/read.service';
import {
  clearAdminSessionCookie,
  hasValidAdminSession,
  isAdminAuthConfigured,
  issueAdminSessionCookie,
  verifyAdminPassphrase,
} from './modules/admin/auth';
import { AiRuntimeError } from './modules/ai/aiRuntime';
import type { AnalyticsEventInput } from './modules/analytics/types';

export interface AppDependencies {
  pingDb: typeof ping;
  findGemsByTheme: typeof findByTheme;
  findGemById: typeof findById;
  validateTheme: typeof isValidTheme;
  generateRoute: (request: RouteRequest) => ReturnType<typeof generateRoute>;
  buildChatMessages: typeof buildChatMessages;
  generateChatReply: typeof generateChatReply;
  getOrCreateStory: typeof getOrCreateStory;
  syncDatasets: typeof syncDatasets;
  parseFrontendAnalyticsEvent: typeof parseFrontendAnalyticsEvent;
  recordAnalyticsEventSafe: typeof recordAnalyticsEventSafe;
  getAnalyticsOverview: typeof getAnalyticsOverview;
  getAnalyticsTimeseries: typeof getAnalyticsTimeseries;
  getAnalyticsBreakdowns: typeof getAnalyticsBreakdowns;
}

const defaultDependencies: AppDependencies = {
  pingDb: ping,
  findGemsByTheme: findByTheme,
  findGemById: findById,
  validateTheme: isValidTheme,
  generateRoute,
  buildChatMessages,
  generateChatReply,
  getOrCreateStory,
  syncDatasets,
  parseFrontendAnalyticsEvent,
  recordAnalyticsEventSafe,
  getAnalyticsOverview,
  getAnalyticsTimeseries,
  getAnalyticsBreakdowns,
};

export function createApp(
  overrides: Partial<AppDependencies> = {},
) {
  const deps = { ...defaultDependencies, ...overrides };
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
    const db = await deps.pingDb();
    res.json({ ok: true, db });
  });

  // Gems
  app.get('/api/gems', async (req: Request, res: Response) => {
    const theme = req.query.theme as string | undefined;
    if (theme && !deps.validateTheme(theme)) {
      res.status(400).json({ error: 'Invalid theme value' });
      return;
    }

    const items = await deps.findGemsByTheme(theme);
    res.json({ items });
  });

  app.get('/api/gems/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
      res.status(400).json({ error: 'Invalid ID format' });
      return;
    }

    const gem = await deps.findGemById(id);
    if (!gem) {
      res.status(404).json({ error: 'Gem not found' });
      return;
    }

    res.json(gem);
    // Implements FR-17 / FR-18 and covers GH-AN-06 for POI detail opens.
    queueAnalyticsEvent(deps.recordAnalyticsEventSafe, {
      eventType: 'poi_detail_opened',
      poiId: gem.id,
      theme: gem.theme,
      resultStatus: 'opened',
      source: 'backend',
    });
  });

  // Routes
  app.post('/api/routes', async (req: Request, res: Response) => {
    const body = req.body as {
      theme?: string;
      kmTarget?: number;
      shape?: string;
      start?: { lat: number; lng: number };
      end?: { lat: number; lng: number } | null;
    };

    const routeRequest: RouteRequest = {
      theme: body.theme ?? 'Culture',
      kmTarget: body.kmTarget ?? 8,
      shape: (body.shape as 'loop' | 'a_to_b') ?? 'loop',
      start: body.start ?? { lat: 50.8467, lng: 4.3525 },
      end: body.end,
    };

    try {
      const result = await deps.generateRoute(routeRequest);
      res.json(result);
      // Implements FR-17 / FR-18 and covers GH-AN-05 / GH-AN-07.
      queueAnalyticsEvent(deps.recordAnalyticsEventSafe, {
        eventType: 'route_generated',
        theme: result.gems.length > 0 ? routeRequest.theme : null,
        resultStatus: result.warnings.length > 0 ? 'warning' : 'success',
        source: 'backend',
        metadata: {
          shape: result.shape,
          kmTarget: result.kmTarget,
          kmResult: result.kmResult,
          gemCount: result.gems.length,
          warningCount: result.warnings.length,
        },
      });
    } catch (err: unknown) {
      const e = err as { status?: number; code?: string; message?: string };
      const status = e.status ?? 500;
      // Implements FR-17 / FR-18 and covers GH-AN-05 / GH-AN-07.
      queueAnalyticsEvent(deps.recordAnalyticsEventSafe, {
        eventType: 'route_generation_failed',
        theme: routeRequest.theme,
        resultStatus: e.code ?? `http_${status}`,
        source: 'backend',
        metadata: {
          shape: routeRequest.shape,
          kmTarget: routeRequest.kmTarget,
          httpStatus: status,
          errorCode: e.code ?? 'route_generation_failed',
        },
      });
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

    const message =
      typeof body.message === 'string' ? body.message.trim() : '';
    const gemId = typeof body.gemId === 'string' ? body.gemId.trim() : '';
    const sessionId =
      typeof body.sessionId === 'string' ? body.sessionId.trim() : '';

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
      const gem = await deps.findGemById(gemId);
      if (!gem) {
        res.status(404).json({
          error: 'Gem not found',
          code: 'gem_not_found',
        });
        return;
      }

      // Implements FR-17 / FR-18 and covers GH-AN-06 / GH-AN-07 without
      // persisting chat content.
      queueAnalyticsEvent(deps.recordAnalyticsEventSafe, {
        eventType: 'stop_chat_sent',
        poiId: gem.id,
        theme: gem.theme,
        resultStatus: 'sent',
        source: 'backend',
        metadata: {
          hasSessionId: Boolean(sessionId),
        },
      });

      const reply = await deps.generateChatReply(
        deps.buildChatMessages(gem, message),
      );

      res.json({
        reply,
        sessionId: sessionId || randomUUID(),
      });
    } catch (err: unknown) {
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
  app.post(
    '/api/gems/:id/story',
    storyRateLimit,
    async (req: Request, res: Response) => {
      const { id } = req.params;
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
      }
      const body = (req.body || {}) as {
        theme?: unknown;
        language?: unknown;
      };
      const theme = typeof body.theme === 'string' ? body.theme.trim() : '';
      const language =
        typeof body.language === 'string' ? body.language.trim() : '';

      if (!theme || !deps.validateTheme(theme)) {
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
        const result = await deps.getOrCreateStory(id, theme, language);
        if (!result) {
          res.status(404).json({ error: 'Gem not found' });
          return;
        }

        res.json(result);
        // Implements FR-17 / FR-18 and covers GH-AN-06 / GH-AN-07.
        queueAnalyticsEvent(deps.recordAnalyticsEventSafe, {
          eventType: 'story_generated',
          poiId: id,
          theme,
          resultStatus: result.source,
          source: 'backend',
          metadata: {
            language,
            storySource: result.source,
          },
        });
      } catch (err: unknown) {
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
    },
  );

  // Implements FR-17 / FR-18 and covers GH-AN-05 / GH-AN-06 / GH-AN-07 for
  // allowlisted frontend-triggered analytics events that contain no chat body.
  app.post('/api/analytics/events', async (req: Request, res: Response) => {
    const parsed = deps.parseFrontendAnalyticsEvent(req.body);
    if (!parsed.ok) {
      res.status(400).json({
        error: parsed.error,
        code: parsed.code,
      });
      return;
    }

    queueAnalyticsEvent(deps.recordAnalyticsEventSafe, parsed.event);
    res.status(202).json({ accepted: true });
  });

  // Implements FR-19 / FR-25 / FR-26 and covers GH-AN-01 / GH-AN-02 for the
  // minimal backend-issued admin session flow.
  app.post('/api/admin/auth/login', async (req: Request, res: Response) => {
    applyAdminNoStore(res);

    const passphrase =
      typeof req.body?.passphrase === 'string' ? req.body.passphrase.trim() : '';

    if (!isAdminAuthConfigured()) {
      res.status(503).json({
        error: 'Admin authentication is unavailable',
        code: 'admin_auth_unavailable',
      });
      return;
    }

    if (!passphrase) {
      res.status(400).json({
        error: 'passphrase is required',
        code: 'missing_passphrase',
      });
      return;
    }

    if (!verifyAdminPassphrase(passphrase)) {
      res.status(401).json({
        error: 'Invalid admin passphrase',
        code: 'invalid_admin_passphrase',
      });
      return;
    }

    issueAdminSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Implements FR-25 / FR-26 and covers GH-AN-02 for explicit admin-session
  // teardown without exposing any analytics data.
  app.post('/api/admin/auth/logout', async (req: Request, res: Response) => {
    applyAdminNoStore(res);
    clearAdminSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Implements FR-19 / FR-20 / FR-23 / FR-25 / FR-26 and covers GH-AN-01 /
  // GH-AN-02 / GH-AN-03 / GH-AN-04 for read-only analytics KPI cards.
  app.get('/api/admin/analytics/overview', async (req: Request, res: Response) => {
    applyAdminNoStore(res);
    if (!requireAdminAnalyticsSession(req, res)) {
      return;
    }

    const parsed = parseAnalyticsReadFilters(req.query);
    if (!parsed.ok) {
      res.status(400).json({
        error: parsed.error,
        code: parsed.code,
      });
      return;
    }

    try {
      const overview = await deps.getAnalyticsOverview(parsed.filters);
      res.json(overview);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: 'Analytics overview is unavailable',
        code: 'analytics_overview_unavailable',
      });
    }
  });

  // Implements FR-19 / FR-21 / FR-23 / FR-25 / FR-26 and covers GH-AN-01 /
  // GH-AN-02 / GH-AN-03 / GH-AN-04 for read-only analytics graphs.
  app.get('/api/admin/analytics/timeseries', async (req: Request, res: Response) => {
    applyAdminNoStore(res);
    if (!requireAdminAnalyticsSession(req, res)) {
      return;
    }

    const parsed = parseAnalyticsReadFilters(req.query);
    if (!parsed.ok) {
      res.status(400).json({
        error: parsed.error,
        code: parsed.code,
      });
      return;
    }

    try {
      const timeseries = await deps.getAnalyticsTimeseries(parsed.filters);
      res.json(timeseries);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: 'Analytics timeseries is unavailable',
        code: 'analytics_timeseries_unavailable',
      });
    }
  });

  // Implements FR-19 / FR-22 / FR-23 / FR-24 / FR-25 / FR-26 and covers
  // GH-AN-01 / GH-AN-02 / GH-AN-03 / GH-AN-04 for stable breakdown graphs and
  // empty-state-friendly responses.
  app.get('/api/admin/analytics/breakdowns', async (req: Request, res: Response) => {
    applyAdminNoStore(res);
    if (!requireAdminAnalyticsSession(req, res)) {
      return;
    }

    const parsed = parseAnalyticsReadFilters(req.query);
    if (!parsed.ok) {
      res.status(400).json({
        error: parsed.error,
        code: parsed.code,
      });
      return;
    }

    try {
      const breakdowns = await deps.getAnalyticsBreakdowns(parsed.filters);
      res.json(breakdowns);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: 'Analytics breakdowns are unavailable',
        code: 'analytics_breakdowns_unavailable',
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
      const result = await deps.syncDatasets();
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

  return app;
}

export default createApp();

function isValidStoryLanguage(value: string): value is (typeof ALLOWED_STORY_LANGUAGES)[number] {
  return ALLOWED_STORY_LANGUAGES.includes(
    value as (typeof ALLOWED_STORY_LANGUAGES)[number],
  );
}

function isValidThemeList() {
  return ALLOWED_THEMES.join(', ');
}

function queueAnalyticsEvent(
  recordEvent: (event: AnalyticsEventInput) => Promise<unknown>,
  event: AnalyticsEventInput,
) {
  void Promise.resolve(recordEvent(event)).catch(() => undefined);
}

function applyAdminNoStore(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
}

function requireAdminAnalyticsSession(req: Request, res: Response) {
  if (hasValidAdminSession(req)) {
    return true;
  }

  res.status(401).json({
    error: 'Admin authentication required',
    code: 'admin_auth_required',
  });
  return false;
}
