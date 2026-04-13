import type { AdminOverviewResponse } from '../../features/admin/types';
import { formatCompactNumber } from '../../features/admin/utils';

/**
 * Supported FR IDs: FR-20, FR-24, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-04
 */
interface AnalyticsKpiCardsProps {
  overview: AdminOverviewResponse;
}

const KPI_DEFINITIONS = [
  {
    key: 'routeGenerations',
    label: 'Route generations',
  },
  {
    key: 'routeStarts',
    label: 'Route starts',
  },
  {
    key: 'routeFailures',
    label: 'Route failures',
  },
  {
    key: 'poiDetailViews',
    label: 'POI detail views',
  },
  {
    key: 'chatSends',
    label: 'Chat sends',
  },
] as const;

export function AnalyticsKpiCards({ overview }: AnalyticsKpiCardsProps) {
  return (
    <section className="admin-kpi-grid" aria-label="Analytics KPIs">
      {KPI_DEFINITIONS.map(({ key, label }) => (
        <article key={key} className="admin-kpi-card">
          <p className="admin-kpi-label">{label}</p>
          <p className="admin-kpi-value">
            {formatCompactNumber(overview.kpis[key])}
          </p>
        </article>
      ))}
    </section>
  );
}
