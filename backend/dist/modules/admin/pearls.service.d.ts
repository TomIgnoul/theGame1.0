export declare const ADD_PEARL_ALLOWED_THEMES: readonly ["War", "Museum", "Streetart", "Food", "Culture"];
export type AddPearlTheme = (typeof ADD_PEARL_ALLOWED_THEMES)[number];
export interface PearlOwner {
    id: string;
    name: string;
}
export interface CreatePearlOwnerInput {
    name: string;
}
export interface CreatePearlInput {
    name: string;
    story: string;
    theme: AddPearlTheme;
    latitude: number;
    longitude: number;
    pearlOwnerId: string;
}
export interface CreatedPearl {
    id: string;
    name: string;
    story: string;
    address: string | null;
    theme: AddPearlTheme;
    latitude: number;
    longitude: number;
    pearlOwner: PearlOwner;
    isRouteCandidate: boolean;
}
type ParseResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: string;
    code: string;
};
export declare class AdminPearlServiceError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
export declare function parseCreatePearlOwnerInput(body: unknown): ParseResult<CreatePearlOwnerInput>;
export declare function parseCreatePearlInput(body: unknown): ParseResult<CreatePearlInput>;
export declare function listPearlOwners(query?: string): Promise<PearlOwner[]>;
export declare function createPearlOwner(input: CreatePearlOwnerInput): Promise<PearlOwner>;
export declare function createAdminPearl(input: CreatePearlInput): Promise<CreatedPearl>;
export {};
//# sourceMappingURL=pearls.service.d.ts.map