/**
 * Supported FR IDs: FR-22, FR-23, FR-24, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-03, GH-AN-04
 */
interface AnalyticsBreakdownChartRow {
  id: string;
  label: string;
  value: number;
  detail: string;
}

interface AnalyticsBreakdownChartProps {
  title: string;
  subtitle: string;
  rows: AnalyticsBreakdownChartRow[];
}

export function AnalyticsBreakdownChart({
  title,
  subtitle,
  rows,
}: AnalyticsBreakdownChartProps) {
  const maxValue = Math.max(1, ...rows.map((row) => row.value));

  return (
    <section className="admin-chart-card">
      <div className="admin-chart-card__header">
        <div>
          <p className="admin-chart-eyebrow">Breakdown</p>
          <h2 className="admin-chart-title">{title}</h2>
        </div>
        <p className="admin-chart-subtitle">{subtitle}</p>
      </div>

      {rows.length === 0 ? (
        <p className="admin-chart-subtitle">
          No breakdown rows are available for the current filter selection.
        </p>
      ) : (
        <div className="admin-breakdown-list">
          {rows.map((row) => (
            <article key={row.id} className="admin-breakdown-row">
              <div className="admin-breakdown-row__meta">
                <p className="admin-breakdown-row__label">{row.label}</p>
                <p className="admin-breakdown-row__detail">{row.detail}</p>
              </div>

              <div className="admin-breakdown-row__bar-shell">
                <div
                  className="admin-breakdown-row__bar-fill"
                  style={{
                    width: `${(row.value / maxValue) * 100}%`,
                  }}
                />
              </div>

              <p className="admin-breakdown-row__value">{row.value}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
