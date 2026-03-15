# 3.2 Database Design (PostgreSQL)

### Database keuze

- **PostgreSQL** als centrale database.
- Draait in **Docker** zodat elke teammember dezelfde omgeving kan starten.

### Data strategie (afgestemd op `docs/mcd.md`)

We gebruiken **één** Postgres database met een **app-georiënteerd schema** dat direct aansluit op de implementatie in `docs/mcd.md`. Geen aparte `raw`/`app` schema-split; sanitisatie gebeurt vóór insert in de app-tabellen.

### Tabellen (MVP)

#### `datasets` — dataset provenance

Doel: vastleggen welke bron-data is ingeladen (Open Data Brussels of andere).

- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `name` TEXT NOT NULL
- `source_url` TEXT NOT NULL          -- dataset page/API endpoint
- `license_url` TEXT                  -- dataset license reference
- `last_synced_at` TIMESTAMP
- `created_at` TIMESTAMP DEFAULT NOW()

#### `gems` — genormaliseerde POI records

Doel: project-owned “Gem” entiteiten voor de applicatie.

- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `dataset_id` UUID REFERENCES datasets(id)
- `external_id` TEXT                  -- original id in dataset (if any)
- `title` TEXT NOT NULL
- `theme` TEXT NOT NULL               -- MVP: single theme per gem
- `description_short` TEXT
- `address` TEXT
- `latitude` NUMERIC(9,6) NOT NULL
- `longitude` NUMERIC(9,6) NOT NULL
- `practical_info` JSONB              -- hours/contact/website/etc if available
- `source_type` TEXT NOT NULL CHECK (source_type IN ('open_data','manual'))
- `is_active` BOOLEAN NOT NULL DEFAULT TRUE
- `created_at` TIMESTAMP DEFAULT NOW()
- `updated_at` TIMESTAMP DEFAULT NOW()

Belangrijke constraints/indexen:

- `UNIQUE (dataset_id, external_id)`
- `CREATE INDEX idx_gems_theme ON gems(theme);`
- `CREATE INDEX idx_gems_lat_lng ON gems(latitude, longitude);`

#### `gem_stories` — AI story cache

Doel: onnodige her-generatie van verhalen vermijden.

- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `gem_id` UUID REFERENCES gems(id) ON DELETE CASCADE
- `theme` TEXT NOT NULL
- `language` TEXT NOT NULL DEFAULT 'en'
- `prompt_version` TEXT NOT NULL DEFAULT 'v1'
- `story_text` TEXT NOT NULL
- `created_at` TIMESTAMP DEFAULT NOW()

Constraint:

- `UNIQUE (gem_id, theme, language, prompt_version)`

#### `route_logs` — optioneel, debug/analytics

Doel: enkel voor debugging/analytics; de gebruikers-flow blijft **stateless** (routes hoeven niet persistenter opgeslagen te worden voor MVP).

- `id` UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
- `theme` TEXT NOT NULL
- `km_target` NUMERIC(5,2) NOT NULL
- `shape` TEXT NOT NULL CHECK (shape IN ('loop','a_to_b'))
- `start_lat` NUMERIC(9,6) NOT NULL
- `start_lng` NUMERIC(9,6) NOT NULL
- `end_lat` NUMERIC(9,6)
- `end_lng` NUMERIC(9,6)
- `gems_selected` JSONB               -- array van gem UUIDs
- `km_result` NUMERIC(6,2)
- `status` TEXT NOT NULL DEFAULT 'created'
- `error_message` TEXT
- `created_at` TIMESTAMP DEFAULT NOW()

Index:

- `CREATE INDEX idx_route_logs_created_at ON route_logs(created_at);`

### ETL / Sanitisatie

- Sanitisatie en mapping gebeuren via scripts in het backend-ecosysteem (Node.js/TypeScript), in lijn met `docs/mcd.md`.
- Flow (conceptueel):
  1. Ingest Open Data Brussels dataset(s) naar tijdelijke structuur in code.
  2. Map naar `datasets` + `gems` schema (upsert op combinatie `dataset_id` + `external_id`).
- Basisregels:
  - lat/lng niet parseerbaar → skip + log.
  - titel/naam leeg → skip + log.
  - categorie die niet mapbaar is naar theme → default theme `Culture` + log (“defaulted_theme”).

### Privacy constraint (link met NFR-S2)

- **Geen chat logs** in DB.
- Alleen `datasets`, `gems`, `gem_stories` en optioneel `route_logs` worden opgeslagen.
- Chatinput/-output blijft stateless en wordt niet persistenter opgeslagen.