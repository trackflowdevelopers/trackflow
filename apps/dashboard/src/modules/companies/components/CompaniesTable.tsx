import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Pencil, Trash2, UserPlus, Users, ArrowUp, ArrowDown, Map } from 'lucide-react';
import type { Company, CompanySortBy } from '@trackflow/shared-types';

interface CompaniesTableProps {
  data: Company[];
  sortBy: CompanySortBy;
  sortOrder: 'asc' | 'desc';
  onSort: (field: CompanySortBy) => void;
  onCreateUser: (company: Company) => void;
  onSeeUsers: (company: Company) => void;
  onViewFleet: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

interface SortHeaderProps {
  label: string;
  field: CompanySortBy;
  sortBy: CompanySortBy;
  sortOrder: 'asc' | 'desc';
  onSort: (field: CompanySortBy) => void;
}

function SortHeader({ label, field, sortBy, sortOrder, onSort }: SortHeaderProps) {
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

const columnHelper = createColumnHelper<Company>();

export function CompaniesTable({
  data,
  sortBy,
  sortOrder,
  onSort,
  onCreateUser,
  onSeeUsers,
  onViewFleet,
  onEdit,
  onDelete,
}: CompaniesTableProps) {
  const columns = [
    columnHelper.display({
      id: 'index',
      header: '#',
      cell: ({ row }) => (
        <span className="text-[#8ba3c0] text-sm">{row.index + 1}</span>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'Company',
      cell: ({ getValue, row }) => (
        <div>
          <p className="text-white text-sm font-medium">{getValue()}</p>
          {row.original.address && (
            <p className="text-[#8ba3c0] text-xs mt-0.5">{row.original.address}</p>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{getValue() ?? '—'}</span>
      ),
    }),
    columnHelper.accessor('userCount', {
      header: () => (
        <SortHeader
          label="Users"
          field="userCount"
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
        />
      ),
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#c8d8eb]">
          <Users size={13} className="text-[#8ba3c0]" />
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8ba3c0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8ba3c0]" />
            Inactive
          </span>
        ),
    }),
    columnHelper.accessor('createdAt', {
      header: () => (
        <SortHeader
          label="Created"
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
            onClick={() => onCreateUser(row.original)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-[#4F83F1] hover:bg-[#1A56DB]/20 transition-colors"
            title="Create User"
          >
            <UserPlus size={15} />
          </button>
          <button
            onClick={() => onSeeUsers(row.original)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-white hover:bg-[#1A2942] transition-colors"
            title="See Users"
          >
            <Users size={15} />
          </button>
          <button
            onClick={() => onViewFleet(row.original)}
            className="p-1.5 rounded-md text-[#8ba3c0] hover:text-[#4F83F1] hover:bg-[#1A56DB]/20 transition-colors"
            title="Live Fleet Map"
          >
            <Map size={15} />
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
      <table className="w-full min-w-[700px] border-collapse">
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
                No companies found
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
