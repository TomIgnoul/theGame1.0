"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRuntimeError = void 0;
exports.generateAiText = generateAiText;
class AiRuntimeError extends Error {
    status;
    code;
    constructor(status, code, message) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = 'AiRuntimeError';
    }
}
exports.AiRuntimeError = AiRuntimeError;
async function generateAiText(messages) {
    const provider = (process.env.AI_PROVIDER ?? 'ollama').trim().toLowerCase();
    if (!isSupportedOllamaProvider(provider)) {
        throw new AiRuntimeError(500, 'unsupported_ai_provider', `Unsupported AI provider "${provider}". Set AI_PROVIDER=ollama for the MVP path.`);
    }
    return generateWithOllama(messages);
}
async function generateWithOllama(messages) {
    const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = (process.env.OLLAMA_MODEL ?? 'llama3.2').trim();
    const apiKey = process.env.OLLAMA_API_KEY?.trim();
    let response;
    try {
        response = await fetch(buildOllamaChatUrl(baseUrl), {
            method: 'POST',
            headers: buildOllamaHeaders(apiKey),
            body: JSON.stringify({
                model,
                messages,
                stream: false,
            }),
        });
    }
    catch {
        throw new AiRuntimeError(502, 'ai_runtime_unavailable', 'Ollama is unavailable. Ensure Ollama is running, OLLAMA_BASE_URL is correct, and the configured model is installed.');
    }
    const payload = (await safeParseJson(response));
    if (!response.ok) {
        const providerMessage = typeof payload?.error === 'string' && payload.error.trim()
            ? payload.error.trim()
            : null;
        throw new AiRuntimeError(502, 'ai_runtime_failed', providerMessage
            ? `Ollama request failed: ${providerMessage}`
            : 'Ollama request failed. Verify OLLAMA_BASE_URL and that the configured model is available.');
    }
    const text = payload?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
        throw new AiRuntimeError(502, 'ai_runtime_invalid_response', 'Ollama returned an empty or invalid response.');
    }
    return text.trim();
}
async function safeParseJson(response) {
    try {
        return await response.json();
    }
    catch {
        return null;
    }
}
function isSupportedOllamaProvider(provider) {
    return provider === 'ollama' || provider === 'ollama_cloud';
}
function buildOllamaChatUrl(baseUrl) {
    const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (normalizedBaseUrl.endsWith('/api')) {
        return `${normalizedBaseUrl}/chat`;
    }
    return `${normalizedBaseUrl}/api/chat`;
}
function buildOllamaHeaders(apiKey) {
    if (!apiKey) {
        return {
            'Content-Type': 'application/json',
        };
    }
    const authorization = apiKey.startsWith('Bearer ')
        ? apiKey
        : `Bearer ${apiKey}`;
    return {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'X-API-Key': apiKey,
    };
}
//# sourceMappingURL=aiRuntime.js.map