CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'route_generated',
      'route_generation_failed',
      'route_started',
      'poi_detail_opened',
      'filter_applied',
      'story_generated',
      'stop_chat_opened',
      'stop_chat_sent'
    )
  ),
  route_id UUID,
  poi_id UUID REFERENCES gems(id) ON DELETE SET NULL,
  stop_number INTEGER CHECK (stop_number IS NULL OR stop_number > 0),
  theme TEXT,
  result_status TEXT,
  source TEXT CHECK (source IN ('backend', 'frontend')),
  metadata JSONB CHECK (metadata IS NULL OR jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred_at
  ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
  ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_theme
  ON analytics_events(theme);
CREATE INDEX IF NOT EXISTS idx_analytics_events_poi_id
  ON analytics_events(poi_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_route_id
  ON analytics_events(route_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_occurred_at
  ON analytics_events(event_type, occurred_at);

COMMENT ON TABLE analytics_events IS
  'Dedicated analytics storage for admin portal queries. No chat bodies, AI answers, request bodies, or direct PII.';

COMMENT ON COLUMN analytics_events.metadata IS
  'Safe non-PII analytics metadata only.';
