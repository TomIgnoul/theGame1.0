import type { StoryLanguage } from '../../config/constants';
import type { Gem } from '../gems/gems.repo';
import { generateAiText } from '../ai/aiRuntime';
import { buildStoryPrompt } from './story.prompt';

export async function generateStory(
  gem: Pick<
    Gem,
    'title' | 'theme' | 'address' | 'descriptionShort' | 'practicalInfo'
  >,
  theme: string,
  language: StoryLanguage
): Promise<string> {
  const prompt = buildStoryPrompt(gem, theme, language);
  return generateAiText([{ role: 'user', content: prompt }]);
}
