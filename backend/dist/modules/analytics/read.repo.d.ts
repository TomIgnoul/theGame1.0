import type { AnalyticsOverviewKpis, AnalyticsPoiBreakdownRow, AnalyticsReadFilters, AnalyticsThemeBreakdownRow, AnalyticsTimeseriesBucket } from './read.types';
export declare function fetchAnalyticsOverview(filters: AnalyticsReadFilters): Promise<AnalyticsOverviewKpis>;
export declare function fetchAnalyticsTimeseries(filters: AnalyticsReadFilters): Promise<AnalyticsTimeseriesBucket[]>;
export declare function fetchAnalyticsThemeBreakdown(filters: AnalyticsReadFilters): Promise<AnalyticsThemeBreakdownRow[]>;
export declare function fetchAnalyticsPoiBreakdown(filters: AnalyticsReadFilters): Promise<AnalyticsPoiBreakdownRow[]>;
//# sourceMappingURL=read.repo.d.ts.map