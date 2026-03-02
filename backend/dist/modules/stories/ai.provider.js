"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStory = generateStory;
const openai_1 = __importDefault(require("openai"));
const client = process.env.OPENAI_API_KEY
    ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY })
    : null;
async function generateStory(gemTitle, gemAddress, theme, language) {
    if (!client)
        throw new Error('OPENAI_API_KEY required for story generation');
    const prompt = `Write a short, engaging story (2-3 paragraphs) about "${gemTitle}"${gemAddress ? ` at ${gemAddress}` : ''} in Brussels, themed around ${theme}. Write in ${language === 'fr' ? 'French' : language === 'nl' ? 'Dutch' : 'English'}. Use only factual context about the location. Do not invent opening hours, contact info, or practical details.`;
    const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
    });
    const text = completion.choices[0]?.message?.content;
    if (!text)
        throw new Error('Empty AI response');
    return text;
}
//# sourceMappingURL=ai.provider.js.map