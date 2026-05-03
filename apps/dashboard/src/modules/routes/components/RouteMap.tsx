import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L, { type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoutePoint, RouteStop, WsVehicleUpdate } from '@trackflow/shared-types';

interface RouteMapProps {
  points: RoutePoint[];
  stops: RouteStop[];
  liveUpdate?: WsVehicleUpdate;
  followLive?: boolean;
}

const startIcon = L.divIcon({
  html: `<div style="background:#22c55e;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">A</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const endIcon = L.divIcon({
  html: `<div style="background:#ef4444;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">B</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = L.divIcon({
  html: `<div style="background:#f59e0b;color:white;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></div>`,
  className: '',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function makeLiveIcon(heading: number): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="position:relative;width:36px;height:36px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(79,131,241,0.3);animation:tf-pulse 1.5s ease-out infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:50%;background:#1A56DB;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2 L18 20 L12 16 L6 20 Z"/></svg>
        </div>
      </div>
      <style>@keyframes tf-pulse { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }</style>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (bounds && !fitted.current) {
      map.fitBounds(bounds, { padding: [40, 40] });
      fitted.current = true;
    }
  }, [bounds, map]);
  return null;
}

function FollowLive({ position }: { position: LatLngTuple | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.panTo(position, { animate: true, duration: 0.6 });
    }
  }, [position, map]);
  return null;
}

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

export function RouteMap({ points, stops, liveUpdate, followLive = false }: RouteMapProps) {
  const segments = useMemo(() => splitSegments(points), [points]);
  const allCoords: LatLngTuple[] = useMemo(() => points.map((p) => [p.lat, p.lng]), [points]);
  const bounds: LatLngBoundsExpression | null = useMemo(
    () => (allCoords.length > 0 ? L.latLngBounds(allCoords) : null),
    [allCoords],
  );

  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const livePos: LatLngTuple | null = liveUpdate
    ? [liveUpdate.latitude, liveUpdate.longitude]
    : null;
  const center: LatLngTuple = livePos ?? (startPoint ? [startPoint.lat, startPoint.lng] : [41.2995, 69.2401]);
  const liveIcon = useMemo(
    () => makeLiveIcon(liveUpdate?.heading ?? 0),
    [liveUpdate?.heading],
  );

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full rounded-lg"
      style={{ background: '#0B1627' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {segments.map((seg, i) => (
        <Polyline
          key={i}
          positions={seg}
          pathOptions={{ color: '#1A56DB', weight: 4, opacity: 0.85 }}
        />
      ))}
      {startPoint && (
        <Marker position={[startPoint.lat, startPoint.lng]} icon={startIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>Started</strong>
              <br />
              {new Date(startPoint.timestamp).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      )}
      {endPoint && endPoint !== startPoint && (
        <Marker position={[endPoint.lat, endPoint.lng]} icon={endIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>Ended</strong>
              <br />
              {new Date(endPoint.timestamp).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      )}
      {stops.map((s, i) => (
        <Marker key={i} position={[s.lat, s.lng]} icon={stopIcon}>
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
      {livePos && liveUpdate && (
        <Marker position={livePos} icon={liveIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>Live</strong>
              <br />
              {Math.round(liveUpdate.speed)} km/h · {liveUpdate.status}
              <br />
              {new Date(liveUpdate.timestamp).toLocaleTimeString()}
            </div>
          </Popup>
        </Marker>
      )}
      <FitBounds bounds={bounds} />
      {followLive && <FollowLive position={livePos} />}
    </MapContainer>
  );
}
