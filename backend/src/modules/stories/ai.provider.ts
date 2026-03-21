import OpenAI from 'openai';
import type { StoryLanguage } from '../../config/constants';
import type { Gem } from '../gems/gems.repo';
import { buildStoryPrompt } from './story.prompt';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateStory(
  gem: Pick<
    Gem,
    'title' | 'theme' | 'address' | 'descriptionShort' | 'practicalInfo'
  >,
  theme: string,
  language: StoryLanguage
): Promise<string> {
  if (!client) throw new Error('OPENAI_API_KEY required for story generation');

  const prompt = buildStoryPrompt(gem, theme, language);

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 220,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error('Empty AI response');
  return text.trim();
}
