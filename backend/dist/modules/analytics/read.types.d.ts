export interface AnalyticsReadFilters {
    from: string;
    to: string;
    theme: string | null;
}
export interface AnalyticsOverviewKpis {
    routeGenerations: number;
    routeStarts: number;
    routeFailures: number;
    poiDetailViews: number;
    chatSends: number;
}
export interface AnalyticsOverviewResponse {
    filters: AnalyticsReadFilters;
    hasData: boolean;
    kpis: AnalyticsOverviewKpis;
}
export interface AnalyticsTimeseriesBucket {
    date: string;
    routeGenerations: number;
    routeStarts: number;
}
export interface AnalyticsTimeseriesResponse {
    filters: AnalyticsReadFilters;
    hasData: boolean;
    buckets: AnalyticsTimeseriesBucket[];
}
export interface AnalyticsThemeBreakdownRow {
    theme: string | null;
    totalEvents: number;
    routeGenerations: number;
    routeStarts: number;
    routeFailures: number;
    filterApplies: number;
    poiDetailViews: number;
    storyGenerations: number;
    chatOpens: number;
    chatSends: number;
}
export interface AnalyticsPoiBreakdownRow {
    poiId: string;
    title: string;
    theme: string | null;
    totalEvents: number;
    poiDetailViews: number;
    storyGenerations: number;
    chatOpens: number;
    chatSends: number;
}
export interface AnalyticsBreakdownsResponse {
    filters: AnalyticsReadFilters;
    hasData: boolean;
    themeBreakdown: AnalyticsThemeBreakdownRow[];
    poiBreakdown: AnalyticsPoiBreakdownRow[];
}
//# sourceMappingURL=read.types.d.ts.map