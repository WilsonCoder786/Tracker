import { useEffect, useRef, useState } from 'react';
import { MAPS_API_KEY } from '../../lib/config';
import { hasPosition, locationLabel } from '../../lib/format';
import type { LiveStaffLocation, LocationPoint } from '../../types';

interface LiveMapProps {
  markers?: LiveStaffLocation[];
  route?: LocationPoint[];
  selectedStaffId?: string | null;
  onSelect?: (staffId: string) => void;
}

type GoogleMaps = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => {
      fitBounds: (bounds: unknown) => void;
      setCenter: (point: { lat: number; lng: number }) => void;
      setZoom: (zoom: number) => void;
    };
    Marker: new (opts: Record<string, unknown>) => {
      setMap: (map: unknown) => void;
      addListener: (name: string, fn: () => void) => void;
    };
    Polyline: new (opts: Record<string, unknown>) => { setMap: (map: unknown) => void };
    LatLngBounds: new () => { extend: (point: { lat: number; lng: number }) => void };
  };
};

let mapsLoader: Promise<GoogleMaps> | null = null;

function loadMaps() {
  const existing = (window as Window & { google?: GoogleMaps }).google;
  if (existing?.maps) return Promise.resolve(existing);
  if (!mapsLoader) {
    mapsLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}`;
      script.async = true;
      script.onload = () => {
        const google = (window as Window & { google?: GoogleMaps }).google;
        if (google?.maps) resolve(google);
        else reject(new Error('Google Maps did not load'));
      };
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    });
  }
  return mapsLoader;
}

function markerColor(state: string) {
  if (state === 'OFFLINE') return '#dc2626';
  if (state === 'STALE') return '#ea580c';
  if (state === 'RECENT' || state === 'TRACKING') return '#16a34a';
  return '#94a3b8';
}

export function LiveMap(props: LiveMapProps) {
  const [failed, setFailed] = useState(false);
  const node = useRef<HTMLDivElement>(null);
  const markers = props.markers ?? [];
  const route = props.route ?? [];
  const signature = JSON.stringify({
    markers: markers.map((marker) => [marker.staffId, marker.lat, marker.lng, marker.locationState]),
    route: route.map((point) => [point.id, point.lat, point.lng]),
  });
  const dataRef = useRef(props);
  dataRef.current = props;

  useEffect(() => {
    const win = window as Window & { gm_authFailure?: () => void };
    const previous = win.gm_authFailure;
    win.gm_authFailure = () => setFailed(true);
    return () => {
      win.gm_authFailure = previous;
    };
  }, []);

  useEffect(() => {
    if (!node.current || failed) return;
    const { markers: liveMarkers = [], route: liveRoute = [], onSelect } = dataRef.current;
    let cancelled = false;
    const drawn: Array<{ setMap: (map: unknown) => void }> = [];
    void loadMaps()
      .then((google) => {
        if (cancelled || !node.current) return;
        const map = new google.maps.Map(node.current, {
          center: { lat: 24.8607, lng: 67.0011 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });
        const bounds = new google.maps.LatLngBounds();
        const route = liveRoute.filter((point) => hasPosition(point.lat, point.lng));
        let placed = route.length;
        if (route.length > 1) {
          drawn.push(
            new google.maps.Polyline({
              map,
              path: route.map((point) => ({ lat: point.lat, lng: point.lng })),
              strokeColor: '#0f766e',
              strokeWeight: 4,
            }),
          );
        }
        for (const point of route) bounds.extend({ lat: point.lat, lng: point.lng });
        for (const marker of liveMarkers) {
          if (!hasPosition(marker.lat, marker.lng)) continue;
          placed += 1;
          bounds.extend({ lat: marker.lat, lng: marker.lng });
          const pin = new google.maps.Marker({
            map,
            position: { lat: marker.lat, lng: marker.lng },
            title: `${marker.staffName} · ${locationLabel(marker.locationState)}`,
            icon: {
              path: 0,
              scale: 10,
              fillColor: markerColor(marker.locationState),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          pin.addListener('click', () => onSelect?.(marker.staffId));
          drawn.push(pin);
        }
        if (placed > 1) {
          map.fitBounds(bounds);
        } else if (placed === 1) {
          const point = route[0] ?? liveMarkers.find((marker) => hasPosition(marker.lat, marker.lng));
          if (point) {
            map.setCenter({ lat: point.lat, lng: point.lng });
            map.setZoom(14);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      drawn.forEach((item) => item.setMap(null));
    };
  }, [signature]);

  if (failed) {
    return (
      <div className="empty-state" style={{ minHeight: 320 }}>
        <strong>Map could not load</strong>
        <p>
          Turn on the Maps JavaScript API for this key, enable billing, and allow this site as an
          HTTP referrer. Staff positions stay listed beside the map.
        </p>
      </div>
    );
  }

  return <div ref={node} className="mock-map" aria-label="Live map" />;
}
