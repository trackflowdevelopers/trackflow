import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@trackflow/shared-types';
import { UserRole } from '@trackflow/shared-types';
import { createUser, updateUser } from '@/api/mutations/users.mutation';
import { getCompanies } from '@/api/queries/companies.query';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  defaultCompanyId?: string;
}

const baseSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(UserRole),
  companyId: z.string().min(1, 'Required'),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, 'Minimum 6 characters'),
});

const editSchema = baseSchema.extend({
  password: z.union([z.string().min(6, 'Minimum 6 characters'), z.literal('')]).optional(),
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type FormValues = CreateFormValues | EditFormValues;

const ROLE_OPTIONS = [
  { value: UserRole.SUPER_ADMIN, label: 'Super Admin' },
  { value: UserRole.COMPANY_ADMIN, label: 'Company Admin' },
  { value: UserRole.MANAGER, label: 'Manager' },
  { value: UserRole.DRIVER, label: 'Driver' },
];

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

const inputClass =
  'w-full bg-[#0B1627] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors';

const selectClass =
  'w-full bg-[#0B1627] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A56DB] transition-colors disabled:opacity-60';

export function UserFormModal({ isOpen, onClose, user, defaultCompanyId }: UserFormModalProps) {
  const isEdit = Boolean(user);
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: () => getCompanies({ limit: 100 }),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? editSchema : createSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: UserRole.DRIVER,
      companyId: defaultCompanyId ?? '',
      password: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber ?? '',
        role: user.role,
        companyId: user.companyId,
        password: '',
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: UserRole.DRIVER,
        companyId: defaultCompanyId ?? '',
        password: '',
      });
    }
  }, [user, defaultCompanyId, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      if (isEdit && user) {
        const { password, ...rest } = values as EditFormValues;
        return updateUser(user.id, { ...rest, ...(password ? { password } : {}) });
      }
      return createUser(values as CreateFormValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0F1C30] border border-[#1E3150] rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3150]">
          <h2 className="text-white font-semibold text-base">
            {isEdit ? 'Edit User' : 'Create User'}
          </h2>
          <button onClick={onClose} className="text-[#8ba3c0] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" error={errors.firstName?.message} required>
              <input {...register('firstName')} placeholder="John" className={inputClass} />
            </Field>
            <Field label="Last Name" error={errors.lastName?.message} required>
              <input {...register('lastName')} placeholder="Smith" className={inputClass} />
            </Field>
          </div>

          <Field label="Email" error={errors.email?.message} required>
            <input
              {...register('email')}
              type="email"
              placeholder="john@company.com"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone Number" error={errors.phoneNumber?.message}>
              <input
                {...register('phoneNumber')}
                placeholder="+998 90 000 00 00"
                className={inputClass}
              />
            </Field>
            <Field label="Role" error={errors.role?.message} required>
              <select {...register('role')} className={selectClass}>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Company" error={errors.companyId?.message} required>
            <select
              {...register('companyId')}
              disabled={Boolean(defaultCompanyId)}
              className={selectClass}
            >
              <option value="">Select company…</option>
              {companiesData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={isEdit ? 'New Password (leave empty to keep current)' : 'Password'}
            error={errors.password?.message}
            required={!isEdit}
          >
            <input
              {...register('password')}
              type="password"
              placeholder={isEdit ? 'Leave empty to keep unchanged' : 'Min. 6 characters'}
              className={inputClass}
            />
          </Field>

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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
