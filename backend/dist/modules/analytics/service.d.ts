import type { AnalyticsEventInput } from './types';
type ParseResult = {
    ok: true;
    event: AnalyticsEventInput;
} | {
    ok: false;
    code: string;
    error: string;
};
interface AnalyticsLogger {
    warn: (message: string, payload: Record<string, unknown>) => void;
}
export declare function recordAnalyticsEvent(input: AnalyticsEventInput): Promise<void>;
export declare function recordAnalyticsEventSafe(input: AnalyticsEventInput, logger?: AnalyticsLogger): Promise<boolean>;
export declare function parseFrontendAnalyticsEvent(payload: unknown): ParseResult;
export {};
//# sourceMappingURL=service.d.ts.map