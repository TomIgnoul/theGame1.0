import type { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message: string;
}

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

export function createInMemoryRateLimit(options: RateLimitOptions) {
  const windows = new Map<string, RateLimitWindow>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
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
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000),
      );

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
