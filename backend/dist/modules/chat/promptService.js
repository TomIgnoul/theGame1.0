"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChatMessages = buildChatMessages;
function buildChatMessages(gem, message) {
    return [
        {
            role: 'system',
            content: [
                'You are a helpful story guide for a Brussels hidden-gems walking app.',
                'Answer the user using only the POI facts provided to you.',
                'If the data is missing or uncertain, say that clearly instead of inventing details.',
                'Do not invent opening hours, prices, contact info, accessibility details, transport advice, or historical claims.',
                'Keep replies concise and conversational, usually 2 to 4 sentences.',
            ].join(' '),
        },
        {
            role: 'user',
            content: [
                'POI facts:',
                formatGemFacts(gem),
                '',
                `User question: ${message}`,
            ].join('\n'),
        },
    ];
}
function formatGemFacts(gem) {
    const facts = [
        `- Title: ${gem.title}`,
        `- Theme: ${gem.theme}`,
    ];
    if (gem.address) {
        facts.push(`- Address: ${gem.address}`);
    }
    if (gem.descriptionShort) {
        facts.push(`- Short description: ${gem.descriptionShort}`);
    }
    const practicalInfoFacts = formatPracticalInfo(gem.practicalInfo);
    if (practicalInfoFacts.length > 0) {
        facts.push('- Practical info:');
        facts.push(...practicalInfoFacts.map((fact) => `  - ${fact}`));
    }
    else {
        facts.push('- Practical info: none available');
    }
    return facts.join('\n');
}
function formatPracticalInfo(practicalInfo) {
    return Object.entries(practicalInfo)
        .map(([key, value]) => {
        const formattedValue = formatPracticalInfoValue(value);
        if (!formattedValue) {
            return null;
        }
        return `${humanizeKey(key)}: ${formattedValue}`;
    })
        .filter((fact) => Boolean(fact))
        .slice(0, 6);
}
function formatPracticalInfoValue(value) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        const parts = value
            .map((item) => formatPracticalInfoValue(item))
            .filter((item) => Boolean(item));
        return parts.length > 0 ? parts.join(', ') : null;
    }
    return null;
}
function humanizeKey(key) {
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
//# sourceMappingURL=promptService.js.map