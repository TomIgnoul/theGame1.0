import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStoryPrompt } from './story.prompt';

test('buildStoryPrompt uses project-owned facts and guardrails', () => {
  const prompt = buildStoryPrompt(
    {
      title: 'Maison des Arts',
      theme: 'Art',
      address: 'Rue de la Culture 10, Brussels',
      descriptionShort: 'A restored arts venue with regular exhibitions.',
      practicalInfo: {
        opening_hours: 'Tue-Sun 10:00-18:00',
        tickets: 'Museum Pass accepted',
      },
    },
    'Art',
    'en',
  );

  assert.match(prompt, /Maison des Arts/);
  assert.match(prompt, /Rue de la Culture 10, Brussels/);
  assert.match(prompt, /opening hours: Tue-Sun 10:00-18:00/i);
  assert.match(prompt, /Museum Pass accepted/);
  assert.match(prompt, /Do not invent opening hours, prices, contact info/i);
});

test('buildStoryPrompt explicitly notes missing practical info', () => {
  const prompt = buildStoryPrompt(
    {
      title: 'Unknown Stop',
      theme: 'History',
      address: null,
      descriptionShort: null,
      practicalInfo: {},
    },
    'History',
    'nl',
  );

  assert.match(prompt, /Write in Dutch/);
  assert.match(prompt, /Dataset-backed practical info: none available\./);
});
