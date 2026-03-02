"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateStory = getOrCreateStory;
const db_1 = require("../../db");
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
    const storyText = await (0, ai_provider_1.generateStory)(gem.title, gem.address, theme, language);
    await storeStory(gemId, theme, language, storyText);
    return {
        gemId,
        theme,
        language,
        promptVersion: PROMPT_VERSION,
        storyText,
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
//# sourceMappingURL=stories.service.js.map