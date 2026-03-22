import {
  STORY_TIMEOUT_MS,
  type StoryLanguage,
} from '../../config/constants';
import { pool } from '../../db';
import { AiRuntimeError } from '../ai/aiRuntime';
import { findById } from '../gems/gems.repo';
import { generateStory } from './ai.provider';

const PROMPT_VERSION = process.env.PROMPT_VERSION ?? 'v1';

export interface StoryResult {
  gemId: string;
  theme: string;
  language: StoryLanguage;
  promptVersion: string;
  storyText: string;
  source: 'cache' | 'generated';
}

export async function getOrCreateStory(
  gemId: string,
  theme: string,
  language: StoryLanguage
): Promise<StoryResult> {
  const gem = await findById(gemId);
  if (!gem) return null as unknown as StoryResult;

  const cached = await getCachedStory(gemId, theme, language);
  if (cached) return cached;

  let storyText: string;
  try {
    storyText = await withTimeout(
      generateStory(gem, theme, language),
      STORY_TIMEOUT_MS,
      new StoryServiceError(503, 'story_timeout', 'Story generation timed out'),
    );
  } catch (error) {
    if (error instanceof StoryServiceError) {
      throw error;
    }

    if (error instanceof AiRuntimeError) {
      throw new StoryServiceError(error.status, error.code, error.message);
    }

    throw new StoryServiceError(
      502,
      'story_generation_failed',
      'Story generation failed',
    );
  }

  await storeStory(gemId, theme, language, storyText);

  return {
    gemId,
    theme,
    language,
    promptVersion: PROMPT_VERSION,
    storyText,
    source: 'generated',
  };
}

async function getCachedStory(
  gemId: string,
  theme: string,
  language: StoryLanguage
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
      source: 'cache',
    };
  } finally {
    client.release();
  }
}

async function storeStory(
  gemId: string,
  theme: string,
  language: StoryLanguage,
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

export class StoryServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'StoryServiceError';
  }
}

function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutError: StoryServiceError,
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
