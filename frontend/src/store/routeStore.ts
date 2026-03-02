import { create } from 'zustand';
import type { RouteConfigState, RouteResultState } from '../types';

type MapClickMode = 'start' | 'end' | null;

interface RouteStore extends RouteConfigState {
  routeResult: RouteResultState | null;
  mapClickMode: MapClickMode;
  setMapClickMode: (mode: MapClickMode) => void;
  setTheme: (theme: string) => void;
  setKmTarget: (km: number) => void;
  setShape: (shape: 'loop' | 'a_to_b') => void;
  setStart: (start: { lat: number; lng: number } | null) => void;
  setEnd: (end: { lat: number; lng: number } | null) => void;
  setRouteResult: (result: RouteResultState | null) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  theme: 'Culture',
  kmTarget: 8,
  shape: 'loop',
  start: null,
  end: null,
  routeResult: null,
  mapClickMode: null,
  setMapClickMode: (mapClickMode) => set({ mapClickMode }),
  setTheme: (theme) => set({ theme }),
  setKmTarget: (kmTarget) => set({ kmTarget }),
  setShape: (shape) => set({ shape, end: shape === 'loop' ? null : null }),
  setStart: (start) => set({ start }),
  setEnd: (end) => set({ end }),
  setRouteResult: (routeResult) => set({ routeResult }),
}));
