import { type StoryLanguage } from '../../config/constants';
export interface StoryResult {
    gemId: string;
    theme: string;
    language: StoryLanguage;
    promptVersion: string;
    storyText: string;
    source: 'cache' | 'generated';
}
export declare function getOrCreateStory(gemId: string, theme: string, language: StoryLanguage): Promise<StoryResult>;
export declare class StoryServiceError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(status: number, code: string, message: string);
}
//# sourceMappingURL=stories.service.d.ts.map