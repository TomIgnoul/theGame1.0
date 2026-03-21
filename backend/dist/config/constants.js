"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_STORY_LANGUAGES = exports.ALLOWED_THEMES = exports.DEFAULT_MAP_CENTER = exports.DEFAULT_SHAPE = exports.DEFAULT_THEME = exports.STORY_RATE_LIMIT_WINDOW_MS = exports.STORY_RATE_LIMIT_MAX_REQUESTS = exports.STORY_TIMEOUT_MS = exports.ROUTE_MAX_RETRIES = exports.ROUTE_TOLERANCE_PERCENT = exports.DEFAULT_GEMS = exports.MAX_GEMS = exports.MIN_GEMS = exports.KM_MAX = exports.KM_MIN = void 0;
exports.KM_MIN = 1;
exports.KM_MAX = 15;
exports.MIN_GEMS = 6;
exports.MAX_GEMS = 10;
exports.DEFAULT_GEMS = 8;
exports.ROUTE_TOLERANCE_PERCENT = 10;
exports.ROUTE_MAX_RETRIES = 2;
exports.STORY_TIMEOUT_MS = 20_000;
exports.STORY_RATE_LIMIT_MAX_REQUESTS = 10;
exports.STORY_RATE_LIMIT_WINDOW_MS = 60_000;
exports.DEFAULT_THEME = 'Culture';
exports.DEFAULT_SHAPE = 'loop';
exports.DEFAULT_MAP_CENTER = { lat: 50.8467, lng: 4.3525 }; // Grand Place
exports.ALLOWED_THEMES = [
    'Culture',
    'Art',
    'War',
    'Beverages',
    'Leisure',
    'History',
    'Architecture',
];
exports.ALLOWED_STORY_LANGUAGES = ['en', 'nl'];
//# sourceMappingURL=constants.js.map