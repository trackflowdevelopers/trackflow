import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import type {
  Vehicle,
  VehicleSortBy,
  VehicleStatus,
} from "@trackflow/shared-types";
import { getVehicles } from "@/api/queries/vehicles.query";
import { getCompanies } from "@/api/queries/companies.query";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useFleetSocket } from "@/lib/hooks/useFleetSocket";
import { VehiclesTable } from "../components/VehiclesTable";
import { VehicleFormModal } from "../components/VehicleFormModal";
import { DeleteVehicleModal } from "../components/DeleteVehicleModal";
import { useAuth } from "@/modules/auth/context/useAuth";
import { UserRole } from "@trackflow/shared-types";

type SortOrder = "asc" | "desc";

const STATUS_OPTIONS: { value: VehicleStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "idle", label: "Idle" },
  { value: "stopped", label: "Stopped" },
  { value: "offline", label: "Offline" },
  { value: "maintenance", label: "Maintenance" },
];

const selectClass =
  "bg-[#0F1C30] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A56DB] transition-colors";

export function VehiclesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<VehicleSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "">("");
  const [companyFilter, setCompanyFilter] = useState("");

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const [formModal, setFormModal] = useState<{
    open: boolean;
    vehicle?: Vehicle;
  }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    vehicle?: Vehicle;
  }>({ open: false });

  const liveUpdates = useFleetSocket();

  const { data, isLoading } = useQuery({
    queryKey: [
      "vehicles",
      {
        search: debouncedSearch,
        sortBy,
        sortOrder,
        page,
        statusFilter,
        companyFilter,
      },
    ],
    queryFn: () =>
      getVehicles({
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20,
        status: statusFilter || undefined,
        companyId: companyFilter || undefined,
      }),
  });

  const { data: companiesData } = useQuery({
    queryKey: ["companies", "dropdown"],
    queryFn: () => getCompanies({ limit: 100 }),
    staleTime: 60_000,
    enabled: isSuperAdmin,
  });

  const openCreate = useCallback(() => setFormModal({ open: true }), []);
  const openEdit = useCallback(
    (vehicle: Vehicle) => setFormModal({ open: true, vehicle }),
    [],
  );
  const openDelete = useCallback(
    (vehicle: Vehicle) => setDeleteModal({ open: true, vehicle }),
    [],
  );

  const handleSort = (field: VehicleSortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Vehicles</h1>
          {data && (
            <p className="text-[#8ba3c0] text-sm mt-0.5">{data.total} total</p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] hover:bg-[#1648C0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Vehicle
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plate, make, model, IMEI…"
            className="w-full bg-[#0F1C30] border border-[#1E3150] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as VehicleStatus | "");
            setPage(1);
          }}
          className={selectClass}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {isSuperAdmin && (
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All companies</option>
            {companiesData?.data.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
        </div>
      ) : (
        <VehiclesTable
          data={data?.data ?? []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          liveUpdates={liveUpdates}
          onEdit={openEdit}
          onDelete={openDelete}
        />
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#8ba3c0] text-sm">
            Page {page} of {data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-[#8ba3c0] hover:text-white disabled:opacity-40 border border-[#1E3150] rounded-lg hover:border-[#1A56DB] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="px-3 py-1.5 text-sm text-[#8ba3c0] hover:text-white disabled:opacity-40 border border-[#1E3150] rounded-lg hover:border-[#1A56DB] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <VehicleFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false })}
        vehicle={formModal.vehicle}
      />
      <DeleteVehicleModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        vehicle={deleteModal.vehicle}
      />
    </div>
  );
}
