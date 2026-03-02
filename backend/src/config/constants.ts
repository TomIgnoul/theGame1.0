export const KM_MIN = 1;
export const KM_MAX = 15;
export const MIN_GEMS = 6;
export const MAX_GEMS = 10;
export const DEFAULT_GEMS = 8;
export const ROUTE_TOLERANCE_PERCENT = 10;
export const ROUTE_MAX_RETRIES = 2;

export const DEFAULT_THEME = 'Culture';
export const DEFAULT_SHAPE = 'loop' as const;
export const DEFAULT_MAP_CENTER = { lat: 50.8467, lng: 4.3525 }; // Grand Place

export const ALLOWED_THEMES = [
  'Culture',
  'Art',
  'War',
  'Beverages',
  'Leisure',
  'History',
  'Architecture',
] as const;

export type Theme = (typeof ALLOWED_THEMES)[number];
