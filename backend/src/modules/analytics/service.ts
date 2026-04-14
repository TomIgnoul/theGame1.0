import { ALLOWED_THEMES } from '../../config/constants';
import { insertAnalyticsEvent } from './repo';
import type {
  AnalyticsEventInput,
  AnalyticsEventType,
  AnalyticsMetadata,
  AnalyticsMetadataValue,
  FrontendAnalyticsEventType,
  StoredAnalyticsEvent,
} from './types';
import {
  ANALYTICS_EVENT_TYPES,
  FRONTEND_ANALYTICS_EVENT_TYPES,
} from './types';

const UUID_PATTERN = /^[0-9a-f-]{36}$/i;
const MAX_STRING_VALUE_LENGTH = 120;

const METADATA_ALLOWLIST: Record<AnalyticsEventType, readonly string[]> = {
  route_generated: ['shape', 'kmTarget', 'kmResult', 'gemCount', 'warningCount'],
  route_generation_failed: ['shape', 'kmTarget', 'httpStatus', 'errorCode'],
  route_started: ['shape', 'kmTarget', 'kmResult', 'gemCount'],
  poi_detail_opened: [],
  filter_applied: [],
  story_generated: ['language', 'storySource'],
  stop_chat_opened: [],
  stop_chat_sent: ['hasSessionId'],
};

const FRONTEND_ALLOWED_KEYS: Record<
  FrontendAnalyticsEventType,
  readonly string[]
> = {
  filter_applied: ['eventType', 'theme'],
  route_started: ['eventType', 'theme', 'metadata'],
  stop_chat_opened: ['eventType', 'poiId', 'theme'],
};

type ParseResult =
  | { ok: true; event: AnalyticsEventInput }
  | { ok: false; code: string; error: string };
type MetadataParseResult =
  | { ok: true; metadata: AnalyticsMetadata | null }
  | { ok: false; code: string; error: string };

interface AnalyticsLogger {
  warn: (message: string, payload: Record<string, unknown>) => void;
}

// Implements FR-17 and FR-18 while enforcing the analytics data-minimization
// guardrails from GH-AN-05, GH-AN-06, and GH-AN-07.
export async function recordAnalyticsEvent(
  input: AnalyticsEventInput,
): Promise<void> {
  await insertAnalyticsEvent(normalizeAnalyticsEvent(input));
}

export async function recordAnalyticsEventSafe(
  input: AnalyticsEventInput,
  logger: AnalyticsLogger = console,
): Promise<boolean> {
  try {
    await recordAnalyticsEvent(input);
    return true;
  } catch {
    logger.warn('[analytics] write_failed', {
      eventType: input.eventType,
      source: input.source,
    });
    return false;
  }
}

export function parseFrontendAnalyticsEvent(
  payload: unknown,
): ParseResult {
  if (!isRecord(payload)) {
    return invalidPayload('Request body must be a JSON object');
  }

  const eventType = payload.eventType;
  if (
    typeof eventType !== 'string' ||
    !isFrontendAnalyticsEventType(eventType)
  ) {
    return {
      ok: false,
      code: 'invalid_event_type',
      error: `Unsupported analytics event type. Allowed values: ${FRONTEND_ANALYTICS_EVENT_TYPES.join(', ')}`,
    };
  }

  const allowedKeys = new Set(FRONTEND_ALLOWED_KEYS[eventType]);
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) {
      return invalidPayload(`Unexpected field: ${key}`);
    }
  }

  const theme = payload.theme;
  const poiId = payload.poiId;
  const metadata = payload.metadata;

  switch (eventType) {
    case 'filter_applied': {
      if (typeof theme !== 'string' || !isAllowedTheme(theme)) {
        return invalidPayload('theme is required and must be allowed');
      }

      return {
        ok: true,
        event: {
          eventType,
          theme,
          source: 'frontend',
        },
      };
    }
    case 'route_started': {
      if (typeof theme !== 'string' || !isAllowedTheme(theme)) {
        return invalidPayload('theme is required and must be allowed');
      }

      const parsedMetadata = parseStrictMetadata(eventType, metadata);
      if (!parsedMetadata.ok) {
        return parsedMetadata;
      }

      return {
        ok: true,
        event: {
          eventType,
          theme,
          resultStatus: 'started',
          source: 'frontend',
          metadata: parsedMetadata.metadata,
        },
      };
    }
    case 'stop_chat_opened': {
      if (typeof poiId !== 'string' || !UUID_PATTERN.test(poiId)) {
        return invalidPayload('poiId is required and must be a UUID');
      }

      if (
        theme != null &&
        (typeof theme !== 'string' || !isAllowedTheme(theme))
      ) {
        return invalidPayload('theme must be an allowed value');
      }

      return {
        ok: true,
        event: {
          eventType,
          poiId,
          theme: typeof theme === 'string' ? theme : null,
          source: 'frontend',
        },
      };
    }
  }
}

