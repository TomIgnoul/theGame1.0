CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license_url TEXT,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  external_id TEXT,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description_short TEXT,
  address TEXT,
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  practical_info JSONB,
  source_type TEXT NOT NULL CHECK (source_type IN ('open_data', 'manual')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (dataset_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_gems_theme ON gems(theme);
CREATE INDEX IF NOT EXISTS idx_gems_lat_lng ON gems(latitude, longitude);

CREATE TABLE IF NOT EXISTS gem_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gem_id UUID REFERENCES gems(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  story_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (gem_id, theme, language, prompt_version)
);

CREATE TABLE IF NOT EXISTS route_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,
  km_target NUMERIC(5,2) NOT NULL,
  shape TEXT NOT NULL CHECK (shape IN ('loop', 'a_to_b')),
  start_lat NUMERIC(9,6) NOT NULL,
  start_lng NUMERIC(9,6) NOT NULL,
  end_lat NUMERIC(9,6),
  end_lng NUMERIC(9,6),
  gems_selected JSONB,
  km_result NUMERIC(6,2),
  status TEXT NOT NULL DEFAULT 'created',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_logs_created_at ON route_logs(created_at);
