import { useEffect, useRef } from 'react';

interface RouteOverlayProps {
  map: google.maps.Map | null;
  polyline: string | null;
}

export function RouteOverlay({ map, polyline }: RouteOverlayProps) {
  const overlayRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (overlayRef.current) {
      overlayRef.current.setMap(null);
      overlayRef.current = null;
    }

    if (polyline) {
      const path = google.maps.geometry?.encoding?.decodePath(polyline);
      if (path) {
        const line = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 4,
        });
        line.setMap(map);
        overlayRef.current = line;

        const bounds = new google.maps.LatLngBounds();
        path.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 50);
      }
    }

    return () => {
      if (overlayRef.current) {
        overlayRef.current.setMap(null);
      }
    };
  }, [map, polyline]);

  return null;
}
