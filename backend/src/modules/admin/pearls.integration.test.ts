import assert from 'node:assert/strict';
import test from 'node:test';
import { pool } from '../../db';
import { loadRouteCandidateGems } from '../routes/routes.service';
import {
  createAdminPearl,
  createPearlOwner,
  type AddPearlTheme,
} from './pearls.service';

const OWNER_ID = '22222222-2222-4222-8222-222222222222';
const PEARL_ID = '33333333-3333-4333-8333-333333333333';

interface StoredPearlOwner {
  id: string;
  name: string;
}

interface StoredGem {
  id: string;
  pearlOwnerId: string;
  title: string;
  theme: AddPearlTheme;
  descriptionShort: string;
  address: string;
  latitude: number;
  longitude: number;
  practicalInfo: Record<string, unknown> | null;
  sourceType: 'manual';
  isActive: boolean;
}

interface FakeState {
  owners: StoredPearlOwner[];
  gems: StoredGem[];
}

type QueryParams = readonly unknown[];

interface QueryResult<Row> {
  rows: Row[];
}

interface FakePoolClient {
  query<Row = Record<string, unknown>>(
    sql: string,
    params?: QueryParams,
  ): Promise<QueryResult<Row>>;
  release(): void;
}

interface PoolConnectTarget {
  connect: () => Promise<FakePoolClient>;
}

test('admin-created Pearl is persisted as one active manual gem and appears in route candidates', async () => {
  const state: FakeState = {
    owners: [],
    gems: [],
  };
  const fakeClient = createFakeClient(state);
  const connectTarget = pool as unknown as PoolConnectTarget;
  const originalConnect = connectTarget.connect;
  connectTarget.connect = async () => fakeClient;

  try {
    const owner = await createPearlOwner({ name: 'Visit Brussels' });
    const pearl = await createAdminPearl({
      name: 'Hidden Courtyard',
      story: 'A small story about a quiet courtyard in Brussels.',
      address: 'Rue Example 12, Brussels',
      theme: 'Culture',
      latitude: 50.8467,
      longitude: 4.3525,
      pearlOwnerId: owner.id,
    });

    assert.equal(state.owners.length, 1);
    assert.equal(state.gems.length, 1);
    assert.equal(state.gems[0].pearlOwnerId, owner.id);
    assert.equal(state.gems[0].sourceType, 'manual');
    assert.equal(state.gems[0].isActive, true);
    assert.equal(pearl.pearlOwner.id, owner.id);
    assert.equal(pearl.isRouteCandidate, true);

    const routeCandidates = await loadRouteCandidateGems('Culture');
    assert.deepEqual(routeCandidates, [
      {
        id: PEARL_ID,
        title: 'Hidden Courtyard',
        latitude: 50.8467,
        longitude: 4.3525,
      },
    ]);
  } finally {
    connectTarget.connect = originalConnect;
  }
});

function createFakeClient(state: FakeState): FakePoolClient {
  return {
    async query<Row = Record<string, unknown>>(
      sql: string,
      params: QueryParams = [],
    ) {
      const normalizedSql = sql.replace(/\s+/g, ' ').trim();

      if (
        normalizedSql === 'BEGIN' ||
        normalizedSql === 'COMMIT' ||
        normalizedSql === 'ROLLBACK'
      ) {
        return asRows<Row>([]);
      }

      if (normalizedSql.startsWith('INSERT INTO pearl_owners')) {
        const name = readStringParam(params, 0);
        if (state.owners.some((owner) => owner.name === name)) {
          return asRows<Row>([]);
        }

        const owner = { id: OWNER_ID, name };
        state.owners.push(owner);
        return asRows<Row>([owner]);
      }

      if (normalizedSql.startsWith('SELECT id, name FROM pearl_owners WHERE id = $1')) {
        const ownerId = readStringParam(params, 0);
        return asRows<Row>(
          state.owners.filter((owner) => owner.id === ownerId),
        );
      }

      if (normalizedSql.startsWith('INSERT INTO gems')) {
        const gem: StoredGem = {
          id: PEARL_ID,
          pearlOwnerId: readStringParam(params, 0),
          title: readStringParam(params, 1),
          theme: readStringParam(params, 2) as AddPearlTheme,
          descriptionShort: readStringParam(params, 3),
          address: readStringParam(params, 4),
          latitude: readNumberParam(params, 5),
          longitude: readNumberParam(params, 6),
          practicalInfo: null,
          sourceType: 'manual',
          isActive: true,
        };

        state.gems.push(gem);
        return asRows<Row>([
          {
            id: gem.id,
            title: gem.title,
            descriptionShort: gem.descriptionShort,
            address: gem.address,
            theme: gem.theme,
            latitude: gem.latitude,
            longitude: gem.longitude,
            isActive: gem.isActive,
          },
        ]);
      }

      if (
        normalizedSql.startsWith(
          'SELECT id, title, theme, latitude, longitude, address, practical_info as "practicalInfo" FROM gems WHERE is_active = true',
        )
      ) {
        const theme = params.length > 0 ? readStringParam(params, 0) : null;
        const gems = state.gems
          .filter((gem) => gem.isActive)
          .filter((gem) => !theme || gem.theme === theme)
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((gem) => ({
            id: gem.id,
            title: gem.title,
            theme: gem.theme,
            latitude: gem.latitude,
            longitude: gem.longitude,
            address: gem.address,
            practicalInfo: gem.practicalInfo,
          }));

        return asRows<Row>(gems);
      }

      throw new Error(`Unhandled fake SQL: ${normalizedSql}`);
    },
    release() {
      return undefined;
    },
  };
}

function readStringParam(params: QueryParams, index: number) {
  const value = params[index];
  assert.equal(typeof value, 'string');
  return value;
}

function readNumberParam(params: QueryParams, index: number) {
  const value = params[index];
  assert.equal(typeof value, 'number');
  return value;
}

function asRows<Row>(rows: unknown[]): QueryResult<Row> {
  return { rows: rows as Row[] };
}
