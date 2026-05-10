import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useRouteStore } from '../../store/routeStore';
import { RouteConfigPanel } from './RouteConfigPanel';

describe('RouteConfigPanel', () => {
  afterEach(() => {
    useRouteStore.setState({
      theme: 'Culture',
      kmTarget: 8,
      shape: 'loop',
      start: null,
      end: null,
      routeResult: null,
      mapClickMode: null,
    });
  });

  it('shows route rendering proof text and numbered stops for generated routes', () => {
    useRouteStore.setState({
      routeResult: {
        shape: 'loop',
        kmTarget: 8,
        kmResult: 7.8,
        gems: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            title: 'Grand Place',
          },
          {
            id: '22222222-2222-4222-8222-222222222222',
            title: 'Hidden Courtyard',
          },
        ],
        polyline: 'encoded_polyline',
        warnings: [],
      },
    });

    render(<RouteConfigPanel />);

    expect(
      screen.getByText('Route proof: the route is shown as a line with numbered stops.'),
    ).toBeTruthy();
    expect(screen.getByText('Stop 1')).toBeTruthy();
    expect(screen.getByText(/Grand Place/)).toBeTruthy();
    expect(screen.getByText('Stop 2')).toBeTruthy();
    expect(screen.getByText(/Hidden Courtyard/)).toBeTruthy();
  });
});
