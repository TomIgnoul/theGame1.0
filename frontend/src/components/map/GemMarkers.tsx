import { useEffect, useRef } from 'react';
import type { GemPin } from '../../types';

interface GemMarkersProps {
  map: google.maps.Map | null;
  gems: GemPin[];
  onSelectGem: (id: string) => void;
}

export function GemMarkers({ map, gems, onSelectGem }: GemMarkersProps) {
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const newMarkers = gems.map((gem) => {
      const marker = new google.maps.Marker({
        position: { lat: gem.latitude, lng: gem.longitude },
        map,
        title: gem.title,
      });
      marker.addListener('click', () => onSelectGem(gem.id));
      return marker;
    });

    markersRef.current = newMarkers;

    return () => {
      newMarkers.forEach((m) => m.setMap(null));
    };
  }, [map, gems, onSelectGem]);

  return null;
}
