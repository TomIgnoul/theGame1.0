import { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { ALLOWED_THEMES } from '../../constants';
import { analyticsApi, routesApi } from '../../api/client';

const THEMES = [...ALLOWED_THEMES];

export function RouteConfigPanel() {
  const { theme, kmTarget, shape, start, end, mapClickMode, routeResult, setTheme, setKmTarget, setShape, setStart, setRouteResult, setMapClickMode } = useRouteStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walkStarted, setWalkStarted] = useState(false);

  const focusMap = () => {
    document.getElementById('route-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerate = async () => {
    if (!start) {
      setError('Please set start point on the map');
      return;
    }
    if (shape === 'a_to_b' && !end) {
      setError('Please set end point on the map for A to B route');
      return;
    }
    setError(null);
    setWalkStarted(false);
    setLoading(true);
    try {
      const result = await routesApi.generate({
        theme,
        kmTarget,
        shape,
        start,
        end: shape === 'a_to_b' ? end ?? undefined : null,
      });
      setRouteResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate route');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (nextTheme: string) => {
    setTheme(nextTheme);
    void analyticsApi.capture({
      eventType: 'filter_applied',
      theme: nextTheme,
    }).catch(() => undefined);
  };

  const handleStartWalk = async () => {
    if (!routeResult || walkStarted) {
      return;
    }

    setWalkStarted(true);
    void analyticsApi.capture({
      eventType: 'route_started',
      theme,
      metadata: {
        shape: routeResult.shape,
        kmTarget: routeResult.kmTarget,
        kmResult: routeResult.kmResult,
        gemCount: routeResult.gems.length,
      },
    }).catch(() => undefined);
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Route config</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          Theme
        </label>
        <select
          value={theme}
          onChange={(e) => {
            void handleThemeChange(e.target.value);
          }}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          Distance (km)
        </label>
        <input
          type="number"
          min={1}
          max={15}
          value={kmTarget}
          onChange={(e) => setKmTarget(Number(e.target.value) || 8)}
          style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          Start point
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setMapClickMode('start');
              focusMap();
            }}
            style={{ flex: 1, padding: '0.5rem' }}
          >
            {start ? `${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}` : 'Click map'}
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.geolocation?.getCurrentPosition(
                (p) => setStart({ lat: p.coords.latitude, lng: p.coords.longitude }),
                () => setError('Location denied or unavailable')
              );
            }}
            style={{ padding: '0.5rem' }}
            title="Use my location"
          >
            📍
          </button>
        </div>
      </div>

      {shape === 'a_to_b' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            End point
          </label>
          <button
            type="button"
            onClick={() => {
              setMapClickMode('end');
              focusMap();
            }}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {end ? `End: ${end.lat.toFixed(4)}, ${end.lng.toFixed(4)}` : 'Click map to set end'}
          </button>
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
          Shape
        </label>
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as 'loop' | 'a_to_b')}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="loop">Loop</option>
          <option value="a_to_b">A to B</option>
        </select>
      </div>

      {mapClickMode && (
        <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#1d4ed8' }}>
          Waiting for map click to set {mapClickMode === 'start' ? 'start' : 'end'} point...
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !start || (shape === 'a_to_b' && !end)}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Generate route'}
      </button>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
      )}

      {routeResult && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: 4 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Route: {routeResult.kmResult} km</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#166534' }}>
            {routeResult.gems.length} gems
          </p>
          <button
            type="button"
            onClick={() => {
              void handleStartWalk();
            }}
            disabled={walkStarted}
            style={{
              marginTop: '0.75rem',
              width: '100%',
              padding: '0.6rem 0.75rem',
              background: walkStarted ? '#94a3b8' : '#0f766e',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: walkStarted ? 'not-allowed' : 'pointer',
            }}
          >
            {walkStarted ? 'Walk started' : 'Start walk'}
          </button>
          {routeResult.warnings.length > 0 && (
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#854d0e' }}>
              {routeResult.warnings.join('; ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
