import type { NextFunction, Request, Response } from 'express';
interface RateLimitOptions {
    maxRequests: number;
    windowMs: number;
    message: string;
}
export declare function createInMemoryRateLimit(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=simpleRateLimit.d.ts.map