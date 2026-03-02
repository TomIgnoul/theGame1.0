export interface RouteRequest {
    theme: string;
    kmTarget: number;
    shape: 'loop' | 'a_to_b';
    start: {
        lat: number;
        lng: number;
    };
    end?: {
        lat: number;
        lng: number;
    } | null;
}
export interface RouteResponse {
    shape: 'loop' | 'a_to_b';
    kmTarget: number;
    kmResult: number;
    gems: Array<{
        id: string;
        title: string;
    }>;
    polyline: string;
    warnings: string[];
}
export declare function generateRoute(req: RouteRequest): Promise<RouteResponse>;
//# sourceMappingURL=routes.service.d.ts.map