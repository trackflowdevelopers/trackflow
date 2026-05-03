import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Vehicle } from "@trackflow/shared-types";
import {
  createVehicle,
  updateVehicle,
} from "@/api/mutations/vehicles.mutation";
import { getCompanies } from "@/api/queries/companies.query";
import { getUsers } from "@/api/queries/users.query";
import { UserRole } from "@trackflow/shared-types";

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
}

const FUEL_TYPES = ["petrol", "diesel", "gas", "electric"] as const;
const STATUS_OPTIONS = [
  "active",
  "idle",
  "stopped",
  "offline",
  "maintenance",
] as const;

const schema = z.object({
  plateNumber: z.string().min(1, "Required"),
  make: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuelType: z.enum(FUEL_TYPES),
  fuelTankCapacity: z.number().min(0),
  fuelConsumptionNorm: z.number().min(0),
  deviceImei: z.string().min(1, "Required"),
  companyId: z.string().min(1, "Required"),
  currentDriverId: z.string().optional(),
  status: z.enum(STATUS_OPTIONS).optional(),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full bg-[#0B1627] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a6080] focus:outline-none focus:border-[#1A56DB] transition-colors";

const selectClass =
  "w-full bg-[#0B1627] border border-[#1E3150] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1A56DB] transition-colors disabled:opacity-60";

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

export function VehicleFormModal({
  isOpen,
  onClose,
  vehicle,
}: VehicleFormModalProps) {
  const isEdit = Boolean(vehicle);
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ["companies", "all"],
    queryFn: () => getCompanies({ limit: 100 }),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plateNumber: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      fuelType: "diesel",
      fuelTankCapacity: 60,
      fuelConsumptionNorm: 10,
      deviceImei: "",
      companyId: "",
      currentDriverId: "",
      isActive: true,
    },
  });

  const selectedCompanyId = useWatch({ control, name: "companyId" });

  const { data: driversData } = useQuery({
    queryKey: ["users", "drivers", selectedCompanyId],
    queryFn: () =>
      getUsers({
        role: UserRole.DRIVER,
        companyId: selectedCompanyId || undefined,
        limit: 100,
      }),
    enabled: isOpen && Boolean(selectedCompanyId),
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        fuelTankCapacity: vehicle.fuelTankCapacity,
        fuelConsumptionNorm: vehicle.fuelConsumptionNorm,
        deviceImei: vehicle.deviceImei,
        companyId: vehicle.companyId,
        currentDriverId: vehicle.currentDriverId ?? "",
        status: vehicle.status,
        isActive: vehicle.isActive,
      });
    } else {
      reset({
        plateNumber: "",
        make: "",
        model: "",
        year: new Date().getFullYear(),
        fuelType: "diesel",
        fuelTankCapacity: 60,
        fuelConsumptionNorm: 10,
        deviceImei: "",
        companyId: "",
        currentDriverId: "",
        isActive: true,
      });
    }
  }, [vehicle, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        currentDriverId: values.currentDriverId || null,
      };
      if (isEdit && vehicle) return updateVehicle(vehicle.id, payload);
      return createVehicle(payload as Parameters<typeof createVehicle>[0]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[#0F1C30] border border-[#1E3150] rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3150] sticky top-0 bg-[#0F1C30] z-10">
          <h2 className="text-white font-semibold text-base">
            {isEdit ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#8ba3c0] hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="px-6 py-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Plate Number"
              error={errors.plateNumber?.message}
              required
            >
              <input
                {...register("plateNumber")}
                placeholder="01 A 123 BC"
                className={inputClass}
              />
            </Field>
            <Field
              label="Device IMEI"
              error={errors.deviceImei?.message}
              required
            >
              <input
                {...register("deviceImei")}
                placeholder="123456789012345"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Make" error={errors.make?.message} required>
              <input
                {...register("make")}
                placeholder="Toyota"
                className={inputClass}
              />
            </Field>
            <Field label="Model" error={errors.model?.message} required>
              <input
                {...register("model")}
                placeholder="Camry"
                className={inputClass}
              />
            </Field>
            <Field label="Year" error={errors.year?.message} required>
              <input
                {...register("year", { valueAsNumber: true })}
                type="number"
                placeholder="2020"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Fuel Type" error={errors.fuelType?.message} required>
              <select {...register("fuelType")} className={selectClass}>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Tank Capacity (L)"
              error={errors.fuelTankCapacity?.message}
              required
            >
              <input
                {...register("fuelTankCapacity", { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="60"
                className={inputClass}
              />
            </Field>
            <Field
              label="Consumption Norm (L/100km)"
              error={errors.fuelConsumptionNorm?.message}
              required
            >
              <input
                {...register("fuelConsumptionNorm", { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="10"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Company" error={errors.companyId?.message} required>
            <select {...register("companyId")} className={selectClass}>
              <option value="">Select company…</option>
              {companiesData?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Assigned Driver"
            error={errors.currentDriverId?.message}
          >
            <select {...register("currentDriverId")} className={selectClass}>
              <option value="">No driver</option>
              {driversData?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </Field>

          {isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status" error={errors.status?.message}>
                <select {...register("status")} className={selectClass}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="w-4 h-4 rounded border-[#1E3150] bg-[#0B1627] accent-[#1A56DB]"
                  />
                  <span className="text-sm text-[#8ba3c0]">Active</span>
                </label>
              </div>
            </div>
          )}

          {mutation.isError && (
            <p className="text-sm text-red-400">
              {(
                mutation.error as { response?: { data?: { message?: string } } }
              )?.response?.data?.message ?? "An error occurred"}
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
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
