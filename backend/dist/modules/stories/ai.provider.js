"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStory = generateStory;
const aiRuntime_1 = require("../ai/aiRuntime");
const story_prompt_1 = require("./story.prompt");
async function generateStory(gem, theme, language) {
    const prompt = (0, story_prompt_1.buildStoryPrompt)(gem, theme, language);
    return (0, aiRuntime_1.generateAiText)([{ role: 'user', content: prompt }]);
}
//# sourceMappingURL=ai.provider.js.map