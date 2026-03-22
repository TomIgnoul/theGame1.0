export const KM_MIN = 1;
export const KM_MAX = 15;
export const MIN_GEMS = 6;
export const MAX_GEMS = 10;
export const DEFAULT_GEMS = 8;
export const ROUTE_TOLERANCE_PERCENT = 10;
export const ROUTE_MAX_RETRIES = 2;
export const STORY_TIMEOUT_MS = 20_000;
export const STORY_RATE_LIMIT_MAX_REQUESTS = 10;
export const STORY_RATE_LIMIT_WINDOW_MS = 60_000;
export const CHAT_MESSAGE_MAX_LENGTH = 500;
export const CHAT_RATE_LIMIT_MAX_REQUESTS = 10;
export const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;

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

export const ALLOWED_STORY_LANGUAGES = ['en', 'nl'] as const;

export type Theme = (typeof ALLOWED_THEMES)[number];
export type StoryLanguage = (typeof ALLOWED_STORY_LANGUAGES)[number];
