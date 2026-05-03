import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import type { Company, CompanySortBy } from '@trackflow/shared-types';
import { getCompanies } from '@/api/queries/companies.query';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { CompaniesTable } from '../components/CompaniesTable';
import { CompanyFormModal } from '../components/CompanyFormModal';
import { DeleteCompanyModal } from '../components/DeleteCompanyModal';
import { UserFormModal } from '@/modules/users/components/UserFormModal';

type SortOrder = 'asc' | 'desc';

export function CompaniesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<CompanySortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 400);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const [companyModal, setCompanyModal] = useState<{ open: boolean; company?: Company }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; company?: Company }>({ open: false });
  const [createUserModal, setCreateUserModal] = useState<{ open: boolean; companyId?: string }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ['companies', { search: debouncedSearch, sortBy, sortOrder, page }],
    queryFn: () => getCompanies({ search: debouncedSearch || undefined, sortBy, sortOrder, page, limit: 20 }),
  });

  const openCreate = useCallback(() => setCompanyModal({ open: true }), []);
  const openEdit = useCallback((company: Company) => setCompanyModal({ open: true, company }), []);
  const openDelete = useCallback((company: Company) => setDeleteModal({ open: true, company }), []);

  const openCreateUser = useCallback(
    (company: Company) => setCreateUserModal({ open: true, companyId: company.id }),
    [],
  );

  const openSeeUsers = useCallback(
    (company: Company) => navigate(`/users?companyId=${company.id}`),
    [navigate],
  );

  const openFleet = useCallback(
    (company: Company) => navigate(`/companies/${company.id}/fleet`),
    [navigate],
  );

  const handleSort = (field: CompanySortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-semibold">Companies</h1>
          {data && <p className="text-[#8ba3c0] text-sm mt-0.5">{data.total} total</p>}
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A56DB] hover:bg-[#1648C0] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          Create Company
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6080]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full bg-[#0F1C30] border border-[#1E3150] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#1E3150] border-t-[#1A56DB] animate-spin" />
        </div>
      ) : (
        <CompaniesTable
          data={data?.data ?? []}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onCreateUser={openCreateUser}
          onSeeUsers={openSeeUsers}
          onViewFleet={openFleet}
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

      <CompanyFormModal
        isOpen={companyModal.open}
        onClose={() => setCompanyModal({ open: false })}
        company={companyModal.company}
      />
      <DeleteCompanyModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        company={deleteModal.company}
      />
      <UserFormModal
        isOpen={createUserModal.open}
        onClose={() => setCreateUserModal({ open: false })}
        defaultCompanyId={createUserModal.companyId}
      />
    </div>
  );
}
