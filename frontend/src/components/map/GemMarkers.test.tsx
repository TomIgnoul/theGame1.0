import { render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { GemPin } from '../../types';
import { GemMarkers } from './GemMarkers';
import { isAdminCreatedPearl } from './markerUtils';

const OPEN_DATA_GEM: GemPin = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Grand Place',
  theme: 'Culture',
  latitude: 50.8467,
  longitude: 4.3525,
  address: 'Brussels',
  practicalInfo: {},
  sourceType: 'open_data',
};

const MANUAL_PEARL: GemPin = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Hidden Courtyard',
  theme: 'Culture',
  latitude: 50.8472,
  longitude: 4.353,
  address: 'Rue Example 12, Brussels',
  practicalInfo: {},
  sourceType: 'manual',
};

let createdMarkers: FakeMarker[] = [];

class FakeSize {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}

class FakePoint {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

class FakeMarker {
  options: google.maps.MarkerOptions;
  listeners = new Map<string, () => void>();
  setMap = vi.fn();

  constructor(options: google.maps.MarkerOptions) {
    this.options = options;
    createdMarkers.push(this);
  }

  addListener(eventName: string, listener: () => void) {
    this.listeners.set(eventName, listener);
    return { remove: vi.fn() } as google.maps.MapsEventListener;
  }
}

describe('GemMarkers', () => {
  beforeEach(() => {
    createdMarkers = [];
    vi.stubGlobal('google', {
      maps: {
        Marker: FakeMarker,
        Size: FakeSize,
        Point: FakePoint,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('detects admin-created Pearls from the persisted manual source type', () => {
    expect(isAdminCreatedPearl(OPEN_DATA_GEM)).toBe(false);
    expect(isAdminCreatedPearl(MANUAL_PEARL)).toBe(true);
  });

  it('keeps default pins for open-data POIs and uses the pearl icon for manual Pearls', () => {
    const onSelectGem = vi.fn();

    render(
      <GemMarkers
        map={{} as google.maps.Map}
        gems={[OPEN_DATA_GEM, MANUAL_PEARL]}
        onSelectGem={onSelectGem}
      />,
    );

    expect(createdMarkers).toHaveLength(2);
    expect(createdMarkers[0].options.icon).toBeUndefined();

    const pearlIcon = createdMarkers[1].options.icon as google.maps.Icon;
    expect(pearlIcon.url).toContain('image/svg+xml');
    expect(pearlIcon.scaledSize).toMatchObject({ width: 34, height: 40 });
    expect(pearlIcon.anchor).toMatchObject({ x: 17, y: 40 });

    const clickListener = createdMarkers[1].listeners.get('click');
    expect(clickListener).toBeDefined();
    clickListener?.();

    expect(onSelectGem).toHaveBeenCalledWith(MANUAL_PEARL.id);
  });
});
