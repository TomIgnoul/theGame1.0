import type { Request, Response } from 'express';
export declare function isAdminAuthConfigured(): boolean;
export declare function verifyAdminPassphrase(passphrase: string): boolean;
export declare function issueAdminSessionCookie(req: Request, res: Response): void;
export declare function clearAdminSessionCookie(req: Request, res: Response): void;
export declare function hasValidAdminSession(req: Request): boolean;
//# sourceMappingURL=auth.d.ts.map