import { pool } from '../../db';

const DATASET_CONFIG = {
  id: 'bruxelles_lieux_culturels',
  name: 'Cultural places - City of Brussels',
  sourceUrl: 'https://opendata.brussels.be/explore/dataset/bruxelles_lieux_culturels/',
  apiUrl: 'https://opendata.brussels.be/api/explore/v2.0/catalog/datasets/bruxelles_lieux_culturels/records',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/deed.en',
  theme: 'Culture',
} as const;

interface OdsRecord {
  record: {
    id: string;
    fields: {
      description?: string;
      adresse?: string;
      coordonnees_geographiques?: { lat: number; lon: number };
      google_maps?: string;
    };
  };
}

export interface SyncResult {
  datasetsSynced: number;
  gemsUpserted: number;
  gemsDeactivated: number;
}

export async function syncDatasets(): Promise<SyncResult> {
  const client = await pool.connect();
  let datasetsSynced = 0;
  let gemsUpserted = 0;

  try {
    const res = await fetch(`${DATASET_CONFIG.apiUrl}?limit=100`);
    if (!res.ok) throw new Error(`Dataset fetch failed: ${res.status}`);
    const data = (await res.json()) as { records?: OdsRecord[] };
    const records = data.records ?? [];

    let datasetId: string;
    const { rows: existing } = await client.query<{ id: string }>(
      `SELECT id FROM datasets WHERE name = $1 LIMIT 1`,
      [DATASET_CONFIG.name]
    );
    if (existing.length > 0) {
      datasetId = existing[0].id;
    } else {
      const { rows: inserted } = await client.query(
        `INSERT INTO datasets (name, source_url, license_url) VALUES ($1, $2, $3) RETURNING id`,
        [DATASET_CONFIG.name, DATASET_CONFIG.sourceUrl, DATASET_CONFIG.licenseUrl]
      );
      datasetId = inserted[0].id;
    }
    datasetsSynced = 1;

    const externalIds: string[] = [];

    for (const { record } of records) {
      const coords = record.fields?.coordonnees_geographiques;
      if (!coords || typeof coords.lat !== 'number' || typeof coords.lon !== 'number') continue;

      const lat = Number(coords.lat);
      const lng = Number(coords.lon);
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

      const title = record.fields?.description ?? 'Unknown';
      const address = record.fields?.adresse ?? null;
      const externalId = record.id;

      externalIds.push(externalId);

      const { rowCount } = await client.query(
        `INSERT INTO gems (dataset_id, external_id, title, theme, address, latitude, longitude, source_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'open_data')
         ON CONFLICT (dataset_id, external_id) DO UPDATE SET
           title = EXCLUDED.title,
           address = EXCLUDED.address,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           updated_at = NOW()`,
        [datasetId, externalId, title, DATASET_CONFIG.theme, address, lat, lng]
      );
      if (rowCount && rowCount > 0) gemsUpserted++;
    }

    await client.query(
      `UPDATE datasets SET last_synced_at = NOW() WHERE id = $1`,
      [datasetId]
    );

    const gemsDeactivated = await deactivateMissing(client, datasetId, externalIds);

    return { datasetsSynced, gemsUpserted, gemsDeactivated };
  } finally {
    client.release();
  }
}

async function deactivateMissing(
  client: { query: (q: string, p?: unknown[]) => Promise<{ rowCount?: number }> },
  datasetId: string,
  externalIds: string[]
): Promise<number> {
  if (externalIds.length === 0) return 0;
  const placeholders = externalIds.map((_, i) => `$${i + 2}`).join(',');
  const { rowCount } = await client.query(
    `UPDATE gems SET is_active = false WHERE dataset_id = $1 AND external_id NOT IN (${placeholders})`,
    [datasetId, ...externalIds]
  );
  return rowCount ?? 0;
}
