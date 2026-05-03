import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gauge, Fuel, User, Route as RouteIcon } from 'lucide-react';
import type { VehicleStatus, RoutePoint } from '@trackflow/shared-types';
import { getCompanyById } from '@/api/queries/companies.query';
import { getVehicles, getVehicleRoute } from '@/api/queries/vehicles.query';
import { useFleetSocket } from '@/lib/hooks/useFleetSocket';
import { FleetMap } from '../components/FleetMap';
import { RouteTimeline } from '@/modules/routes/components/RouteTimeline';

const STATUS_STYLES: Record<VehicleStatus, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800/40',
  idle: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  stopped: 'bg-[#1A2942] text-[#8ba3c0] border-[#1E3150]',
  offline: 'bg-red-900/30 text-red-400 border-red-800/40',
  maintenance: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
};

function todayLocalISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function dateRange(localDate: string): { from: string; to: string } {
  const start = new Date(`${localDate}T00:00:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function CompanyFleetPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: company } = useQuery({
    queryKey: ['companies', companyId],
    queryFn: () => getCompanyById(companyId!),
    enabled: Boolean(companyId),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', { companyId }],
    queryFn: () => getVehicles({ companyId, limit: 100 }),
    enabled: Boolean(companyId),
    refetchInterval: 30_000,
  });

  const liveUpdates = useFleetSocket();
  const vehicles = vehiclesData?.data ?? [];
  const selectedVehicle = vehicles.find((v) => v.id === selectedId) ?? null;
  const liveSelected = selectedId ? liveUpdates.get(selectedId) : undefined;

  const { from, to } = useMemo(() => dateRange(todayLocalISO()), []);

  const { data: route } = useQuery({
    queryKey: ['vehicle-route', selectedId, from, to],
    queryFn: () => getVehicleRoute(selectedId!, from, to),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 10_000 : false,
  });

  const [livePoints, setLivePoints] = useState<RoutePoint[]>([]);

  useEffect(() => {
    setLivePoints([]);
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !liveSelected) return;
    setLivePoints((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.timestamp === liveSelected.timestamp) return prev;
      return [
        ...prev,
        {
          lat: liveSelected.latitude,
          lng: liveSelected.longitude,
          speed: liveSelected.speed,
          ignition: liveSelected.status === 'active' || liveSelected.status === 'idle',
          timestamp: liveSelected.timestamp,
        },
      ];
    });
  }, [selectedId, liveSelected]);

  const combinedPoints = useMemo<RoutePoint[]>(() => {
    if (!route) return livePoints;
    if (livePoints.length === 0) return route.points;
    const last = route.points[route.points.length - 1];
    const cutoff = last ? new Date(last.timestamp).getTime() : 0;
    const tail = livePoints.filter((p) => new Date(p.timestamp).getTime() > cutoff);
    return [...route.points, ...tail];
  }, [route, livePoints]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { active: 0, idle: 0, stopped: 0, offline: 0, maintenance: 0 };
    for (const v of vehicles) {
      const live = liveUpdates.get(v.id);
      const s = live?.status ?? v.status;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [vehicles, liveUpdates]);

  const currentStatus = liveSelected?.status ?? selectedVehicle?.status;
  const currentSpeed = liveSelected?.speed ?? selectedVehicle?.lastSpeed;
  const currentFuel = liveSelected?.fuelLevel ?? selectedVehicle?.lastFuelLevel;

  return (
    <div className="p-6 flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <button
          onClick={() => navigate('/companies')}
          className="p-2 rounded-lg text-[#8ba3c0] hover:text-white hover:bg-[#1A2942] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-xl font-semibold">{company?.name ?? 'Fleet'}</h1>
          <p className="text-[#8ba3c0] text-sm mt-0.5">
            {vehicles.length} vehicles · live tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill label="Active" count={statusCounts.active} color="text-green-400" />
          <StatusPill label="Idle" count={statusCounts.idle} color="text-yellow-400" />
          <StatusPill label="Stopped" count={statusCounts.stopped} color="text-[#8ba3c0]" />
          <StatusPill label="Offline" count={statusCounts.offline} color="text-red-400" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 min-h-0">
        <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl overflow-hidden">
          {vehicles.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#8ba3c0] text-sm">
              No vehicles in this company yet.
            </div>
          ) : (
            <FleetMap
              vehicles={vehicles}
              liveUpdates={liveUpdates}
              selectedId={selectedId}
              onSelect={setSelectedId}
              routePoints={combinedPoints}
              routeStops={route?.stops ?? []}
            />
          )}
        </div>

        <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl p-4 overflow-hidden flex flex-col">
          {!selectedVehicle ? (
            <div className="h-full flex items-center justify-center text-center text-[#8ba3c0] text-sm">
              Click a vehicle on the map to see its details and today's events.
            </div>
          ) : (
            <>
              <div className="shrink-0 pb-4 mb-4 border-b border-[#1E3150]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-white font-semibold text-base">
                      {selectedVehicle.plateNumber}
                    </h2>
                    <p className="text-[#8ba3c0] text-xs mt-0.5">
                      {selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.year}
                    </p>
                  </div>
                  {currentStatus && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border shrink-0 ${STATUS_STYLES[currentStatus]}`}
                    >
                      {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <MiniStat
                    icon={<Gauge size={12} />}
                    label="Speed"
                    value={
                      currentSpeed !== null && currentSpeed !== undefined
                        ? `${Math.round(currentSpeed)} km/h`
                        : '—'
                    }
                  />
                  <MiniStat
                    icon={<Fuel size={12} />}
                    label="Fuel"
                    value={
                      currentFuel !== null && currentFuel !== undefined
                        ? `${Math.round(currentFuel)}%`
                        : '—'
                    }
                  />
                  <MiniStat
                    icon={<User size={12} />}
                    label="Driver"
                    value={selectedVehicle.currentDriverName ?? '—'}
                  />
                </div>

                <button
                  onClick={() => navigate(`/routes?vehicle=${selectedVehicle.id}`)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A56DB]/15 hover:bg-[#1A56DB]/25 text-[#4F83F1] text-xs font-medium rounded-lg border border-[#1A56DB]/30 transition-colors"
                >
                  <RouteIcon size={12} />
                  Full route history
                </button>
              </div>

              <div className="flex-1 min-h-0">
                {route ? (
                  <RouteTimeline route={route} />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0B1627] border border-[#1E3150] rounded-lg">
      <span className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
      <span className="text-[#8ba3c0] text-xs">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{count}</span>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0B1627] border border-[#1E3150] rounded-lg p-2">
      <div className="flex items-center gap-1 text-[#8ba3c0] text-[10px] uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className="text-white text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}
