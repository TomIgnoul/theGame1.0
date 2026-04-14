import type { AdminAnalyticsFilters } from '../../features/admin/types';

/**
 * Supported FR IDs: FR-20, FR-21, FR-22, FR-23, FR-24, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-03, GH-AN-04
 */
interface AdminEmptyStateProps {
  filters: AdminAnalyticsFilters;
}

export function AdminEmptyState({ filters }: AdminEmptyStateProps) {
  return (
    <section className="admin-state-card">
      <p className="admin-state-kicker">Empty dataset</p>
      <h2 className="admin-state-title">No analytics found for this range</h2>
      <p className="admin-state-copy">
        Try a wider date range or remove the theme filter to pull in more
        analytics records.
      </p>
      <dl className="admin-empty-meta">
        <div>
          <dt>From</dt>
          <dd>{filters.from}</dd>
        </div>
        <div>
          <dt>To</dt>
          <dd>{filters.to}</dd>
        </div>
        <div>
          <dt>Theme</dt>
          <dd>{filters.theme ?? 'All themes'}</dd>
        </div>
      </dl>
    </section>
  );
}
