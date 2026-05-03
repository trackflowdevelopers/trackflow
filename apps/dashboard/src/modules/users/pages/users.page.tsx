import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, UserPlus, X } from 'lucide-react';
import type { User } from '@trackflow/shared-types';
import { UserRole } from '@trackflow/shared-types';
import { getUsers } from '@/api/queries/users.query';
import { getCompanies } from '@/api/queries/companies.query';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { UsersTable } from '../components/UsersTable';
import { UserFormModal } from '../components/UserFormModal';
import { DeleteUserModal } from '../components/DeleteUserModal';

type SortOrder = 'desc' | 'asc';

const ROLE_OPTIONS = [
  { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
  { value: UserRole.COMPANY_ADMIN, label: 'Company Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.DRIVER, label: 'Driver' },
];

const selectClass =
  'bg-[#0F1C30] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A56DB] transition-colors';

export function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const companyId = searchParams.get('companyId') ?? '';
  const role = (searchParams.get('role') ?? '') as UserRole | '';

  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const [formModal, setFormModal] = useState<{ open: boolean; user?: User }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user?: User }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search: debouncedSearch, sortOrder, page, companyId, role }],
    queryFn: () =>
      getUsers({
        search: debouncedSearch || undefined,
        sortOrder,
        page,
        limit: 20,
        companyId: companyId || undefined,
        role: (role as UserRole) || undefined,
      }),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'dropdown'],
    queryFn: () => getCompanies({ limit: 200 }),
    staleTime: 60_000,
  });

  const openCreate = useCallback(() => setFormModal({ open: true }), []);
  const openEdit = useCallback((user: User) => setFormModal({ open: true, user }), []);
  const openDelete = useCallback((user: User) => setDeleteModal({ open: true, user }), []);

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
    setPage(1);
  };

  const hasFilters = Boolean(companyId || role);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Users</h1>
          {data && <p className="text-[#8ba3c0] text-sm mt-0.5">{data.total} total</p>}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] hover:bg-[#1648C0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <UserPlus size={16} />
          Create User
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full bg-[#0F1C30] border border-[#1E3150] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors"
          />
        </div>

        <select
          value={companyId}
          onChange={(e) => setParam('companyId', e.target.value)}
          className={selectClass}
        >
          <option value="">All companies</option>
          {companiesData?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={role}
          onChange={(e) => setParam('role', e.target.value)}
          className={selectClass}
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#8ba3c0] hover:text-white border border-[#1E3150] rounded-lg hover:border-[#1A56DB] transition-colors"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
        </div>
      ) : (
        <UsersTable
          data={data?.data ?? []}
          sortOrder={sortOrder}
          onSort={() => { setSortOrder((p) => (p === 'desc' ? 'asc' : 'desc')); setPage(1); }}
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

      <UserFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false })}
        user={formModal.user}
        defaultCompanyId={companyId || undefined}
      />
      <DeleteUserModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        user={deleteModal.user}
      />
    </div>
  );
}
