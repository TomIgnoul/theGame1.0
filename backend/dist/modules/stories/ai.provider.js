"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStory = generateStory;
const openai_1 = __importDefault(require("openai"));
const story_prompt_1 = require("./story.prompt");
const client = process.env.OPENAI_API_KEY
    ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY })
    : null;
async function generateStory(gem, theme, language) {
    if (!client)
        throw new Error('OPENAI_API_KEY required for story generation');
    const prompt = (0, story_prompt_1.buildStoryPrompt)(gem, theme, language);
    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 220,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text)
        throw new Error('Empty AI response');
    return text.trim();
}
//# sourceMappingURL=ai.provider.js.map