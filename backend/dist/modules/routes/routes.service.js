"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoute = generateRoute;
const constants_1 = require("../../config/constants");
const gems_repo_1 = require("../gems/gems.repo");
const routing_provider_1 = require("./routing.provider");
function haversineDistance(a, b) {
    const R = 6371e3;
    const φ1 = (a.lat * Math.PI) / 180;
    const φ2 = (b.lat * Math.PI) / 180;
    const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
    const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    return R * c;
}
function selectGemsByDistance(candidates, start, end, n) {
    const scored = candidates.map((g) => {
        const pos = { lat: g.latitude, lng: g.longitude };
        const dStart = haversineDistance(start, pos);
        let score = dStart;
        if (end) {
            const dEnd = haversineDistance(pos, end);
            const dTotal = haversineDistance(start, end);
            score = dStart + dEnd - dTotal * 0.5;
        }
        return { ...g, score };
    });
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, n);
}
async function generateRoute(req) {
    const { theme, kmTarget, shape, start, end } = req;
    if (kmTarget < constants_1.KM_MIN || kmTarget > constants_1.KM_MAX) {
        throw { status: 400, message: `kmTarget must be between ${constants_1.KM_MIN} and ${constants_1.KM_MAX}` };
    }
    if (shape !== 'loop' && shape !== 'a_to_b') {
        throw { status: 400, message: 'shape must be loop or a_to_b' };
    }
    if (shape === 'a_to_b' && !end) {
        throw { status: 400, message: 'end is required for a_to_b shape' };
    }
    if (start.lat < -90 ||
        start.lat > 90 ||
        start.lng < -180 ||
        start.lng > 180) {
        throw { status: 400, message: 'Invalid start coordinates' };
    }
    if (end && (end.lat < -90 || end.lat > 90 || end.lng < -180 || end.lng > 180)) {
        throw { status: 400, message: 'Invalid end coordinates' };
    }
    const candidates = await (0, gems_repo_1.findByTheme)(theme);
    const gemCandidates = candidates.map((g) => ({
        id: g.id,
        title: g.title,
        latitude: g.latitude,
        longitude: g.longitude,
    }));
    if (gemCandidates.length < constants_1.MIN_GEMS) {
        throw { status: 503, code: 'INSUFFICIENT_GEMS', message: 'Not enough gems for this theme' };
    }
    const targetMeters = kmTarget * 1000;
    const tolerance = (constants_1.ROUTE_TOLERANCE_PERCENT / 100) * targetMeters;
    let lastError;
    const warnings = [];
    for (let attempt = 0; attempt <= constants_1.ROUTE_MAX_RETRIES; attempt++) {
        const n = Math.min(constants_1.MAX_GEMS, Math.max(constants_1.MIN_GEMS, Math.round(constants_1.DEFAULT_GEMS + (attempt - 1) * 2)));
        const selected = selectGemsByDistance(gemCandidates, start, shape === 'a_to_b' ? end : null, n);
        const gemPositions = selected.map((g) => ({ lat: g.latitude, lng: g.longitude }));
        const origin = start;
        const destination = shape === 'loop' ? start : end;
        const waypoints = gemPositions;
        try {
            const result = await (0, routing_provider_1.computeWalkingRoute)(origin, destination, waypoints);
            const kmResult = result.distanceMeters / 1000;
            if (Math.abs(result.distanceMeters - targetMeters) <= tolerance) {
                return {
                    shape,
                    kmTarget,
                    kmResult: Math.round(kmResult * 100) / 100,
                    gems: selected.map((g) => ({ id: g.id, title: g.title })),
                    polyline: result.polyline,
                    warnings,
                };
            }
            if (attempt < constants_1.ROUTE_MAX_RETRIES) {
                continue;
            }
            warnings.push(`Route is ${kmResult.toFixed(1)} km (target ${kmTarget} km)`);
            return {
                shape,
                kmTarget,
                kmResult: Math.round(kmResult * 100) / 100,
                gems: selected.map((g) => ({ id: g.id, title: g.title })),
                polyline: result.polyline,
                warnings,
            };
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError ?? { status: 502, message: 'Route computation failed' };
}
//# sourceMappingURL=routes.service.js.map