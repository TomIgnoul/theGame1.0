import type {
  AdminAnalyticsFilters,
  AdminPoiBreakdownRow,
  AdminThemeBreakdownRow,
  AdminTimeseriesBucket,
} from './types';

const DEFAULT_RANGE_DAYS = 6;

export function getDefaultAdminAnalyticsFilters(): AdminAnalyticsFilters {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - DEFAULT_RANGE_DAYS);

  return {
    from: toIsoDate(fromDate),
    to: toIsoDate(toDate),
    theme: null,
  };
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatChartDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function toThemeChartRows(rows: AdminThemeBreakdownRow[]) {
  return rows.slice(0, 8).map((row) => ({
    id: row.theme ?? 'unknown-theme',
    label: row.theme ?? 'Unknown theme',
    value: row.totalEvents,
    detail: `${formatCompactNumber(row.routeGenerations)} routes · ${formatCompactNumber(row.routeStarts)} starts`,
  }));
}

export function toPoiChartRows(rows: AdminPoiBreakdownRow[]) {
  return rows.slice(0, 8).map((row) => ({
    id: row.poiId,
    label: row.title,
    value: row.totalEvents,
    detail: `${row.theme ?? 'Unknown theme'} · ${formatCompactNumber(row.chatSends)} chats`,
  }));
}

export function getTimeseriesMaxValue(buckets: AdminTimeseriesBucket[]) {
  return Math.max(
    1,
    ...buckets.flatMap((bucket) => [
      bucket.routeGenerations,
      bucket.routeStarts,
    ]),
  );
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
