"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStoryPrompt = buildStoryPrompt;
const LANGUAGE_LABELS = {
    en: 'English',
    nl: 'Dutch',
};
function buildStoryPrompt(gem, storyTheme, language) {
    const facts = [
        `POI title: ${gem.title}`,
        `POI theme: ${gem.theme}`,
        `Story lens: ${storyTheme}`,
    ];
    if (gem.address) {
        facts.push(`Address: ${gem.address}`);
    }
    if (gem.descriptionShort) {
        facts.push(`Short description: ${gem.descriptionShort}`);
    }
    const practicalInfoFacts = formatPracticalInfo(gem.practicalInfo);
    if (practicalInfoFacts.length > 0) {
        facts.push('Dataset-backed practical info:');
        facts.push(...practicalInfoFacts.map((fact) => `- ${fact}`));
    }
    else {
        facts.push('Dataset-backed practical info: none available.');
    }
    return [
        'Write a short, vivid POI story for a Brussels walking app.',
        `Write in ${LANGUAGE_LABELS[language]}.`,
        'Keep it to one short paragraph, maximum 120 words.',
        'Use only the factual input below.',
        'If facts are missing, briefly say that some details are uncertain.',
        'Do not invent opening hours, prices, contact info, accessibility details, transport advice, or historical claims.',
        '',
        'Facts:',
        ...facts,
    ].join('\n');
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
//# sourceMappingURL=story.prompt.js.map