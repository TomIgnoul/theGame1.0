"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatReply = generateChatReply;
const aiRuntime_1 = require("../ai/aiRuntime");
async function generateChatReply(messages) {
    return (0, aiRuntime_1.generateAiText)(messages);
}
//# sourceMappingURL=aiService.js.map