function normalizeAnalyticsEvent(
  input: AnalyticsEventInput,
): StoredAnalyticsEvent {
  if (!isAnalyticsEventType(input.eventType)) {
    throw new Error(`Invalid analytics event type: ${input.eventType}`);
  }

  if (input.routeId && !UUID_PATTERN.test(input.routeId)) {
    throw new Error('Invalid analytics routeId');
  }

  if (input.poiId && !UUID_PATTERN.test(input.poiId)) {
    throw new Error('Invalid analytics poiId');
  }

  if (
    input.stopNumber != null &&
    (!Number.isInteger(input.stopNumber) || input.stopNumber <= 0)
  ) {
    throw new Error('Invalid analytics stopNumber');
  }

  if (input.theme != null && !isAllowedTheme(input.theme)) {
    throw new Error('Invalid analytics theme');
  }

  return {
    ...input,
    routeId: input.routeId ?? null,
    poiId: input.poiId ?? null,
    stopNumber: input.stopNumber ?? null,
    theme: input.theme ?? null,
    resultStatus: normalizeString(input.resultStatus),
    metadata: sanitizeMetadata(input.eventType, input.metadata ?? null),
  };
}

function parseStrictMetadata(
  eventType: AnalyticsEventType,
  metadata: unknown,
): MetadataParseResult {
  if (metadata == null) {
    return { ok: true, metadata: null };
  }

  if (!isRecord(metadata)) {
    return invalidMetadataPayload('metadata must be an object');
  }

  const allowedKeys = new Set(METADATA_ALLOWLIST[eventType]);
  const parsed: AnalyticsMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!allowedKeys.has(key)) {
      return invalidMetadataPayload(`Unexpected metadata field: ${key}`);
    }

    if (!isAnalyticsMetadataValue(value)) {
      return invalidMetadataPayload(`Invalid metadata value for: ${key}`);
    }

    parsed[key] = normalizeMetadataValue(value);
  }

  return {
    ok: true,
    metadata: Object.keys(parsed).length > 0 ? parsed : null,
  };
}

function sanitizeMetadata(
  eventType: AnalyticsEventType,
  metadata: AnalyticsMetadata | null,
): AnalyticsMetadata | null {
  if (!metadata) {
    return null;
  }

  const allowedKeys = new Set(METADATA_ALLOWLIST[eventType]);
  const sanitized: AnalyticsMetadata = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!allowedKeys.has(key) || !isAnalyticsMetadataValue(value)) {
      continue;
    }

    sanitized[key] = normalizeMetadataValue(value);
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function normalizeMetadataValue(
  value: AnalyticsMetadataValue,
): AnalyticsMetadataValue {
  if (typeof value === 'string') {
    return value.trim().slice(0, MAX_STRING_VALUE_LENGTH);
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  return value;
}

function normalizeString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0
    ? normalized.slice(0, MAX_STRING_VALUE_LENGTH)
    : null;
}

function invalidPayload(error: string): ParseResult {
  return {
    ok: false,
    code: 'invalid_payload',
    error,
  };
}

function invalidMetadataPayload(error: string): MetadataParseResult {
  return {
    ok: false,
    code: 'invalid_payload',
    error,
  };
}

function isAllowedTheme(theme: string): boolean {
  return ALLOWED_THEMES.includes(
    theme as (typeof ALLOWED_THEMES)[number],
  );
}

function isAnalyticsEventType(value: string): value is AnalyticsEventType {
  return ANALYTICS_EVENT_TYPES.includes(value as AnalyticsEventType);
}

function isFrontendAnalyticsEventType(
  value: string,
): value is FrontendAnalyticsEventType {
  return FRONTEND_ANALYTICS_EVENT_TYPES.includes(
    value as FrontendAnalyticsEventType,
  );
}

function isAnalyticsMetadataValue(
  value: unknown,
): value is AnalyticsMetadataValue {
  return (
    value == null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
