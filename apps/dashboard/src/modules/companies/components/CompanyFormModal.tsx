import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Company } from '@trackflow/shared-types';
import { createCompany, updateCompany } from '@/api/mutations/companies.mutation';

interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company;
}

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  'w-full bg-[#0B1627] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors';

interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, error, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8ba3c0] mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CompanyFormModal({ isOpen, onClose, company }: CompanyFormModalProps) {
  const isEdit = Boolean(company);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', address: '', isActive: true },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        phone: company.phone ?? '',
        address: company.address ?? '',
        isActive: company.isActive,
      });
    } else {
      reset({ name: '', phone: '', address: '', isActive: true });
    }
  }, [company, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit && company
        ? updateCompany(company.id, values)
        : createCompany(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0F1C30] border border-[#1E3150] rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3150]">
          <h2 className="text-white font-semibold text-base">
            {isEdit ? 'Edit Company' : 'Create Company'}
          </h2>
          <button onClick={onClose} className="text-[#8ba3c0] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-5 space-y-4">
          <Field label="Company Name" error={errors.name?.message} required>
            <input
              {...register('name')}
              placeholder="Acme Logistics LLC"
              className={inputClass}
            />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <input
              {...register('phone')}
              placeholder="+998 71 000 00 00"
              className={inputClass}
            />
          </Field>

          <Field label="Address" error={errors.address?.message}>
            <input
              {...register('address')}
              placeholder="Tashkent, Uzbekistan"
              className={inputClass}
            />
          </Field>

          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4 rounded border-[#1E3150] bg-[#0B1627] accent-[#1A56DB]"
              />
              <span className="text-sm text-[#8ba3c0]">Active</span>
            </label>
          )}

          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data
                ?.message ?? 'An error occurred'}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#8ba3c0] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-5 py-2 bg-[#1A56DB] hover:bg-[#1648C0] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
