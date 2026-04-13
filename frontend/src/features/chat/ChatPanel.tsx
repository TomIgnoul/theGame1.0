import { useEffect, useState } from 'react';
import { useChat } from './useChat';
import { analyticsApi } from '../../api/client';

interface ChatPanelProps {
  gemId: string;
  title: string;
  theme: string;
}

export function ChatPanel({ gemId, title, theme }: ChatPanelProps) {
  const { messages, isSending, error, sendMessage } = useChat(gemId);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    void analyticsApi.capture({
      eventType: 'stop_chat_opened',
      poiId: gemId,
      theme,
    }).catch(() => undefined);
  }, [gemId, theme]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sent = await sendMessage(draft);
    if (sent) {
      setDraft('');
    }
  }

  return (
    <section>
      <h4 style={{ marginTop: 0 }}>Ask about this place</h4>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: 0 }}>
        Chat about {title} using the POI facts we have available.
      </p>

      <div
        style={{
          maxHeight: 220,
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '0.75rem',
          background: '#f8fafc',
          marginBottom: '0.75rem',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Ask a question about the story, history, or practical details of this POI.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 8,
                  background: message.role === 'user' ? '#dbeafe' : 'white',
                  border: '1px solid #e5e7eb',
                  fontSize: '0.875rem',
                }}
              >
                {message.content}
              </span>
            </div>
          ))
        )}
        {isSending && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#2563eb' }}>
            Thinking...
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask something about this POI..."
          maxLength={500}
          rows={3}
          disabled={isSending}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            resize: 'vertical',
            padding: '0.75rem',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            marginBottom: '0.5rem',
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {draft.length}/500
          </span>
          <button
            type="submit"
            disabled={isSending}
            style={{
              padding: '0.5rem 1rem',
              background: '#0f766e',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: isSending ? 'not-allowed' : 'pointer',
            }}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: 0 }}>
          {error}
        </p>
      )}
    </section>
  );
}
