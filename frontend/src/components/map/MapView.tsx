import { useEffect, useRef, useState, type MouseEventHandler } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouteStore } from '../../store/routeStore';
import { useGemDetailStore } from '../../store/gemDetailStore';
import { gemsApi } from '../../api/client';
import { GemMarkers } from './GemMarkers';
import { RouteOverlay } from './RouteOverlay';
import { decodePolyline } from '../../utils/polyline';

declare global {
  interface Window {
    google?: typeof google;
    initMap?: () => void;
  }
}

const MAP_BOUNDS = {
  minLat: 50.79,
  maxLat: 50.92,
  minLng: 4.25,
  maxLng: 4.48,
};

export function MapView() {
  const ref = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { theme, start, end, mapClickMode, routeResult, setStart, setEnd, setMapClickMode } = useRouteStore();
  const { setSelectedGemId } = useGemDetailStore();

  const { data } = useQuery({
    queryKey: ['gems', theme],
    queryFn: () => gemsApi.list(theme),
  });

  const gems = data?.items ?? [];
  const hasMapsKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const routePath = routeResult?.polyline ? decodePolyline(routeResult.polyline) : [];

  useEffect(() => {
    if (!hasMapsKey || !ref.current) return;

    if (window.google?.maps?.Map) {
      const m = new google.maps.Map(ref.current, {
        center: { lat: 50.8467, lng: 4.3525 },
        zoom: 14,
      });
      setMap(m);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (ref.current && window.google?.maps?.Map) {
        const m = new google.maps.Map(ref.current, {
          center: { lat: 50.8467, lng: 4.3525 },
          zoom: 14,
        });
        setMap(m);
      }
    };
    document.head.appendChild(script);
  }, [hasMapsKey]);

  useEffect(() => {
    if (map && start) {
      map.panTo({ lat: start.lat, lng: start.lng });
    }
  }, [map, start]);

  useEffect(() => {
    if (!map || !mapClickMode) return;
    const listener = (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat != null && lng != null) {
        if (mapClickMode === 'start') setStart({ lat, lng });
        else setEnd({ lat, lng });
        setMapClickMode(null);
      }
    };
    const handle = map.addListener('click', listener);
    return () => google.maps.event.removeListener(handle);
  }, [map, mapClickMode, setStart, setEnd, setMapClickMode]);

  useEffect(() => {
    if (!map || !window.google?.maps?.Marker) return;

    const markers: google.maps.Marker[] = [];

    if (start) {
      markers.push(
        new google.maps.Marker({
          map,
          position: start,
          title: 'Start',
          label: 'S',
        })
      );
    }

    if (end) {
      markers.push(
        new google.maps.Marker({
          map,
          position: end,
          title: 'End',
          label: 'E',
        })
      );
    }

    return () => {
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, start, end]);

  const handleFallbackMapClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!mapClickMode || !fallbackRef.current) return;

    const rect = fallbackRef.current.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;

    const lat = MAP_BOUNDS.maxLat - yRatio * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
    const lng = MAP_BOUNDS.minLng + xRatio * (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);

    if (mapClickMode === 'start') setStart({ lat, lng });
    else setEnd({ lat, lng });

    setMapClickMode(null);
  };

  const toFallbackPoint = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100;
    const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
    return { x, y };
  };

  const startPoint = start ? toFallbackPoint(start.lat, start.lng) : null;
  const endPoint = end ? toFallbackPoint(end.lat, end.lng) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      {mapClickMode && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 2,
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: 6,
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
          }}
        >
          Click on the map to set {mapClickMode === 'start' ? 'the start point' : 'the end point'}.
        </div>
      )}

      <div
        id="route-map"
        ref={ref}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          backgroundColor: '#e5e7eb',
        }}
      />
      {hasMapsKey && map && (
        <>
          <GemMarkers map={map} gems={gems} onSelectGem={setSelectedGemId} />
          <RouteOverlay map={map} polyline={routeResult?.polyline ?? null} />
        </>
      )}
      {!hasMapsKey && (
        <div
          ref={fallbackRef}
          onClick={handleFallbackMapClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            color: '#374151',
            padding: '1rem',
            background:
              'radial-gradient(circle at 20% 20%, rgba(147,197,253,0.3), transparent 45%), radial-gradient(circle at 80% 60%, rgba(110,231,183,0.35), transparent 40%), #f3f4f6',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Map preview mode (no Google Maps key configured)</p>
          <p style={{ margin: '0.375rem 0', fontSize: '0.875rem' }}>
            You can still click the map to set start/end points and preview generated routes.
          </p>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
            {gems.length === 0
              ? `No gems for theme "${theme}". Try another theme or run admin sync.`
              : `${gems.length} gems for theme "${theme}"`}
          </p>

          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            {routePath.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth={1}
                points={routePath
                  .map((point) => {
                    const projected = toFallbackPoint(point.lat, point.lng);
                    return `${projected.x},${projected.y}`;
                  })
                  .join(' ')}
              />
            )}
            {startPoint && <circle cx={startPoint.x} cy={startPoint.y} r={1.8} fill="#16a34a" />}
            {endPoint && <circle cx={endPoint.x} cy={endPoint.y} r={1.8} fill="#dc2626" />}
          </svg>
        </div>
      )}
    </div>
  );
}
