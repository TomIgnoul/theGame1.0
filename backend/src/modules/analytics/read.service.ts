import { ALLOWED_THEMES } from '../../config/constants';
import {
  fetchAnalyticsOverview,
  fetchAnalyticsPoiBreakdown,
  fetchAnalyticsThemeBreakdown,
  fetchAnalyticsTimeseries,
} from './read.repo';
import type {
  AnalyticsBreakdownsResponse,
  AnalyticsOverviewResponse,
  AnalyticsReadFilters,
  AnalyticsTimeseriesResponse,
} from './read.types';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ParseResult =
  | { ok: true; filters: AnalyticsReadFilters }
  | { ok: false; code: string; error: string };

// Implements FR-19, FR-20, FR-21, FR-22, FR-23, FR-25, and FR-26 while
// covering GH-AN-01, GH-AN-02, GH-AN-03, and GH-AN-04 for the read-only
// analytics admin portal contract.
export function parseAnalyticsReadFilters(query: unknown): ParseResult {
  if (!isRecord(query)) {
    return invalidFilters('Query parameters are required');
  }

  const from = getSingleQueryParam(query.from);
  const to = getSingleQueryParam(query.to);
  const theme = getSingleQueryParam(query.theme);

  if (!from || !isIsoDate(from)) {
    return invalidFilters('from is required and must be YYYY-MM-DD');
  }

  if (!to || !isIsoDate(to)) {
    return invalidFilters('to is required and must be YYYY-MM-DD');
  }

  if (from > to) {
    return invalidFilters('from must be on or before to');
  }

  if (theme && !ALLOWED_THEMES.some((allowedTheme) => allowedTheme === theme)) {
    return invalidFilters(
      `theme must be one of: ${ALLOWED_THEMES.join(', ')}`,
    );
  }

  return {
    ok: true,
    filters: {
      from,
      to,
      theme: theme ?? null,
    },
  };
}

export async function getAnalyticsOverview(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsOverviewResponse> {
  const kpis = await fetchAnalyticsOverview(filters);

  return {
    filters,
    hasData: Object.values(kpis).some((value) => value > 0),
    kpis,
  };
}

export async function getAnalyticsTimeseries(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsTimeseriesResponse> {
  const buckets = await fetchAnalyticsTimeseries(filters);

  return {
    filters,
    hasData: buckets.some(
      (bucket) => bucket.routeGenerations > 0 || bucket.routeStarts > 0,
    ),
    buckets,
  };
}

export async function getAnalyticsBreakdowns(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsBreakdownsResponse> {
  const [themeBreakdown, poiBreakdown] = await Promise.all([
    fetchAnalyticsThemeBreakdown(filters),
    fetchAnalyticsPoiBreakdown(filters),
  ]);

  return {
    filters,
    hasData:
      themeBreakdown.some((row) => row.totalEvents > 0) ||
      poiBreakdown.some((row) => row.totalEvents > 0),
    themeBreakdown,
    poiBreakdown,
  };
}

function invalidFilters(error: string): ParseResult {
  return {
    ok: false,
    code: 'invalid_analytics_filters',
    error,
  };
}

function getSingleQueryParam(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    const trimmed = value[0].trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function isIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
