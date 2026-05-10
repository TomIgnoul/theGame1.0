import { useEffect, useRef } from 'react';
import pearlMarkerIcon from '../../assets/pearl-marker.svg';
import type { GemPin } from '../../types';
import { isAdminCreatedPearl } from './markerUtils';

interface GemMarkersProps {
  map: google.maps.Map | null;
  gems: GemPin[];
  onSelectGem: (id: string) => void;
}

const PEARL_MARKER_WIDTH = 34;
const PEARL_MARKER_HEIGHT = 40;

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
        icon: isAdminCreatedPearl(gem) ? buildPearlMarkerIcon() : undefined,
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

function buildPearlMarkerIcon(): google.maps.Icon {
  return {
    url: pearlMarkerIcon,
    scaledSize: new google.maps.Size(PEARL_MARKER_WIDTH, PEARL_MARKER_HEIGHT),
    anchor: new google.maps.Point(PEARL_MARKER_WIDTH / 2, PEARL_MARKER_HEIGHT),
  };
}
