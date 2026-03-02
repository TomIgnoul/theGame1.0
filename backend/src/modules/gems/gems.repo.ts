import { pool } from '../../db';
import { ALLOWED_THEMES } from '../../config/constants';

export interface GemPin {
  id: string;
  title: string;
  theme: string;
  latitude: number;
  longitude: number;
  address: string | null;
  practicalInfo: Record<string, unknown>;
}

export interface Gem {
  id: string;
  title: string;
  theme: string;
  descriptionShort: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  practicalInfo: Record<string, unknown>;
  sourceType: string;
}

export function isValidTheme(theme: string): theme is (typeof ALLOWED_THEMES)[number] {
  return ALLOWED_THEMES.includes(theme as (typeof ALLOWED_THEMES)[number]);
}

export async function findByTheme(theme?: string): Promise<GemPin[]> {
  const client = await pool.connect();
  try {
    let query = `
      SELECT id, title, theme, latitude, longitude, address, practical_info as "practicalInfo"
      FROM gems WHERE is_active = true
    `;
    const params: unknown[] = [];
    if (theme) {
      query += ` AND theme = $1`;
      params.push(theme);
    }
    query += ` ORDER BY title`;

    const { rows } = await client.query(query, params);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      theme: r.theme,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      address: r.address,
      practicalInfo: r.practicalInfo ?? {},
    }));
  } finally {
    client.release();
  }
}

export async function findById(id: string): Promise<Gem | null> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, title, theme, description_short as "descriptionShort", address, latitude, longitude, practical_info as "practicalInfo", source_type as "sourceType"
       FROM gems WHERE id = $1 AND is_active = true`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      title: r.title,
      theme: r.theme,
      descriptionShort: r.descriptionShort,
      address: r.address,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      practicalInfo: r.practicalInfo ?? {},
      sourceType: r.sourceType,
    };
  } finally {
    client.release();
  }
}
