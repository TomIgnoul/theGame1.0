import { useCallback, useEffect, useState } from 'react';
import { chatApi } from '../../api/client';
import type { ChatMessage } from './types';

const MAX_MESSAGE_LENGTH = 500;

export function useChat(gemId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
    setIsSending(false);
  }, [gemId]);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        setError('Please enter a message first.');
        return false;
      }

      if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        setError(`Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
        return false;
      }

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmedMessage,
      };

      setMessages((currentMessages) => [...currentMessages, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const response = await chatApi.send({
          gemId,
          message: trimmedMessage,
          sessionId,
        });

        setSessionId(response.sessionId);
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.reply,
          },
        ]);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send chat message.');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [gemId, sessionId],
  );

  return {
    messages,
    isSending,
    error,
    sendMessage,
  };
}
