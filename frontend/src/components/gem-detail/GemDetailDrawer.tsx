import { useQuery } from '@tanstack/react-query';
import { useGemDetailStore } from '../../store/gemDetailStore';
import { useRouteStore } from '../../store/routeStore';
import { gemsApi } from '../../api/client';

export function GemDetailDrawer() {
  const { selectedGemId, setSelectedGemId } = useGemDetailStore();
  const { theme } = useRouteStore();

  const { data: gem, isLoading: gemLoading } = useQuery({
    queryKey: ['gem', selectedGemId],
    queryFn: () => gemsApi.get(selectedGemId!),
    enabled: !!selectedGemId,
  });

  const {
    data: story,
    isLoading: storyLoading,
    isError: storyError,
    refetch: refetchStory,
  } = useQuery({
    queryKey: ['story', selectedGemId, theme],
    queryFn: () => gemsApi.story(selectedGemId!, theme, 'en'),
    enabled: false,
    retry: false,
  });

  if (!selectedGemId) return null;

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

          <h4 style={{ marginTop: 0 }}>Story</h4>
          {story && (
            <>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>AI-generated</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{story.storyText}</p>
            </>
          )}
          {!story && !storyLoading && !storyError && (
            <button
              type="button"
              onClick={() => refetchStory()}
              style={{
                padding: '0.5rem 1rem',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Generate AI story
            </button>
          )}
          {storyLoading && <p>Generating story...</p>}
          {storyError && (
            <>
              <p style={{ color: '#dc2626' }}>Failed to generate story</p>
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
                Retry
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
