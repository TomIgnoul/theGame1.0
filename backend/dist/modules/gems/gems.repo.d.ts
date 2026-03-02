import { ALLOWED_THEMES } from '../../config/constants';
export interface GemPin {
    id: string;
    title: string;
    theme: string;
    latitude: number;
    longitude: number;
    address: string | null;
    practicalInfo: Record<string, unknown>;
}
export interface Gem {
    id: string;
    title: string;
    theme: string;
    descriptionShort: string | null;
    address: string | null;
    latitude: number;
    longitude: number;
    practicalInfo: Record<string, unknown>;
    sourceType: string;
}
export declare function isValidTheme(theme: string): theme is (typeof ALLOWED_THEMES)[number];
export declare function findByTheme(theme?: string): Promise<GemPin[]>;
export declare function findById(id: string): Promise<Gem | null>;
//# sourceMappingURL=gems.repo.d.ts.map