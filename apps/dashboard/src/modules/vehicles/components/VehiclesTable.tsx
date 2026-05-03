import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Pencil, Trash2, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle, VehicleSortBy, WsVehicleUpdate } from '@trackflow/shared-types';

interface VehiclesTableProps {
  data: Vehicle[];
  sortBy: VehicleSortBy;
  sortOrder: 'asc' | 'desc';
  onSort: (field: VehicleSortBy) => void;
  liveUpdates: Map<string, WsVehicleUpdate>;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-900/30 text-green-400 border-green-800/40',
  idle: 'bg-yellow-900/30 text-yellow-400 border-yellow-800/40',
  stopped: 'bg-[#1A2942] text-[#8ba3c0] border-[#1E3150]',
  offline: 'bg-red-900/30 text-red-400 border-red-800/40',
  maintenance: 'bg-orange-900/30 text-orange-400 border-orange-800/40',
};

const STATUS_DOT: Record<string, string> = {
  active: 'bg-green-400',
  idle: 'bg-yellow-400',
  stopped: 'bg-[#8ba3c0]',
  offline: 'bg-red-400',
  maintenance: 'bg-orange-400',
};

function SortHeader({
  label,
  field,
  sortBy,
  sortOrder,
  onSort,
}: {
  label: string;
  field: VehicleSortBy;
  sortBy: VehicleSortBy;
  sortOrder: 'asc' | 'desc';
  onSort: (f: VehicleSortBy) => void;
}) {
  const active = sortBy === field;
  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
        active ? 'text-[#4F83F1]' : 'text-[#8ba3c0] hover:text-white'
      }`}
    >
      {label}
      {active ? (
        sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
      ) : (
        <ArrowDown size={12} className="opacity-30" />
      )}
    </button>
  );
}

const columnHelper = createColumnHelper<Vehicle>();

export function VehiclesTable({
  data,
  sortBy,
  sortOrder,
  onSort,
  liveUpdates,
  onEdit,
  onDelete,
}: VehiclesTableProps) {
  const navigate = useNavigate();

  const columns = [
    columnHelper.display({
      id: 'index',
      header: '#',
      cell: ({ row }) => (
        <span className="text-[#8ba3c0] text-sm">{row.index + 1}</span>
      ),
    }),
    columnHelper.accessor('plateNumber', {
      header: () => (
        <SortHeader
          label="Plate"
          field="plateNumber"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ),
      cell: ({ getValue, row }) => (
        <div>
          <p className="text-white text-sm font-semibold tracking-wide">{getValue()}</p>
          <p className="text-[#8ba3c0] text-xs mt-0.5">
            {row.original.make} {row.original.model} · {row.original.year}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor('companyName', {
      header: 'Company',
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{getValue() ?? '—'}</span>
      ),
    }),
    columnHelper.accessor('currentDriverName', {
      header: 'Driver',
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{getValue() ?? '—'}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: () => (
        <SortHeader
          label="Status"
          field="status"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ),
      cell: ({ getValue, row }) => {
        const live = liveUpdates.get(row.original.id);
        const status = live?.status ?? getValue();
        const speed = live?.speed ?? row.original.lastSpeed;
        const style = STATUS_STYLES[status] ?? STATUS_STYLES.offline;
        const dot = STATUS_DOT[status] ?? STATUS_DOT.offline;
        return (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${style}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {speed !== null && speed !== undefined && (
              <span className="text-[#8ba3c0] text-xs">{Math.round(speed)} km/h</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('totalMileage', {
      header: () => (
        <SortHeader
          label="Mileage"
          field="totalMileage"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{Math.round(getValue()).toLocaleString()} km</span>
      ),
    }),
    columnHelper.accessor('deviceImei', {
      header: 'IMEI',
      cell: ({ getValue }) => (
        <span className="text-[#8ba3c0] text-xs font-mono">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: () => (
        <SortHeader
          label="Added"
          field="createdAt"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ),
      cell: ({ getValue }) => (
        <span className="text-[#8ba3c0] text-sm">
          {new Date(getValue()).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/vehicles/${row.original.id}`)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-white hover:bg-[#1A2942] transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onEdit(row.original)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-white hover:bg-[#1A2942] transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(row.original)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-red-400 hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-[#1E3150]">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[#1E3150]">
              {headerGroup.headers.map((header) => {
                const isActions = header.id === 'actions';
                return (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8ba3c0] bg-[#0F1C30] whitespace-nowrap ${
                      isActions ? 'sticky right-0 z-10 shadow-[-8px_0_12px_rgba(0,0,0,0.3)]' : ''
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[#8ba3c0] text-sm"
              >
                No vehicles found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#1E3150]/60 hover:bg-[#1A2942]/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => {
                  const isActions = cell.column.id === 'actions';
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 ${
                        isActions
                          ? 'sticky right-0 z-10 bg-[#0B1627] shadow-[-8px_0_12px_rgba(0,0,0,0.3)]'
                          : ''
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
