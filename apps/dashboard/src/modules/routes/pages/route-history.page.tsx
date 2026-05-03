import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Car, Radio } from 'lucide-react';
import type { RoutePoint } from '@trackflow/shared-types';
import { getVehicles, getVehicleRoute } from '@/api/queries/vehicles.query';
import { useFleetSocket } from '@/lib/hooks/useFleetSocket';
import { RouteMap } from '../components/RouteMap';
import { RouteTimeline } from '../components/RouteTimeline';

const inputClass =
  'bg-[#0F1C30] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A56DB] transition-colors';

function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateRange(localDate: string): { from: string; to: string } {
  const start = new Date(`${localDate}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function RouteHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicle') ?? '';
  const date = searchParams.get('date') ?? todayLocalISO();
  const isToday = date === todayLocalISO();
  const [followLive, setFollowLive] = useState(true);

  const { from, to } = useMemo(() => dateRange(date), [date]);

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'dropdown'],
    queryFn: () => getVehicles({ limit: 100 }),
    staleTime: 60_000,
  });

  const { data: route, isLoading } = useQuery({
    queryKey: ['vehicle-route', vehicleId, from, to],
    queryFn: () => getVehicleRoute(vehicleId, from, to),
    enabled: Boolean(vehicleId),
    refetchInterval: isToday && vehicleId ? 10_000 : false,
  });

  const liveUpdates = useFleetSocket();
  const liveUpdate = isToday && vehicleId ? liveUpdates.get(vehicleId) : undefined;

  const [livePoints, setLivePoints] = useState<RoutePoint[]>([]);

  useEffect(() => {
    setLivePoints([]);
  }, [vehicleId, date]);

  useEffect(() => {
    if (!liveUpdate || !isToday) return;
    setLivePoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.timestamp === liveUpdate.timestamp) return prev;
      const next: RoutePoint = {
        lat: liveUpdate.latitude,
        lng: liveUpdate.longitude,
        speed: liveUpdate.speed,
        ignition: liveUpdate.status === 'active' || liveUpdate.status === 'idle',
        timestamp: liveUpdate.timestamp,
      };
      return [...prev, next];
    });
  }, [liveUpdate, isToday]);

  const combinedPoints = useMemo<RoutePoint[]>(() => {
    if (!route) return livePoints;
    if (livePoints.length === 0) return route.points;
    const lastFetched = route.points[route.points.length - 1];
    const cutoff = lastFetched ? new Date(lastFetched.timestamp).getTime() : 0;
    const tail = livePoints.filter((p) => new Date(p.timestamp).getTime() > cutoff);
    return [...route.points, ...tail];
  }, [route, livePoints]);

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  const selectedVehicle = vehiclesData?.data.find((v) => v.id === vehicleId);

  return (
    <div className="p-6 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-white text-xl font-semibold">Route History</h1>
          {selectedVehicle && (
            <p className="text-[#8ba3c0] text-sm mt-0.5">
              {selectedVehicle.plateNumber} · {selectedVehicle.make} {selectedVehicle.model}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isToday && vehicleId && (
            <button
              onClick={() => setFollowLive((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                followLive
                  ? 'bg-[#1A56DB]/15 text-[#4F83F1] border-[#1A56DB]/40'
                  : 'text-[#8ba3c0] border-[#1E3150] hover:text-white'
              }`}
              title="Auto-pan map to follow live position"
            >
              <Radio size={14} className={followLive && liveUpdate ? 'animate-pulse' : ''} />
              {followLive ? 'Following live' : 'Follow live'}
            </button>
          )}
          <div className="relative">
            <Car size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
            <select
              value={vehicleId}
              onChange={(e) => setParam('vehicle', e.target.value)}
              className={`${inputClass} pl-9 pr-8 min-w-56`}
            >
              <option value="">Select vehicle…</option>
              {vehiclesData?.data.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} — {v.make} {v.model}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
            <input
              type="date"
              value={date}
              max={todayLocalISO()}
              onChange={(e) => setParam('date', e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 min-h-0">
        <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl overflow-hidden">
          {!vehicleId ? (
            <div className="h-full flex items-center justify-center text-[#8ba3c0] text-sm">
              Select a vehicle to view its route.
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
            </div>
          ) : route && (combinedPoints.length > 0 || liveUpdate) ? (
            <RouteMap
              points={combinedPoints}
              stops={route?.stops ?? []}
              liveUpdate={liveUpdate}
              followLive={followLive}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[#8ba3c0] text-sm">
              No tracking data for this date.
            </div>
          )}
        </div>

        <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl p-4 overflow-hidden">
          {route ? (
            <RouteTimeline route={route} />
          ) : (
            <div className="h-full flex items-center justify-center text-[#8ba3c0] text-sm text-center">
              {vehicleId ? 'Loading…' : 'Pick a vehicle and date to see the timeline.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
