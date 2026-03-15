import { MapView } from '../components/map/MapView';
import { RouteConfigPanel } from '../components/route-config/RouteConfigPanel';
import { GemDetailDrawer } from '../components/gem-detail/GemDetailDrawer';

export function MapPage() {
  return (
    <div className="map-page">
      <header className="map-page__header">
        <h1 className="map-page__title">Hidden Gems Brussels</h1>
      </header>
      <div className="map-page__content">
        <aside className="map-page__sidebar">
          <RouteConfigPanel />
        </aside>
        <main className="map-page__main">
          <MapView />
          <GemDetailDrawer />
        </main>
      </div>
    </div>
  );
}
