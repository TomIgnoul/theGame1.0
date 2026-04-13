"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAnalyticsReadFilters = parseAnalyticsReadFilters;
exports.getAnalyticsOverview = getAnalyticsOverview;
exports.getAnalyticsTimeseries = getAnalyticsTimeseries;
exports.getAnalyticsBreakdowns = getAnalyticsBreakdowns;
const constants_1 = require("../../config/constants");
const read_repo_1 = require("./read.repo");
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Implements FR-19, FR-20, FR-21, FR-22, FR-23, FR-25, and FR-26 while
// covering GH-AN-01, GH-AN-02, GH-AN-03, and GH-AN-04 for the read-only
// analytics admin portal contract.
function parseAnalyticsReadFilters(query) {
    if (!isRecord(query)) {
        return invalidFilters('Query parameters are required');
    }
    const from = getSingleQueryParam(query.from);
    const to = getSingleQueryParam(query.to);
    const theme = getSingleQueryParam(query.theme);
    if (!from || !isIsoDate(from)) {
        return invalidFilters('from is required and must be YYYY-MM-DD');
    }
    if (!to || !isIsoDate(to)) {
        return invalidFilters('to is required and must be YYYY-MM-DD');
    }
    if (from > to) {
        return invalidFilters('from must be on or before to');
    }
    if (theme && !constants_1.ALLOWED_THEMES.some((allowedTheme) => allowedTheme === theme)) {
        return invalidFilters(`theme must be one of: ${constants_1.ALLOWED_THEMES.join(', ')}`);
    }
    return {
        ok: true,
        filters: {
            from,
            to,
            theme: theme ?? null,
        },
    };
}
async function getAnalyticsOverview(filters) {
    const kpis = await (0, read_repo_1.fetchAnalyticsOverview)(filters);
    return {
        filters,
        hasData: Object.values(kpis).some((value) => value > 0),
        kpis,
    };
}
async function getAnalyticsTimeseries(filters) {
    const buckets = await (0, read_repo_1.fetchAnalyticsTimeseries)(filters);
    return {
        filters,
        hasData: buckets.some((bucket) => bucket.routeGenerations > 0 || bucket.routeStarts > 0),
        buckets,
    };
}
async function getAnalyticsBreakdowns(filters) {
    const [themeBreakdown, poiBreakdown] = await Promise.all([
        (0, read_repo_1.fetchAnalyticsThemeBreakdown)(filters),
        (0, read_repo_1.fetchAnalyticsPoiBreakdown)(filters),
    ]);
    return {
        filters,
        hasData: themeBreakdown.some((row) => row.totalEvents > 0) ||
            poiBreakdown.some((row) => row.totalEvents > 0),
        themeBreakdown,
        poiBreakdown,
    };
}
function invalidFilters(error) {
    return {
        ok: false,
        code: 'invalid_analytics_filters',
        error,
    };
}
function getSingleQueryParam(value) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
        const trimmed = value[0].trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    return null;
}
function isIsoDate(value) {
    if (!ISO_DATE_PATTERN.test(value)) {
        return false;
    }
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
//# sourceMappingURL=read.service.js.map