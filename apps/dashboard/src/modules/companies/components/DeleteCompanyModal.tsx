import { AlertTriangle, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Company } from '@trackflow/shared-types';
import { deleteCompany } from '@/api/mutations/companies.mutation';

interface DeleteCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company;
}

export function DeleteCompanyModal({ isOpen, onClose, company }: DeleteCompanyModalProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => deleteCompany(company!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  if (!isOpen || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0F1C30] border border-[#1E3150] rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3150]">
          <h2 className="text-white font-semibold text-base">Delete Company</h2>
          <button onClick={onClose} className="text-[#8ba3c0] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Delete "{company.name}"?</p>
              <p className="text-[#8ba3c0] text-sm mt-1">
                This action cannot be undone. Users assigned to this company will not be deleted but
                will lose their company association.
              </p>
            </div>
          </div>

          {mutation.isError && (
            <p className="mt-4 text-sm text-red-400">Failed to delete company. Please try again.</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#8ba3c0] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
