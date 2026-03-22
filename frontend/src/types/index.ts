export type RouteShape = 'loop' | 'a_to_b';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GemPin {
  id: string;
  title: string;
  theme: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  practicalInfo?: Record<string, unknown>;
}

export interface Gem {
  id: string;
  title: string;
  theme: string;
  descriptionShort?: string | null;
  address?: string | null;
  latitude: number;
  longitude: number;
  practicalInfo?: Record<string, unknown>;
  sourceType: string;
}

export interface RouteConfigState {
  theme: string;
  kmTarget: number;
  shape: RouteShape;
  start: LatLng | null;
  end: LatLng | null;
}

export interface RouteResultState {
  kmTarget: number;
  kmResult: number;
  shape: RouteShape;
  gems: Array<{ id: string; title: string }>;
  polyline: string;
  warnings: string[];
}

export interface StoryState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  text?: string;
  error?: string;
}

export interface StoryResponse {
  gemId: string;
  theme: string;
  language: 'en' | 'nl';
  promptVersion: string;
  storyText: string;
  source: 'cache' | 'generated';
}
