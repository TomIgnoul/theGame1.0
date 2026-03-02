import { MapView } from '../components/map/MapView';
import { RouteConfigPanel } from '../components/route-config/RouteConfigPanel';
import { GemDetailDrawer } from '../components/gem-detail/GemDetailDrawer';

export function MapPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Hidden Gems Brussels</h1>
      </header>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside style={{ width: 320, padding: '1rem', borderRight: '1px solid #eee', overflowY: 'auto' }}>
          <RouteConfigPanel />
        </aside>
        <main style={{ flex: 1, position: 'relative' }}>
          <MapView />
          <GemDetailDrawer />
        </main>
      </div>
    </div>
  );
}
