import type { AnalyticsBreakdownsResponse, AnalyticsOverviewResponse, AnalyticsReadFilters, AnalyticsTimeseriesResponse } from './read.types';
type ParseResult = {
    ok: true;
    filters: AnalyticsReadFilters;
} | {
    ok: false;
    code: string;
    error: string;
};
export declare function parseAnalyticsReadFilters(query: unknown): ParseResult;
export declare function getAnalyticsOverview(filters: AnalyticsReadFilters): Promise<AnalyticsOverviewResponse>;
export declare function getAnalyticsTimeseries(filters: AnalyticsReadFilters): Promise<AnalyticsTimeseriesResponse>;
export declare function getAnalyticsBreakdowns(filters: AnalyticsReadFilters): Promise<AnalyticsBreakdownsResponse>;
export {};
//# sourceMappingURL=read.service.d.ts.map