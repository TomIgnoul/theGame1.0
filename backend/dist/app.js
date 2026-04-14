"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const node_crypto_1 = require("node:crypto");
const express_1 = __importDefault(require("express"));
const constants_1 = require("./config/constants");
const db_1 = require("./db");
const simpleRateLimit_1 = require("./middleware/simpleRateLimit");
const gems_repo_1 = require("./modules/gems/gems.repo");
const routes_service_1 = require("./modules/routes/routes.service");
const promptService_1 = require("./modules/chat/promptService");
const aiService_1 = require("./modules/chat/aiService");
const stories_service_1 = require("./modules/stories/stories.service");
const sync_service_1 = require("./modules/admin/sync.service");
const service_1 = require("./modules/analytics/service");
const read_service_1 = require("./modules/analytics/read.service");
const auth_1 = require("./modules/admin/auth");
const aiRuntime_1 = require("./modules/ai/aiRuntime");
const defaultDependencies = {
    pingDb: db_1.ping,
    findGemsByTheme: gems_repo_1.findByTheme,
    findGemById: gems_repo_1.findById,
    validateTheme: gems_repo_1.isValidTheme,
    generateRoute: routes_service_1.generateRoute,
    buildChatMessages: promptService_1.buildChatMessages,
    generateChatReply: aiService_1.generateChatReply,
    getOrCreateStory: stories_service_1.getOrCreateStory,
    syncDatasets: sync_service_1.syncDatasets,
    parseFrontendAnalyticsEvent: service_1.parseFrontendAnalyticsEvent,
    recordAnalyticsEventSafe: service_1.recordAnalyticsEventSafe,
    getAnalyticsOverview: read_service_1.getAnalyticsOverview,
    getAnalyticsTimeseries: read_service_1.getAnalyticsTimeseries,
    getAnalyticsBreakdowns: read_service_1.getAnalyticsBreakdowns,
};
function createApp(overrides = {}) {
    const deps = { ...defaultDependencies, ...overrides };
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    const storyRateLimit = (0, simpleRateLimit_1.createInMemoryRateLimit)({
        maxRequests: constants_1.STORY_RATE_LIMIT_MAX_REQUESTS,
        windowMs: constants_1.STORY_RATE_LIMIT_WINDOW_MS,
        message: 'Too many story requests. Please wait and try again.',
    });
    const chatRateLimit = (0, simpleRateLimit_1.createInMemoryRateLimit)({
        maxRequests: constants_1.CHAT_RATE_LIMIT_MAX_REQUESTS,
        windowMs: constants_1.CHAT_RATE_LIMIT_WINDOW_MS,
        message: 'Too many chat requests. Please wait and try again.',
    });
    // Basic CORS for frontend dev
    app.use((req, res, next) => {
        const origin = req.headers.origin ?? '*';
        // Allow Vite dev server and same-origin calls
        const allowedOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
        if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-key');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.sendStatus(204);
            return;
        }
        next();
    });
    // Health
    app.get('/api/health', async (_req, res) => {
        const db = await deps.pingDb();
        res.json({ ok: true, db });
    });
    // Gems
    app.get('/api/gems', async (req, res) => {
        const theme = req.query.theme;
        if (theme && !deps.validateTheme(theme)) {
            res.status(400).json({ error: 'Invalid theme value' });
            return;
        }
        const items = await deps.findGemsByTheme(theme);
        res.json({ items });
    });
    app.get('/api/gems/:id', async (req, res) => {
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
    app.post('/api/routes', async (req, res) => {
        const body = req.body;
        const routeRequest = {
            theme: body.theme ?? 'Culture',
            kmTarget: body.kmTarget ?? 8,
            shape: body.shape ?? 'loop',
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
        }
        catch (err) {
            const e = err;
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
    app.post('/api/chat', chatRateLimit, async (req, res) => {
        const body = (req.body || {});
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
        if (message.length > constants_1.CHAT_MESSAGE_MAX_LENGTH) {
            res.status(400).json({
                error: `Message must be ${constants_1.CHAT_MESSAGE_MAX_LENGTH} characters or fewer`,
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
            const reply = await deps.generateChatReply(deps.buildChatMessages(gem, message));
            res.json({
                reply,
                sessionId: sessionId || (0, node_crypto_1.randomUUID)(),
            });
        }
        catch (err) {
            if (err instanceof aiRuntime_1.AiRuntimeError) {
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
    app.post('/api/gems/:id/story', storyRateLimit, async (req, res) => {
        const { id } = req.params;
        if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
            res.status(400).json({ error: 'Invalid ID format' });
            return;
        }
        const body = (req.body || {});
        const theme = typeof body.theme === 'string' ? body.theme.trim() : '';
        const language = typeof body.language === 'string' ? body.language.trim() : '';
        if (!theme || !deps.validateTheme(theme)) {
            res.status(400).json({
                error: `Invalid theme value. Allowed values: ${isValidThemeList()}`,
                code: 'invalid_theme',
            });
            return;
        }
        if (!isValidStoryLanguage(language)) {
            res.status(400).json({
                error: `Invalid language value. Allowed values: ${constants_1.ALLOWED_STORY_LANGUAGES.join(', ')}`,
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
        }
        catch (err) {
            if (err instanceof stories_service_1.StoryServiceError) {
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
    // Implements FR-17 / FR-18 and covers GH-AN-05 / GH-AN-06 / GH-AN-07 for
    // allowlisted frontend-triggered analytics events that contain no chat body.
    app.post('/api/analytics/events', async (req, res) => {
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
    app.post('/api/admin/auth/login', async (req, res) => {
        applyAdminNoStore(res);
        const passphrase = typeof req.body?.passphrase === 'string' ? req.body.passphrase.trim() : '';
        if (!(0, auth_1.isAdminAuthConfigured)()) {
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
        if (!(0, auth_1.verifyAdminPassphrase)(passphrase)) {
            res.status(401).json({
                error: 'Invalid admin passphrase',
                code: 'invalid_admin_passphrase',
            });
            return;
        }
        (0, auth_1.issueAdminSessionCookie)(req, res);
        res.json({ ok: true });
    });
    // Implements FR-25 / FR-26 and covers GH-AN-02 for explicit admin-session
    // teardown without exposing any analytics data.
    app.post('/api/admin/auth/logout', async (req, res) => {
        applyAdminNoStore(res);
        (0, auth_1.clearAdminSessionCookie)(req, res);
        res.json({ ok: true });
    });
    // Implements FR-19 / FR-20 / FR-23 / FR-25 / FR-26 and covers GH-AN-01 /
    // GH-AN-02 / GH-AN-03 / GH-AN-04 for read-only analytics KPI cards.
    app.get('/api/admin/analytics/overview', async (req, res) => {
        applyAdminNoStore(res);
        if (!requireAdminAnalyticsSession(req, res)) {
            return;
        }
        const parsed = (0, read_service_1.parseAnalyticsReadFilters)(req.query);
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
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Analytics overview is unavailable',
                code: 'analytics_overview_unavailable',
            });
        }
    });
    // Implements FR-19 / FR-21 / FR-23 / FR-25 / FR-26 and covers GH-AN-01 /
    // GH-AN-02 / GH-AN-03 / GH-AN-04 for read-only analytics graphs.
    app.get('/api/admin/analytics/timeseries', async (req, res) => {
        applyAdminNoStore(res);
        if (!requireAdminAnalyticsSession(req, res)) {
            return;
        }
        const parsed = (0, read_service_1.parseAnalyticsReadFilters)(req.query);
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
        }
        catch (err) {
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
    app.get('/api/admin/analytics/breakdowns', async (req, res) => {
        applyAdminNoStore(res);
        if (!requireAdminAnalyticsSession(req, res)) {
            return;
        }
        const parsed = (0, read_service_1.parseAnalyticsReadFilters)(req.query);
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
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'Analytics breakdowns are unavailable',
                code: 'analytics_breakdowns_unavailable',
            });
        }
    });
    // Admin sync (requires x-admin-key)
    app.post('/api/admin/datasets/sync', async (req, res) => {
        const key = req.headers['x-admin-key'];
        const expected = process.env.ADMIN_API_KEY;
        if (!expected || key !== expected) {
            res.status(401).json({ error: 'Missing or invalid admin key' });
            return;
        }
        try {
            const result = await deps.syncDatasets();
            res.json(result);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Sync failed' });
        }
    });
    // 404
    app.use((_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });
    // Error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err, _req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    });
    return app;
}
exports.default = createApp();
function isValidStoryLanguage(value) {
    return constants_1.ALLOWED_STORY_LANGUAGES.includes(value);
}
function isValidThemeList() {
    return constants_1.ALLOWED_THEMES.join(', ');
}
function queueAnalyticsEvent(recordEvent, event) {
    void Promise.resolve(recordEvent(event)).catch(() => undefined);
}
function applyAdminNoStore(res) {
    res.setHeader('Cache-Control', 'no-store');
}
function requireAdminAnalyticsSession(req, res) {
    if ((0, auth_1.hasValidAdminSession)(req)) {
        return true;
    }
    res.status(401).json({
        error: 'Admin authentication required',
        code: 'admin_auth_required',
    });
    return false;
}
//# sourceMappingURL=app.js.map