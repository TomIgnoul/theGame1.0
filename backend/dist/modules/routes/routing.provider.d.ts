export interface RouteResult {
    distanceMeters: number;
    polyline: string;
    legs: Array<{
        start: {
            lat: number;
            lng: number;
        };
        end: {
            lat: number;
            lng: number;
        };
    }>;
}
export declare function computeWalkingRoute(origin: {
    lat: number;
    lng: number;
}, destination: {
    lat: number;
    lng: number;
}, waypoints: Array<{
    lat: number;
    lng: number;
}>): Promise<RouteResult>;
//# sourceMappingURL=routing.provider.d.ts.map