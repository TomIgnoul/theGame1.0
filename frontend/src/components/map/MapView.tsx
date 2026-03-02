import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouteStore } from '../../store/routeStore';
import { useGemDetailStore } from '../../store/gemDetailStore';
import { gemsApi } from '../../api/client';
import { GemMarkers } from './GemMarkers';
import { RouteOverlay } from './RouteOverlay';

declare global {
  interface Window {
    google?: typeof google;
    initMap?: () => void;
  }
}

export function MapView() {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { theme, start, mapClickMode, routeResult, setStart, setEnd, setMapClickMode } = useRouteStore();
  const { setSelectedGemId } = useGemDetailStore();

  const { data } = useQuery({
    queryKey: ['gems', theme],
    queryFn: () => gemsApi.list(theme),
  });

  const gems = data?.items ?? [];
  const hasMapsKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      <div
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
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            padding: '1rem',
            overflowY: 'auto',
          }}
        >
          <p>Set VITE_GOOGLE_MAPS_API_KEY for Google Maps</p>
          <p style={{ fontSize: '0.875rem' }}>
            {gems.length === 0
              ? `No gems for theme "${theme}". Try another theme or run admin sync.`
              : `${gems.length} gems for theme "${theme}"`}
          </p>
          <div style={{ marginTop: '1rem', textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
            {gems.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGemId(g.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.5rem',
                  textAlign: 'left',
                  border: 'none',
                  background: 'white',
                  cursor: 'pointer',
                  borderRadius: 4,
                  marginBottom: 2,
                }}
              >
                {g.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
