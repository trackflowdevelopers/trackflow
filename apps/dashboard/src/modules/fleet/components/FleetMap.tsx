import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L, { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {
  Vehicle,
  WsVehicleUpdate,
  VehicleStatus,
  RoutePoint,
  RouteStop,
} from '@trackflow/shared-types';

interface FleetMapProps {
  vehicles: Vehicle[];
  liveUpdates: Map<string, WsVehicleUpdate>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  routePoints?: RoutePoint[];
  routeStops?: RouteStop[];
}

const stopIcon = L.divIcon({
  html: `<div style="background:#f59e0b;color:white;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"><svg width="9" height="9" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></div>`,
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function splitSegments(points: RoutePoint[]): LatLngTuple[][] {
  const segments: LatLngTuple[][] = [];
  let current: LatLngTuple[] = [];
  for (const p of points) {
    if (p.ignition) {
      current.push([p.lat, p.lng]);
    } else if (current.length > 1) {
      segments.push(current);
      current = [];
    } else {
      current = [];
    }
  }
  if (current.length > 1) segments.push(current);
  return segments;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(sec)}s`;
}

const STATUS_COLOR: Record<VehicleStatus, string> = {
  active: '#22c55e',
  idle: '#f59e0b',
  stopped: '#6b7280',
  offline: '#ef4444',
  maintenance: '#fb923c',
};

function makeMarker(plate: string, status: VehicleStatus, heading: number, selected: boolean): L.DivIcon {
  const color = STATUS_COLOR[status];
  const size = selected ? 44 : 36;
  const ring = selected
    ? `<div style="position:absolute;inset:-4px;border-radius:50%;border:3px solid #4F83F1;box-shadow:0 0 0 2px white;"></div>`
    : '';
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${ring}
        <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);">
          <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="white"><path d="M12 2 L18 20 L12 16 L6 20 Z"/></svg>
        </div>
        <div style="position:absolute;top:${size}px;left:50%;transform:translateX(-50%);background:#0F1C30;color:white;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;border:1px solid #1E3150;white-space:nowrap;margin-top:4px;">${plate}</div>
      </div>
    `,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface MarkerData {
  vehicle: Vehicle;
  position: LatLngTuple;
  status: VehicleStatus;
  heading: number;
}

function buildMarkers(
  vehicles: Vehicle[],
  liveUpdates: Map<string, WsVehicleUpdate>,
): MarkerData[] {
  const result: MarkerData[] = [];
  for (const v of vehicles) {
    const live = liveUpdates.get(v.id);
    const lat = live?.latitude ?? v.lastLatitude;
    const lng = live?.longitude ?? v.lastLongitude;
    if (lat === null || lng === null) continue;
    result.push({
      vehicle: v,
      position: [lat, lng],
      status: live?.status ?? v.status,
      heading: live?.heading ?? 0,
    });
  }
  return result;
}

function FitBoundsOnce({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (bounds && !fitted.current) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      fitted.current = true;
    }
  }, [bounds, map]);
  return null;
}

export function FleetMap({
  vehicles,
  liveUpdates,
  selectedId,
  onSelect,
  routePoints = [],
  routeStops = [],
}: FleetMapProps) {
  const markers = useMemo(() => buildMarkers(vehicles, liveUpdates), [vehicles, liveUpdates]);
  const segments = useMemo(() => splitSegments(routePoints), [routePoints]);

  const bounds: LatLngBoundsExpression | null = useMemo(() => {
    if (markers.length === 0) return null;
    return L.latLngBounds(markers.map((m) => m.position));
  }, [markers]);

  return (
    <MapContainer
      center={[41.2995, 69.2401]}
      zoom={11}
      className="w-full h-full rounded-lg"
      style={{ background: '#0B1627' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {segments.map((seg, i) => (
        <Polyline
          key={`seg-${i}`}
          positions={seg}
          pathOptions={{ color: '#1A56DB', weight: 4, opacity: 0.85 }}
        />
      ))}
      {routeStops.map((s, i) => (
        <Marker key={`stop-${i}`} position={[s.lat, s.lng]} icon={stopIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>Stopped</strong>
              <br />
              {new Date(s.stoppedAt).toLocaleTimeString()}
              {s.resumedAt && <> → {new Date(s.resumedAt).toLocaleTimeString()}</>}
              <br />
              Duration: {formatDuration(s.durationSec)}
            </div>
          </Popup>
        </Marker>
      ))}
      {markers.map((m) => (
        <Marker
          key={m.vehicle.id}
          position={m.position}
          icon={makeMarker(m.vehicle.plateNumber, m.status, m.heading, selectedId === m.vehicle.id)}
          eventHandlers={{ click: () => onSelect(m.vehicle.id) }}
        />
      ))}
      <FitBoundsOnce bounds={bounds} />
    </MapContainer>
  );
}
