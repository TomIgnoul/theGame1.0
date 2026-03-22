import { generateAiText, type AiMessage } from '../ai/aiRuntime';

export async function generateChatReply(
  messages: AiMessage[],
): Promise<string> {
  return generateAiText(messages);
}
