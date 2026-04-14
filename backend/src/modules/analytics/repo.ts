import { pool } from '../../db';
import type { StoredAnalyticsEvent } from './types';

export async function insertAnalyticsEvent(
  event: StoredAnalyticsEvent,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO analytics_events (
         event_type,
         route_id,
         poi_id,
         stop_number,
         theme,
         result_status,
         source,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        event.eventType,
        event.routeId ?? null,
        event.poiId ?? null,
        event.stopNumber ?? null,
        event.theme ?? null,
        event.resultStatus ?? null,
        event.source,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ],
    );
  } finally {
    client.release();
  }
}
