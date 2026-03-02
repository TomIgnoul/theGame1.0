/**
 * Uses Google Directions API (walking) to compute route and polyline.
 * Requires GOOGLE_ROUTES_API_KEY or GOOGLE_MAPS_API_KEY in env.
 */
const API_KEY = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

export interface RouteResult {
  distanceMeters: number;
  polyline: string;
  legs: Array<{ start: { lat: number; lng: number }; end: { lat: number; lng: number } }>;
}

export async function computeWalkingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints: Array<{ lat: number; lng: number }>
): Promise<RouteResult> {
  if (!API_KEY) throw new Error('GOOGLE_ROUTES_API_KEY or GOOGLE_MAPS_API_KEY required');

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode: 'walking',
    key: API_KEY,
  });
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((w) => `${w.lat},${w.lng}`).join('|'));
  }

  const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
  const data = (await res.json()) as {
    status: string;
    routes?: Array<{
      legs: Array<{
        distance: { value: number };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
      }>;
      overview_polyline: { points: string };
    }>;
  };

  if (data.status !== 'OK' || !data.routes?.[0]) {
    throw new Error(data.status === 'ZERO_RESULTS' ? 'No route found' : `Directions API error: ${data.status}`);
  }

  const route = data.routes[0];
  const distanceMeters = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0);
  const legs = route.legs.map((leg) => ({
    start: leg.start_location,
    end: leg.end_location,
  }));

  return {
    distanceMeters,
    polyline: route.overview_polyline.points,
    legs,
  };
}
