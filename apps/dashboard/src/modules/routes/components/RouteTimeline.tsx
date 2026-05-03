import { Power, PowerOff, Flag, Clock, MapPin } from 'lucide-react';
import type { VehicleRoute } from '@trackflow/shared-types';

interface RouteTimelineProps {
  route: VehicleRoute;
}

interface TimelineEvent {
  type: 'start' | 'stop' | 'resume' | 'end';
  time: string;
  lat?: number;
  lng?: number;
  durationSec?: number;
}

function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildEvents(route: VehicleRoute): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (route.points.length > 0) {
    const first = route.points[0];
    events.push({ type: 'start', time: first.timestamp, lat: first.lat, lng: first.lng });
  }

  for (const stop of route.stops) {
    events.push({
      type: 'stop',
      time: stop.stoppedAt,
      lat: stop.lat,
      lng: stop.lng,
      durationSec: stop.durationSec,
    });
    if (stop.resumedAt) {
      events.push({
        type: 'resume',
        time: stop.resumedAt,
        lat: stop.lat,
        lng: stop.lng,
      });
    }
  }

  if (route.points.length > 1) {
    const last = route.points[route.points.length - 1];
    const lastStop = route.stops[route.stops.length - 1];
    if (!lastStop || lastStop.resumedAt !== null) {
      events.push({ type: 'end', time: last.timestamp, lat: last.lat, lng: last.lng });
    }
  }

  events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  return events;
}

const TYPE_META: Record<TimelineEvent['type'], { icon: React.ReactNode; label: string; color: string }> = {
  start: {
    icon: <Power size={14} />,
    label: 'Started driving',
    color: 'bg-green-500/20 text-green-400 border-green-700/40',
  },
  stop: {
    icon: <PowerOff size={14} />,
    label: 'Engine off',
    color: 'bg-orange-500/20 text-orange-400 border-orange-700/40',
  },
  resume: {
    icon: <Power size={14} />,
    label: 'Engine on',
    color: 'bg-blue-500/20 text-blue-400 border-blue-700/40',
  },
  end: {
    icon: <Flag size={14} />,
    label: 'Ended',
    color: 'bg-red-500/20 text-red-400 border-red-700/40',
  },
};

export function RouteTimeline({ route }: RouteTimelineProps) {
  const events = buildEvents(route);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryStat label="Distance" value={`${route.totalDistanceKm.toFixed(1)} km`} />
        <SummaryStat label="Drive time" value={formatDuration(route.totalDriveSec)} />
        <SummaryStat label="Stop time" value={formatDuration(route.totalStopSec)} />
      </div>

      <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
        <Clock size={14} />
        Timeline
      </h3>

      {events.length === 0 ? (
        <p className="text-[#8ba3c0] text-sm py-8 text-center">No activity for this date.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((e, i) => {
            const meta = TYPE_META[e.type];
            return (
              <li
                key={i}
                className="flex gap-3 p-3 bg-[#0B1627] border border-[#1E3150] rounded-lg"
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${meta.color}`}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-white text-sm font-medium">{meta.label}</p>
                    <span className="text-[#8ba3c0] text-xs font-mono shrink-0">
                      {formatTime(e.time)}
                    </span>
                  </div>
                  {e.type === 'stop' && e.durationSec !== undefined && (
                    <p className="text-[#f59e0b] text-xs mt-1">
                      Stopped for {formatDuration(e.durationSec)}
                    </p>
                  )}
                  {e.lat !== undefined && e.lng !== undefined && (
                    <a
                      href={`https://www.google.com/maps?q=${e.lat},${e.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#4F83F1] text-xs mt-1 hover:underline"
                    >
                      <MapPin size={10} />
                      {e.lat.toFixed(5)}, {e.lng.toFixed(5)}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0B1627] border border-[#1E3150] rounded-lg p-3">
      <p className="text-[#8ba3c0] text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white text-base font-semibold mt-0.5">{value}</p>
    </div>
  );
}
