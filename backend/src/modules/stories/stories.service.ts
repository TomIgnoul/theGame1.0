import { pool } from '../../db';
import { findById } from '../gems/gems.repo';
import { generateStory } from './ai.provider';

const PROMPT_VERSION = process.env.PROMPT_VERSION ?? 'v1';

export interface StoryResult {
  gemId: string;
  theme: string;
  language: string;
  promptVersion: string;
  storyText: string;
}

export async function getOrCreateStory(
  gemId: string,
  theme: string,
  language: string
): Promise<StoryResult> {
  const gem = await findById(gemId);
  if (!gem) return null as unknown as StoryResult;

  const cached = await getCachedStory(gemId, theme, language);
  if (cached) return cached;

  const storyText = await generateStory(
    gem.title,
    gem.address,
    theme,
    language
  );

  await storeStory(gemId, theme, language, storyText);

  return {
    gemId,
    theme,
    language,
    promptVersion: PROMPT_VERSION,
    storyText,
  };
}

async function getCachedStory(
  gemId: string,
  theme: string,
  language: string
): Promise<StoryResult | null> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT story_text as "storyText" FROM gem_stories
       WHERE gem_id = $1 AND theme = $2 AND language = $3 AND prompt_version = $4`,
      [gemId, theme, language, PROMPT_VERSION]
    );
    if (rows.length === 0) return null;
    return {
      gemId,
      theme,
      language,
      promptVersion: PROMPT_VERSION,
      storyText: rows[0].storyText,
    };
  } finally {
    client.release();
  }
}

async function storeStory(
  gemId: string,
  theme: string,
  language: string,
  storyText: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO gem_stories (gem_id, theme, language, prompt_version, story_text)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (gem_id, theme, language, prompt_version) DO UPDATE SET story_text = EXCLUDED.story_text`,
      [gemId, theme, language, PROMPT_VERSION, storyText]
    );
  } finally {
    client.release();
  }
}
