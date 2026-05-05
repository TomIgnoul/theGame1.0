CREATE TABLE IF NOT EXISTS pearl_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_pearl_owners_name
  ON pearl_owners(name);

ALTER TABLE gems
  ADD COLUMN IF NOT EXISTS pearl_owner_id UUID REFERENCES pearl_owners(id);

CREATE INDEX IF NOT EXISTS idx_gems_pearl_owner_id
  ON gems(pearl_owner_id);

ALTER TABLE gems
  DROP CONSTRAINT IF EXISTS gems_manual_requires_pearl_owner;

-- Enforced for new/updated rows without scanning existing manual rows.
ALTER TABLE gems
  ADD CONSTRAINT gems_manual_requires_pearl_owner
  CHECK (source_type <> 'manual' OR pearl_owner_id IS NOT NULL)
  NOT VALID;
