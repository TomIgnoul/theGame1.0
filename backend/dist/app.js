"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Health
app.get('/api/health', async (_req, res) => {
    const db = await (0, db_1.ping)();
    res.json({ ok: true, db });
});
// Gems
app.get('/api/gems', async (req, res) => {
    const theme = req.query.theme;
    if (theme) {
        const { isValidTheme } = await Promise.resolve().then(() => __importStar(require('./modules/gems/gems.repo')));
        if (!isValidTheme(theme)) {
            res.status(400).json({ error: 'Invalid theme value' });
            return;
        }
    }
    const { findByTheme } = await Promise.resolve().then(() => __importStar(require('./modules/gems/gems.repo')));
    const items = await findByTheme(theme);
    res.json({ items });
});
app.get('/api/gems/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    const { findById } = await Promise.resolve().then(() => __importStar(require('./modules/gems/gems.repo')));
    const gem = await findById(id);
    if (!gem) {
        res.status(404).json({ error: 'Gem not found' });
        return;
    }
    res.json(gem);
});
// Routes
app.post('/api/routes', async (req, res) => {
    try {
        const body = req.body;
        const { generateRoute } = await Promise.resolve().then(() => __importStar(require('./modules/routes/routes.service')));
        const result = await generateRoute({
            theme: body.theme ?? 'Culture',
            kmTarget: body.kmTarget ?? 8,
            shape: body.shape ?? 'loop',
            start: body.start ?? { lat: 50.8467, lng: 4.3525 },
            end: body.end,
        });
        res.json(result);
    }
    catch (err) {
        const e = err;
        const status = e.status ?? 500;
        res.status(status).json({
            error: e.message ?? 'Route generation failed',
            code: e.code,
        });
    }
});
// Story
app.post('/api/gems/:id/story', async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        res.status(400).json({ error: 'Invalid ID format' });
        return;
    }
    const body = (req.body || {});
    const theme = body.theme ?? 'Culture';
    const language = body.language ?? 'en';
    try {
        const { getOrCreateStory } = await Promise.resolve().then(() => __importStar(require('./modules/stories/stories.service')));
        const result = await getOrCreateStory(id, theme, language);
        if (!result) {
            res.status(404).json({ error: 'Gem not found' });
            return;
        }
        res.json(result);
    }
    catch (err) {
        console.error(err);
        res.status(502).json({ error: 'Story generation failed' });
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
        const { syncDatasets } = await Promise.resolve().then(() => __importStar(require('./modules/admin/sync.service')));
        const result = await syncDatasets();
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
exports.default = app;
//# sourceMappingURL=app.js.map