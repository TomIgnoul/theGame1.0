import assert from 'node:assert/strict';
import test from 'node:test';
import { buildChatMessages } from './promptService';

test('buildChatMessages includes POI facts and user question', () => {
  const messages = buildChatMessages(
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
    'What can I expect there?',
  );

  assert.equal(messages.length, 2);
  assert.equal(messages[0]?.role, 'system');
  assert.match(String(messages[0]?.content), /only the POI facts provided/i);
  assert.match(String(messages[1]?.content), /Maison des Arts/);
  assert.match(String(messages[1]?.content), /opening hours: Tue-Sun 10:00-18:00/i);
  assert.match(String(messages[1]?.content), /User question: What can I expect there\?/);
});

test('buildChatMessages explicitly marks missing practical info', () => {
  const messages = buildChatMessages(
    {
      title: 'Unknown Stop',
      theme: 'History',
      address: null,
      descriptionShort: null,
      practicalInfo: {},
    },
    'Is there anything useful to know?',
  );

  assert.match(String(messages[1]?.content), /Practical info: none available/i);
  assert.match(String(messages[0]?.content), /say that clearly instead of inventing details/i);
});
