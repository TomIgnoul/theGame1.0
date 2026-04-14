import type {
  AdminAnalyticsFilters,
  AdminBreakdownsResponse,
  AdminOverviewResponse,
  AdminTimeseriesResponse,
} from '../../features/admin/types';
import {
  toPoiChartRows,
  toThemeChartRows,
} from '../../features/admin/utils';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminErrorState } from './AdminErrorState';
import { AnalyticsBreakdownChart } from './AnalyticsBreakdownChart';
import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsKpiCards } from './AnalyticsKpiCards';
import { AnalyticsTimeseriesChart } from './AnalyticsTimeseriesChart';

/**
 * Supported FR IDs: FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-02, GH-AN-03, GH-AN-04
 */
interface AdminDashboardPageProps {
  filters: AdminAnalyticsFilters;
  overview: AdminOverviewResponse | undefined;
  timeseries: AdminTimeseriesResponse | undefined;
  breakdowns: AdminBreakdownsResponse | undefined;
  isLoading: boolean;
  isLoggingOut: boolean;
  errorMessage: string | null;
  onApplyFilters: (filters: AdminAnalyticsFilters) => void;
  onRetry: () => void;
  onLogout: () => Promise<void>;
}

export function AdminDashboardPage({
  filters,
  overview,
  timeseries,
  breakdowns,
  isLoading,
  isLoggingOut,
  errorMessage,
  onApplyFilters,
  onRetry,
  onLogout,
}: AdminDashboardPageProps) {
  const hasEmptyState =
    overview &&
    timeseries &&
    breakdowns &&
    !overview.hasData &&
    !timeseries.hasData &&
    !breakdowns.hasData;

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-eyebrow">Read-only analytics</p>
          <h1 className="admin-dashboard-title">Admin analytics portal</h1>
          <p className="admin-dashboard-copy">
            Monitor route usage, engagement, and breakdowns without exposing
            sensitive chat content.
          </p>
        </div>

        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
            void onLogout();
          }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out...' : 'Logout'}
        </button>
      </header>

      <AnalyticsFilters
        filters={filters}
        isBusy={isLoading || isLoggingOut}
        onApply={onApplyFilters}
      />

      {isLoading && (
        <section className="admin-state-card">
          <p className="admin-state-kicker">Loading</p>
          <h2 className="admin-state-title">Refreshing analytics</h2>
          <p className="admin-state-copy">
            Pulling KPI cards, trend data, and breakdown charts for the selected
            date range.
          </p>
        </section>
      )}

      {!isLoading && errorMessage && (
        <AdminErrorState description={errorMessage} onRetry={onRetry} />
      )}

      {!isLoading && !errorMessage && hasEmptyState && (
        <AdminEmptyState filters={filters} />
      )}

      {!isLoading &&
        !errorMessage &&
        !hasEmptyState &&
        overview &&
        timeseries &&
        breakdowns && (
          <div className="admin-dashboard-grid">
            <AnalyticsKpiCards overview={overview} />

            <div className="admin-dashboard-analytics-row">
              <div className="admin-dashboard-grid__timeseries">
                <AnalyticsTimeseriesChart buckets={timeseries.buckets} />
              </div>

              <div className="admin-dashboard-grid__breakdowns">
                <AnalyticsBreakdownChart
                  title="Theme breakdown"
                  subtitle="Total analytics events by theme"
                  rows={toThemeChartRows(breakdowns.themeBreakdown)}
                />

                <AnalyticsBreakdownChart
                  title="POI breakdown"
                  subtitle="Most active POIs across detail, story, and chat events"
                  rows={toPoiChartRows(breakdowns.poiBreakdown)}
                />
              </div>
            </div>
          </div>
        )}
    </main>
  );
}
