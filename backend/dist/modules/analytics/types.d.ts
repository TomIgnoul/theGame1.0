export declare const ANALYTICS_EVENT_TYPES: readonly ["route_generated", "route_generation_failed", "route_started", "poi_detail_opened", "filter_applied", "story_generated", "stop_chat_opened", "stop_chat_sent"];
export declare const FRONTEND_ANALYTICS_EVENT_TYPES: readonly ["filter_applied", "route_started", "stop_chat_opened"];
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
export type FrontendAnalyticsEventType = (typeof FRONTEND_ANALYTICS_EVENT_TYPES)[number];
export type AnalyticsEventSource = 'backend' | 'frontend';
export type AnalyticsMetadataValue = string | number | boolean | null;
export type AnalyticsMetadata = Record<string, AnalyticsMetadataValue>;
export interface AnalyticsEventInput {
    eventType: AnalyticsEventType;
    routeId?: string | null;
    poiId?: string | null;
    stopNumber?: number | null;
    theme?: string | null;
    resultStatus?: string | null;
    source: AnalyticsEventSource;
    metadata?: AnalyticsMetadata | null;
}
export interface StoredAnalyticsEvent extends AnalyticsEventInput {
    metadata: AnalyticsMetadata | null;
}
//# sourceMappingURL=types.d.ts.map