export interface AdminAnalyticsFilters {
  from: string;
  to: string;
  theme: string | null;
}

export interface AdminOverviewResponse {
  filters: AdminAnalyticsFilters;
  hasData: boolean;
  kpis: {
    routeGenerations: number;
    routeStarts: number;
    routeFailures: number;
    poiDetailViews: number;
    chatSends: number;
  };
}

export interface AdminTimeseriesBucket {
  date: string;
  routeGenerations: number;
  routeStarts: number;
}

export interface AdminTimeseriesResponse {
  filters: AdminAnalyticsFilters;
  hasData: boolean;
  buckets: AdminTimeseriesBucket[];
}

export interface AdminThemeBreakdownRow {
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

export interface AdminPoiBreakdownRow {
  poiId: string;
  title: string;
  theme: string | null;
  totalEvents: number;
  poiDetailViews: number;
  storyGenerations: number;
  chatOpens: number;
  chatSends: number;
}

export interface AdminBreakdownsResponse {
  filters: AdminAnalyticsFilters;
  hasData: boolean;
  themeBreakdown: AdminThemeBreakdownRow[];
  poiBreakdown: AdminPoiBreakdownRow[];
}
