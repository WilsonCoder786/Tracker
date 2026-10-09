import type { LiveStaffLocation, LocationPoint } from '../../types';

interface MockMapProps {
  markers?: LiveStaffLocation[];
  route?: LocationPoint[];
  selectedStaffId?: string | null;
  onSelect?: (staffId: string) => void;
}

function toPercent(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 70 + 15;
}

export function MockMap({ markers = [], route = [], selectedStaffId, onSelect }: MockMapProps) {
  const points = [
    ...markers.map((m) => ({ lat: m.lat, lng: m.lng })),
    ...route.map((r) => ({ lat: r.lat, lng: r.lng })),
  ];

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats, 24.84);
  const maxLat = Math.max(...lats, 24.89);
  const minLng = Math.min(...lngs, 66.98);
  const maxLng = Math.max(...lngs, 67.05);

  return (
    <div className="mock-map" aria-label="Map preview with mock coordinates">
      {route.length > 1
        ? route.map((point, index) => {
            if (index === 0) return null;
            const prev = route[index - 1];
            const x1 = toPercent(prev.lng, minLng, maxLng);
            const y1 = 100 - toPercent(prev.lat, minLat, maxLat);
            const x2 = toPercent(point.lng, minLng, maxLng);
            const y2 = 100 - toPercent(point.lat, minLat, maxLat);
            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            return (
              <div
                key={`line-${point.id}`}
                style={{
                  position: 'absolute',
                  left: `${x1}%`,
                  top: `${y1}%`,
                  width: `${length}%`,
                  height: 3,
                  background: 'rgba(15, 118, 110, 0.7)',
                  transformOrigin: '0 50%',
                  transform: `rotate(${angle}deg)`,
                  borderRadius: 2,
                }}
              />
            );
          })
        : null}

      {route.map((point, index) => (
        <div
          key={point.id}
          className="map-marker recent"
          title={`Point ${index + 1}`}
          style={{
            left: `${toPercent(point.lng, minLng, maxLng)}%`,
            top: `${100 - toPercent(point.lat, minLat, maxLat)}%`,
            width: index === 0 || index === route.length - 1 ? 18 : 12,
            height: index === 0 || index === route.length - 1 ? 18 : 12,
          }}
        />
      ))}

      {markers.map((marker) => {
        const stateClass =
          marker.locationState === 'RECENT' || marker.locationState === 'TRACKING'
            ? 'recent'
            : marker.locationState === 'STALE'
              ? 'stale'
              : marker.locationState === 'OFFLINE'
                ? 'offline'
                : 'not-tracking';

        return (
          <button
            key={marker.staffId}
            type="button"
            className={`map-marker ${stateClass} ${selectedStaffId === marker.staffId ? 'selected' : ''}`}
            style={{
              left: `${toPercent(marker.lng, minLng, maxLng)}%`,
              top: `${100 - toPercent(marker.lat, minLat, maxLat)}%`,
            }}
            title={marker.staffName}
            onClick={() => onSelect?.(marker.staffId)}
          />
        );
      })}

      <div className="map-legend">
        <span className="legend-item">
          <span className="dot" style={{ background: '#16a34a' }} /> Recent
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#ea580c' }} /> Stale
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#dc2626' }} /> Offline
        </span>
        <span className="legend-item">
          <span className="dot" style={{ background: '#94a3b8' }} /> Not tracking
        </span>
      </div>
    </div>
  );
}
