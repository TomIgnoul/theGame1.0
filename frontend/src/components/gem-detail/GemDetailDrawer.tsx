import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGemDetailStore } from '../../store/gemDetailStore';
import { gemsApi } from '../../api/client';
import { ChatPanel } from '../../features/chat/ChatPanel';

export function GemDetailDrawer() {
  const { selectedGemId, setSelectedGemId } = useGemDetailStore();
  const [language, setLanguage] = useState<'en' | 'nl'>('en');

  const { data: gem, isLoading: gemLoading } = useQuery({
    queryKey: ['gem', selectedGemId],
    queryFn: () => gemsApi.get(selectedGemId!),
    enabled: !!selectedGemId,
  });

  const {
    data: story,
    isFetching: storyLoading,
    isError: storyError,
    error: storyErrorDetails,
    refetch: refetchStory,
  } = useQuery({
    queryKey: ['story', selectedGemId, gem?.theme, language],
    queryFn: () => gemsApi.story(selectedGemId!, gem!.theme, language),
    enabled: false,
    retry: false,
  });

  if (!selectedGemId) return null;

  const practicalInfoEntries = getPracticalInfoEntries(gem?.practicalInfo);

  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 360,
        background: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
        padding: '1rem',
        overflowY: 'auto',
        zIndex: 10,
      }}
    >
      <button
        type="button"
        onClick={() => setSelectedGemId(null)}
        style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.25rem' }}
      >
        ×
      </button>

      {gemLoading && <p>Loading...</p>}
      {gem && !gemLoading && (
        <>
          <h3 style={{ marginTop: 0 }}>{gem.title}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{gem.theme}</p>
          {gem.address && <p style={{ fontSize: '0.875rem' }}>📍 {gem.address}</p>}
          {gem.descriptionShort && <p>{gem.descriptionShort}</p>}

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #eee' }} />

          <h4 style={{ marginTop: 0 }}>Practical info</h4>
          {practicalInfoEntries.length > 0 ? (
            <dl style={{ margin: '0 0 1rem', fontSize: '0.875rem' }}>
              {practicalInfoEntries.map(([label, value]) => (
                <div key={label} style={{ marginBottom: '0.5rem' }}>
                  <dt style={{ fontWeight: 600 }}>{label}</dt>
                  <dd style={{ margin: '0.125rem 0 0' }}>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Practical info not found in the dataset.
            </p>
          )}

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #eee' }} />

          <h4 style={{ marginTop: 0 }}>Story</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.875rem' }} htmlFor="story-language">
              Language
            </label>
            <select
              id="story-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'en' | 'nl')}
              disabled={storyLoading}
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <option value="en">English</option>
              <option value="nl">Dutch</option>
            </select>
          </div>

          {story && (
            <>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                AI-generated from known POI facts. {story.source === 'cache' ? 'Cached result.' : 'Fresh result.'}
              </p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{story.storyText}</p>
            </>
          )}
          {!story && !storyLoading && !storyError && (
            <button
              type="button"
              onClick={() => refetchStory()}
              disabled={!gem}
              style={{
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: gem ? 'pointer' : 'not-allowed',
              }}
            >
              Generate AI story
            </button>
          )}
          {storyLoading && (
            <p style={{ fontSize: '0.875rem', color: '#2563eb' }}>
              Generating story from POI facts...
            </p>
          )}
          {storyError && (
            <>
              <p style={{ color: '#dc2626' }}>
                {storyErrorDetails instanceof Error
                  ? storyErrorDetails.message
                  : 'Failed to generate story'}
              </p>
              <button
                type="button"
                onClick={() => refetchStory()}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Retry story
              </button>
            </>
          )}

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #eee' }} />

          <ChatPanel gemId={gem.id} title={gem.title} theme={gem.theme} />
        </>
      )}
    </div>
  );
}

function getPracticalInfoEntries(practicalInfo?: Record<string, unknown>) {
  if (!practicalInfo) {
    return [];
  }

  return Object.entries(practicalInfo)
    .map(([key, value]) => {
      const formattedValue = formatPracticalInfoValue(value);
      if (!formattedValue) {
        return null;
      }

      return [humanizeKey(key), formattedValue] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));
}

function formatPracticalInfoValue(value: unknown): string | null {
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
      .filter((item): item is string => Boolean(item));

    return parts.length > 0 ? parts.join(', ') : null;
  }

  return null;
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (character) => character.toUpperCase())
    .trim();
}
