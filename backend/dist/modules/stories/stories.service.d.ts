export interface StoryResult {
    gemId: string;
    theme: string;
    language: string;
    promptVersion: string;
    storyText: string;
}
export declare function getOrCreateStory(gemId: string, theme: string, language: string): Promise<StoryResult>;
//# sourceMappingURL=stories.service.d.ts.map