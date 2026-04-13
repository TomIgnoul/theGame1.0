import { pool } from '../../db';
import type {
  AnalyticsOverviewKpis,
  AnalyticsPoiBreakdownRow,
  AnalyticsReadFilters,
  AnalyticsThemeBreakdownRow,
  AnalyticsTimeseriesBucket,
} from './read.types';

interface OverviewRow {
  route_generations: string;
  route_starts: string;
  route_failures: string;
  poi_detail_views: string;
  chat_sends: string;
}

interface TimeseriesRow {
  bucket_date: Date | string;
  route_generations: string;
  route_starts: string;
}

interface ThemeBreakdownRow {
  theme: string | null;
  total_events: string;
  route_generations: string;
  route_starts: string;
  route_failures: string;
  filter_applies: string;
  poi_detail_views: string;
  story_generations: string;
  chat_opens: string;
  chat_sends: string;
}

interface PoiBreakdownRow {
  poi_id: string;
  title: string | null;
  theme: string | null;
  total_events: string;
  poi_detail_views: string;
  story_generations: string;
  chat_opens: string;
  chat_sends: string;
}

export async function fetchAnalyticsOverview(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsOverviewKpis> {
  const result = await pool.query<OverviewRow>(
    `SELECT
       COUNT(*) FILTER (WHERE e.event_type = 'route_generated') AS route_generations,
       COUNT(*) FILTER (WHERE e.event_type = 'route_started') AS route_starts,
       COUNT(*) FILTER (WHERE e.event_type = 'route_generation_failed') AS route_failures,
       COUNT(*) FILTER (WHERE e.event_type = 'poi_detail_opened') AS poi_detail_views,
       COUNT(*) FILTER (WHERE e.event_type = 'stop_chat_sent') AS chat_sends
     FROM analytics_events e
     LEFT JOIN gems g ON g.id = e.poi_id
     WHERE e.occurred_at >= $1::date
       AND e.occurred_at < ($2::date + INTERVAL '1 day')
       AND ($3::text IS NULL OR COALESCE(e.theme, g.theme) = $3)`,
    [filters.from, filters.to, filters.theme],
  );

  const row = result.rows[0];

  return {
    routeGenerations: toNumber(row?.route_generations),
    routeStarts: toNumber(row?.route_starts),
    routeFailures: toNumber(row?.route_failures),
    poiDetailViews: toNumber(row?.poi_detail_views),
    chatSends: toNumber(row?.chat_sends),
  };
}

export async function fetchAnalyticsTimeseries(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsTimeseriesBucket[]> {
  const result = await pool.query<TimeseriesRow>(
    `WITH days AS (
       SELECT generate_series($1::date, $2::date, INTERVAL '1 day')::date AS bucket_date
     ),
     aggregates AS (
       SELECT
         date_trunc('day', e.occurred_at)::date AS bucket_date,
         COUNT(*) FILTER (WHERE e.event_type = 'route_generated') AS route_generations,
         COUNT(*) FILTER (WHERE e.event_type = 'route_started') AS route_starts
       FROM analytics_events e
       LEFT JOIN gems g ON g.id = e.poi_id
       WHERE e.occurred_at >= $1::date
         AND e.occurred_at < ($2::date + INTERVAL '1 day')
         AND ($3::text IS NULL OR COALESCE(e.theme, g.theme) = $3)
       GROUP BY 1
     )
     SELECT
       days.bucket_date,
       COALESCE(aggregates.route_generations, 0) AS route_generations,
       COALESCE(aggregates.route_starts, 0) AS route_starts
     FROM days
     LEFT JOIN aggregates USING (bucket_date)
     ORDER BY days.bucket_date ASC`,
    [filters.from, filters.to, filters.theme],
  );

  return result.rows.map((row) => ({
    date: toIsoDate(row.bucket_date),
    routeGenerations: toNumber(row.route_generations),
    routeStarts: toNumber(row.route_starts),
  }));
}

export async function fetchAnalyticsThemeBreakdown(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsThemeBreakdownRow[]> {
  const result = await pool.query<ThemeBreakdownRow>(
    `SELECT
       COALESCE(e.theme, g.theme) AS theme,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE e.event_type = 'route_generated') AS route_generations,
       COUNT(*) FILTER (WHERE e.event_type = 'route_started') AS route_starts,
       COUNT(*) FILTER (WHERE e.event_type = 'route_generation_failed') AS route_failures,
       COUNT(*) FILTER (WHERE e.event_type = 'filter_applied') AS filter_applies,
       COUNT(*) FILTER (WHERE e.event_type = 'poi_detail_opened') AS poi_detail_views,
       COUNT(*) FILTER (WHERE e.event_type = 'story_generated') AS story_generations,
       COUNT(*) FILTER (WHERE e.event_type = 'stop_chat_opened') AS chat_opens,
       COUNT(*) FILTER (WHERE e.event_type = 'stop_chat_sent') AS chat_sends
     FROM analytics_events e
     LEFT JOIN gems g ON g.id = e.poi_id
     WHERE e.occurred_at >= $1::date
       AND e.occurred_at < ($2::date + INTERVAL '1 day')
       AND ($3::text IS NULL OR COALESCE(e.theme, g.theme) = $3)
     GROUP BY 1
     ORDER BY total_events DESC, theme ASC NULLS LAST`,
    [filters.from, filters.to, filters.theme],
  );

  return result.rows.map((row) => ({
    theme: row.theme,
    totalEvents: toNumber(row.total_events),
    routeGenerations: toNumber(row.route_generations),
    routeStarts: toNumber(row.route_starts),
    routeFailures: toNumber(row.route_failures),
    filterApplies: toNumber(row.filter_applies),
    poiDetailViews: toNumber(row.poi_detail_views),
    storyGenerations: toNumber(row.story_generations),
    chatOpens: toNumber(row.chat_opens),
    chatSends: toNumber(row.chat_sends),
  }));
}

export async function fetchAnalyticsPoiBreakdown(
  filters: AnalyticsReadFilters,
): Promise<AnalyticsPoiBreakdownRow[]> {
  const result = await pool.query<PoiBreakdownRow>(
    `SELECT
       e.poi_id::text AS poi_id,
       MAX(g.title) AS title,
       COALESCE(MAX(e.theme), MAX(g.theme)) AS theme,
       COUNT(*) AS total_events,
       COUNT(*) FILTER (WHERE e.event_type = 'poi_detail_opened') AS poi_detail_views,
       COUNT(*) FILTER (WHERE e.event_type = 'story_generated') AS story_generations,
       COUNT(*) FILTER (WHERE e.event_type = 'stop_chat_opened') AS chat_opens,
       COUNT(*) FILTER (WHERE e.event_type = 'stop_chat_sent') AS chat_sends
     FROM analytics_events e
     LEFT JOIN gems g ON g.id = e.poi_id
     WHERE e.poi_id IS NOT NULL
       AND e.occurred_at >= $1::date
       AND e.occurred_at < ($2::date + INTERVAL '1 day')
       AND ($3::text IS NULL OR COALESCE(e.theme, g.theme) = $3)
     GROUP BY e.poi_id
     ORDER BY total_events DESC, title ASC NULLS LAST, e.poi_id ASC`,
    [filters.from, filters.to, filters.theme],
  );

  return result.rows.map((row) => ({
    poiId: row.poi_id,
    title: row.title ?? 'Unknown POI',
    theme: row.theme,
    totalEvents: toNumber(row.total_events),
    poiDetailViews: toNumber(row.poi_detail_views),
    storyGenerations: toNumber(row.story_generations),
    chatOpens: toNumber(row.chat_opens),
    chatSends: toNumber(row.chat_sends),
  }));
}

function toNumber(value: string | undefined) {
  return value ? Number(value) : 0;
}

function toIsoDate(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value.slice(0, 10);
}
