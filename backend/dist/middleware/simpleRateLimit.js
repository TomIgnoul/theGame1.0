"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInMemoryRateLimit = createInMemoryRateLimit;
function createInMemoryRateLimit(options) {
    const windows = new Map();
    return function rateLimit(req, res, next) {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const existing = windows.get(key);
        if (!existing || existing.resetAt <= now) {
            windows.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            next();
            return;
        }
        if (existing.count >= options.maxRequests) {
            const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
            res.setHeader('Retry-After', retryAfterSeconds.toString());
            res.status(429).json({
                error: options.message,
                code: 'rate_limited',
            });
            return;
        }
        existing.count += 1;
        next();
    };
}
//# sourceMappingURL=simpleRateLimit.js.map