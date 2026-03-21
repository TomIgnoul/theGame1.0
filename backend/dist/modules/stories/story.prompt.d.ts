import type { StoryLanguage } from '../../config/constants';
import type { Gem } from '../gems/gems.repo';
type StoryPromptGem = Pick<Gem, 'title' | 'theme' | 'address' | 'descriptionShort' | 'practicalInfo'>;
export declare function buildStoryPrompt(gem: StoryPromptGem, storyTheme: string, language: StoryLanguage): string;
export {};
//# sourceMappingURL=story.prompt.d.ts.map