import type { StoryLanguage } from '../../config/constants';
import type { Gem } from '../gems/gems.repo';
export declare function generateStory(gem: Pick<Gem, 'title' | 'theme' | 'address' | 'descriptionShort' | 'practicalInfo'>, theme: string, language: StoryLanguage): Promise<string>;
//# sourceMappingURL=ai.provider.d.ts.map