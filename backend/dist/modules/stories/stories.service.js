"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryServiceError = void 0;
exports.getOrCreateStory = getOrCreateStory;
const constants_1 = require("../../config/constants");
const db_1 = require("../../db");
const aiRuntime_1 = require("../ai/aiRuntime");
const gems_repo_1 = require("../gems/gems.repo");
const ai_provider_1 = require("./ai.provider");
const PROMPT_VERSION = process.env.PROMPT_VERSION ?? 'v1';
async function getOrCreateStory(gemId, theme, language) {
    const gem = await (0, gems_repo_1.findById)(gemId);
    if (!gem)
        return null;
    const cached = await getCachedStory(gemId, theme, language);
    if (cached)
        return cached;
    let storyText;
    try {
        storyText = await withTimeout((0, ai_provider_1.generateStory)(gem, theme, language), constants_1.STORY_TIMEOUT_MS, new StoryServiceError(503, 'story_timeout', 'Story generation timed out'));
    }
    catch (error) {
        if (error instanceof StoryServiceError) {
            throw error;
        }
        if (error instanceof aiRuntime_1.AiRuntimeError) {
            throw new StoryServiceError(error.status, error.code, error.message);
        }
        throw new StoryServiceError(502, 'story_generation_failed', 'Story generation failed');
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
async function getCachedStory(gemId, theme, language) {
    const client = await db_1.pool.connect();
    try {
        const { rows } = await client.query(`SELECT story_text as "storyText" FROM gem_stories
       WHERE gem_id = $1 AND theme = $2 AND language = $3 AND prompt_version = $4`, [gemId, theme, language, PROMPT_VERSION]);
        if (rows.length === 0)
            return null;
        return {
            gemId,
            theme,
            language,
            promptVersion: PROMPT_VERSION,
            storyText: rows[0].storyText,
            source: 'cache',
        };
    }
    finally {
        client.release();
    }
}
async function storeStory(gemId, theme, language, storyText) {
    const client = await db_1.pool.connect();
    try {
        await client.query(`INSERT INTO gem_stories (gem_id, theme, language, prompt_version, story_text)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (gem_id, theme, language, prompt_version) DO UPDATE SET story_text = EXCLUDED.story_text`, [gemId, theme, language, PROMPT_VERSION, storyText]);
    }
    finally {
        client.release();
    }
}
class StoryServiceError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'StoryServiceError';
    }
}
exports.StoryServiceError = StoryServiceError;
function withTimeout(operation, timeoutMs, timeoutError) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(timeoutError), timeoutMs);
    });
    return Promise.race([operation, timeoutPromise]).finally(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });
}
//# sourceMappingURL=stories.service.js.map