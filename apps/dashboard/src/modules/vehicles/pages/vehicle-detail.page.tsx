import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gauge, Fuel, Navigation, MapPin, Clock, Wifi, WifiOff, Route } from 'lucide-react';
import { getVehicleById } from '@/api/queries/vehicles.query';
import { useFleetSocket } from '@/lib/hooks/useFleetSocket';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800/40',
  idle: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  stopped: 'bg-[#1A2942] text-[#8ba3c0] border-[#1E3150]',
  offline: 'bg-red-900/30 text-red-400 border-red-800/40',
  maintenance: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
};

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const liveUpdates = useFleetSocket();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicles', id],
    queryFn: () => getVehicleById(id!),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-8 h-8 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6">
        <p className="text-[#8ba3c0]">Vehicle not found.</p>
      </div>
    );
  }

  const live = liveUpdates.get(vehicle.id);
  const status = live?.status ?? vehicle.status;
  const speed = live?.speed ?? vehicle.lastSpeed;
  const fuel = live?.fuelLevel ?? vehicle.lastFuelLevel;
  const lat = live?.latitude ?? vehicle.lastLatitude;
  const lng = live?.longitude ?? vehicle.lastLongitude;
  const lastSeen = live?.timestamp ?? vehicle.lastSeenAt;
  const isLive = Boolean(live);

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.offline;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vehicles')}
          className="p-2 rounded-lg text-[#8ba3c0] hover:text-white hover:bg-[#1A2942] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-xl font-semibold">{vehicle.plateNumber}</h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${statusStyle}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                <Wifi size={12} />
                Live
              </span>
            )}
            {!isLive && vehicle.lastSeenAt && (
              <span className="inline-flex items-center gap-1 text-xs text-[#8ba3c0]">
                <WifiOff size={12} />
                Last seen {new Date(vehicle.lastSeenAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-[#8ba3c0] text-sm mt-0.5">
            {vehicle.make} {vehicle.model} · {vehicle.year} · {vehicle.fuelType}
          </p>
        </div>
        <button
          onClick={() => navigate(`/routes?vehicle=${vehicle.id}`)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] hover:bg-[#1648C0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Route size={16} />
          Route History
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Gauge size={18} className="text-[#4F83F1]" />}
          label="Speed"
          value={speed !== null && speed !== undefined ? `${Math.round(speed)} km/h` : '—'}
        />
        <StatCard
          icon={<Fuel size={18} className="text-green-400" />}
          label="Fuel Level"
          value={fuel !== null && fuel !== undefined ? `${Math.round(fuel)}%` : '—'}
        />
        <StatCard
          icon={<Navigation size={18} className="text-[#4F83F1]" />}
          label="Total Mileage"
          value={`${Math.round(vehicle.totalMileage).toLocaleString()} km`}
        />
        <StatCard
          icon={<Clock size={18} className="text-[#8ba3c0]" />}
          label="Last Update"
          value={lastSeen ? new Date(lastSeen).toLocaleTimeString() : '—'}
        />
      </div>

      {lat !== null && lng !== null && (
        <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-[#4F83F1]" />
            <span className="text-white text-sm font-medium">Last Known Position</span>
          </div>
          <p className="text-[#8ba3c0] text-sm font-mono">
            {lat?.toFixed(6)}, {lng?.toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-xs text-[#4F83F1] hover:underline"
          >
            Open in Google Maps →
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoSection
          title="Vehicle Info"
          rows={[
            ['Plate Number', vehicle.plateNumber],
            ['Make', vehicle.make],
            ['Model', vehicle.model],
            ['Year', String(vehicle.year)],
            ['Fuel Type', vehicle.fuelType],
            ['Tank Capacity', `${vehicle.fuelTankCapacity} L`],
            ['Consumption Norm', `${vehicle.fuelConsumptionNorm} L/100km`],
          ]}
        />
        <InfoSection
          title="Assignment"
          rows={[
            ['Company', vehicle.companyName ?? '—'],
            ['Driver', vehicle.currentDriverName ?? 'Not assigned'],
            ['Device IMEI', vehicle.deviceImei],
            ['Status', vehicle.status],
            ['Active', vehicle.isActive ? 'Yes' : 'No'],
            ['Added', new Date(vehicle.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })],
          ]}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[#8ba3c0] text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-white text-xl font-semibold">{value}</p>
    </div>
  );
}

function InfoSection({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="bg-[#0F1C30] border border-[#1E3150] rounded-xl p-5">
      <h3 className="text-white text-sm font-semibold mb-4">{title}</h3>
      <dl className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-baseline">
            <dt className="text-[#8ba3c0] text-sm">{label}</dt>
            <dd className="text-white text-sm font-medium text-right max-w-[60%] truncate">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
