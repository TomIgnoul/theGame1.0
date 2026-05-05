import { pool } from '../../db';

export const ADD_PEARL_ALLOWED_THEMES = [
  'War',
  'Museum',
  'Streetart',
  'Food',
  'Culture',
] as const;

export type AddPearlTheme = (typeof ADD_PEARL_ALLOWED_THEMES)[number];

export interface PearlOwner {
  id: string;
  name: string;
}

export interface CreatePearlOwnerInput {
  name: string;
}

export interface CreatePearlInput {
  name: string;
  story: string;
  address: string;
  theme: AddPearlTheme;
  latitude: number;
  longitude: number;
  pearlOwnerId: string;
}

export interface CreatedPearl {
  id: string;
  name: string;
  story: string;
  address: string;
  theme: AddPearlTheme;
  latitude: number;
  longitude: number;
  pearlOwner: PearlOwner;
  isRouteCandidate: boolean;
}

type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code: string };

interface CreatedPearlRow {
  id: string;
  title: string;
  descriptionShort: string;
  address: string;
  theme: AddPearlTheme;
  latitude: string | number;
  longitude: string | number;
  isActive: boolean;
}

export class AdminPearlServiceError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AdminPearlServiceError';
  }
}

export function parseCreatePearlOwnerInput(
  body: unknown,
): ParseResult<CreatePearlOwnerInput> {
  const name = readRequiredString(body, 'name');
  if (!name) {
    return {
      ok: false,
      error: 'name is required',
      code: 'missing_pearl_owner_name',
    };
  }

  return { ok: true, value: { name } };
}

export function parseCreatePearlInput(
  body: unknown,
): ParseResult<CreatePearlInput> {
  const name = readRequiredString(body, 'name');
  if (!name) {
    return { ok: false, error: 'name is required', code: 'missing_name' };
  }

  const story = readRequiredString(body, 'story');
  if (!story) {
    return { ok: false, error: 'story is required', code: 'missing_story' };
  }

  const address = readRequiredString(body, 'address');
  if (!address) {
    return { ok: false, error: 'address is required', code: 'missing_address' };
  }

  const theme = readRequiredString(body, 'theme');
  if (!isValidAddPearlTheme(theme)) {
    return {
      ok: false,
      error: `theme must be one of: ${ADD_PEARL_ALLOWED_THEMES.join(', ')}`,
      code: 'invalid_theme',
    };
  }

  const latitude = readNumber(body, 'latitude');
  if (latitude === null || latitude < -90 || latitude > 90) {
    return {
      ok: false,
      error: 'latitude must be a number between -90 and 90',
      code: 'invalid_latitude',
    };
  }

  const longitude = readNumber(body, 'longitude');
  if (longitude === null || longitude < -180 || longitude > 180) {
    return {
      ok: false,
      error: 'longitude must be a number between -180 and 180',
      code: 'invalid_longitude',
    };
  }

  const pearlOwnerId = readRequiredString(body, 'pearlOwnerId');
  if (!isUuid(pearlOwnerId)) {
    return {
      ok: false,
      error: 'pearlOwnerId must be a valid UUID',
      code: 'invalid_pearl_owner_id',
    };
  }

  return {
    ok: true,
    value: {
      name,
      story,
      address,
      theme,
      latitude,
      longitude,
      pearlOwnerId,
    },
  };
}

export async function listPearlOwners(query?: string): Promise<PearlOwner[]> {
  const trimmedQuery = query?.trim();
  const client = await pool.connect();

  try {
    const result = trimmedQuery
      ? await client.query<PearlOwner>(
          `SELECT id, name
           FROM pearl_owners
           WHERE name ILIKE $1
           ORDER BY lower(name), name
           LIMIT 50`,
          [`%${trimmedQuery}%`],
        )
      : await client.query<PearlOwner>(
          `SELECT id, name
           FROM pearl_owners
           ORDER BY lower(name), name
           LIMIT 50`,
        );

    return result.rows;
  } finally {
    client.release();
  }
}

export async function createPearlOwner(
  input: CreatePearlOwnerInput,
): Promise<PearlOwner> {
  const client = await pool.connect();

  try {
    const { rows } = await client.query<PearlOwner>(
      `INSERT INTO pearl_owners (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING id, name`,
      [input.name],
    );

    if (rows.length === 0) {
      throw new AdminPearlServiceError(
        409,
        'pearl_owner_already_exists',
        'PearlOwner already exists',
      );
    }

    return rows[0];
  } finally {
    client.release();
  }
}

export async function createAdminPearl(
  input: CreatePearlInput,
): Promise<CreatedPearl> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: ownerRows } = await client.query<PearlOwner>(
      `SELECT id, name FROM pearl_owners WHERE id = $1`,
      [input.pearlOwnerId],
    );

    if (ownerRows.length === 0) {
      throw new AdminPearlServiceError(
        404,
        'pearl_owner_not_found',
        'PearlOwner not found',
      );
    }

    const { rows: pearlRows } = await client.query<CreatedPearlRow>(
      `INSERT INTO gems (
         pearl_owner_id,
         title,
         theme,
         description_short,
         address,
         latitude,
         longitude,
         source_type,
         is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual', true)
       RETURNING
         id,
         title,
         description_short as "descriptionShort",
         address,
         theme,
         latitude,
         longitude,
         is_active as "isActive"`,
      [
        input.pearlOwnerId,
        input.name,
        input.theme,
        input.story,
        input.address,
        input.latitude,
        input.longitude,
      ],
    );

    await client.query('COMMIT');

    const pearl = pearlRows[0];
    return {
      id: pearl.id,
      name: pearl.title,
      story: pearl.descriptionShort,
      address: pearl.address,
      theme: pearl.theme,
      latitude: Number(pearl.latitude),
      longitude: Number(pearl.longitude),
      pearlOwner: ownerRows[0],
      isRouteCandidate: pearl.isActive,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function readRequiredString(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) {
    return '';
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

function readNumber(body: unknown, key: string) {
  if (!body || typeof body !== 'object' || !(key in body)) {
    return null;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isValidAddPearlTheme(value: string): value is AddPearlTheme {
  return ADD_PEARL_ALLOWED_THEMES.includes(value as AddPearlTheme);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
