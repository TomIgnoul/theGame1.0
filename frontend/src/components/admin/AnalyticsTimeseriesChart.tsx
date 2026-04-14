import type { AdminTimeseriesBucket } from '../../features/admin/types';
import {
  formatChartDate,
  getTimeseriesMaxValue,
} from '../../features/admin/utils';

/**
 * Supported FR IDs: FR-21, FR-23, FR-24, FR-26
 * Covered Gherkin IDs: GH-AN-01, GH-AN-03, GH-AN-04
 */
interface AnalyticsTimeseriesChartProps {
  buckets: AdminTimeseriesBucket[];
}

const CHART_WIDTH = 680;
const CHART_HEIGHT = 200;
const PADDING_X = 36;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 30;

export function AnalyticsTimeseriesChart({
  buckets,
}: AnalyticsTimeseriesChartProps) {
  const maxValue = getTimeseriesMaxValue(buckets);
  const plotWidth = CHART_WIDTH - PADDING_X * 2;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = buckets.length > 1 ? plotWidth / (buckets.length - 1) : 0;

  const routeGenerationPoints = buckets
    .map((bucket, index) => {
      const x = PADDING_X + stepX * index;
      const y =
        PADDING_TOP +
        plotHeight -
        (bucket.routeGenerations / maxValue) * plotHeight;

      return `${x},${y}`;
    })
    .join(' ');

  const routeStartPoints = buckets
    .map((bucket, index) => {
      const x = PADDING_X + stepX * index;
      const y =
        PADDING_TOP +
        plotHeight -
        (bucket.routeStarts / maxValue) * plotHeight;

      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className="admin-chart-card admin-chart-card--timeseries">
      <div className="admin-chart-card__header">
        <div>
          <p className="admin-chart-eyebrow">Timeseries</p>
          <h2 className="admin-chart-title">Route generations vs starts</h2>
        </div>
        <div className="admin-chart-legend">
          <span className="admin-chart-legend__item">
            <span className="admin-chart-legend__swatch admin-chart-legend__swatch--blue" />
            Route generations
          </span>
          <span className="admin-chart-legend__item">
            <span className="admin-chart-legend__swatch admin-chart-legend__swatch--green" />
            Route starts
          </span>
        </div>
      </div>

      <svg
        className="admin-timeseries-chart"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label="Timeseries chart showing route generations and route starts"
      >
        <line
          x1={PADDING_X}
          y1={PADDING_TOP + plotHeight}
          x2={CHART_WIDTH - PADDING_X}
          y2={PADDING_TOP + plotHeight}
          className="admin-chart-axis"
        />
        <line
          x1={PADDING_X}
          y1={PADDING_TOP}
          x2={PADDING_X}
          y2={PADDING_TOP + plotHeight}
          className="admin-chart-axis"
        />

        {[0, 0.5, 1].map((ratio) => {
          const y = PADDING_TOP + plotHeight - plotHeight * ratio;
          const label = Math.round(maxValue * ratio);

          return (
            <g key={ratio}>
              <line
                x1={PADDING_X}
                y1={y}
                x2={CHART_WIDTH - PADDING_X}
                y2={y}
                className="admin-chart-grid"
              />
              <text
                x={PADDING_X - 12}
                y={y + 4}
                className="admin-chart-label"
                textAnchor="end"
              >
                {label}
              </text>
            </g>
          );
        })}

        {buckets.map((bucket, index) => {
          const x = PADDING_X + stepX * index;
          return (
            <text
              key={bucket.date}
              x={x}
              y={CHART_HEIGHT - 8}
              className="admin-chart-label"
              textAnchor="middle"
            >
              {formatChartDate(bucket.date)}
            </text>
          );
        })}

        {buckets.length > 0 && (
          <>
            <polyline
              fill="none"
              points={routeGenerationPoints}
              className="admin-chart-line admin-chart-line--blue"
            />
            <polyline
              fill="none"
              points={routeStartPoints}
              className="admin-chart-line admin-chart-line--green"
            />
          </>
        )}
      </svg>
    </section>
  );
}
