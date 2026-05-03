import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@trackflow/shared-types";
import { UserRole } from "@trackflow/shared-types";
import { updateUser } from "@/api/mutations/users.mutation";

interface UsersTableProps {
  data: User[];
  sortOrder: "asc" | "desc";
  onSort: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.COMPANY_ADMIN]: "Company Admin",
  [UserRole.MANAGER]: "Manager",
  [UserRole.DRIVER]: "Driver",
};

const ROLE_STYLES: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "bg-red-900/30 text-red-400 border-red-800/40",
  [UserRole.COMPANY_ADMIN]:
    "bg-orange-900/30 text-orange-400 border-orange-800/40",
  [UserRole.MANAGER]: "bg-blue-900/30 text-blue-400 border-blue-800/40",
  [UserRole.DRIVER]: "bg-green-900/30 text-green-400 border-green-800/40",
};

function StatusSwitch({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (isActive: boolean) => updateUser(user.id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <button
      role="switch"
      aria-checked={user.isActive}
      onClick={() => mutation.mutate(!user.isActive)}
      disabled={mutation.isPending}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        user.isActive ? "bg-green-500" : "bg-[#1E3150]"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          user.isActive ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const columnHelper = createColumnHelper<User>();

export function UsersTable({
  data,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const columns = [
    columnHelper.display({
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="text-[#8ba3c0] text-sm">{row.index + 1}</span>
      ),
    }),
    columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
      id: "name",
      header: "Name",
      cell: ({ getValue, row }) => (
        <div>
          <p className="text-white text-sm font-medium">{getValue()}</p>
          <p className="text-[#8ba3c0] text-xs mt-0.5">
            {row.original.companyName ?? row.original.companyId}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("phoneNumber", {
      header: "Phone",
      cell: ({ getValue }) => (
        <span className="text-[#c8d8eb] text-sm">{getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("role", {
      header: "Role",
      cell: ({ getValue }) => {
        const role = getValue();
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROLE_STYLES[role]}`}
          >
            {ROLE_LABELS[role]}
          </span>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: ({ row }) => <StatusSwitch user={row.original} />,
    }),
    columnHelper.accessor("createdAt", {
      header: () => (
        <button
          onClick={onSort}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8ba3c0] hover:text-white transition-colors"
        >
          Created
          {sortOrder === "desc" ? (
            <ArrowDown size={12} className="text-[#4F83F1]" />
          ) : (
            <ArrowUp size={12} className="text-[#4F83F1]" />
          )}
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-[#8ba3c0] text-sm">
          {new Date(getValue()).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
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
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-[#1E3150]">
              {headerGroup.headers.map((header) => {
                const isActions = header.id === "actions";
                return (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#8ba3c0] bg-[#0F1C30] whitespace-nowrap ${
                      isActions
                        ? "sticky right-0 z-10 shadow-[-8px_0_12px_rgba(0,0,0,0.3)]"
                        : ""
                    }`}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
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
                No users found
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[#1E3150]/60 hover:bg-[#1A2942]/40 transition-colors"
              >
                {row.getVisibleCells().map((cell) => {
                  const isActions = cell.column.id === "actions";
                  return (
                    <td
                      key={cell.id}
                      className={`px-4 py-3 ${
                        isActions
                          ? "sticky right-0 z-10 bg-[#0B1627] shadow-[-8px_0_12px_rgba(0,0,0,0.3)]"
                          : ""
                      }`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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
