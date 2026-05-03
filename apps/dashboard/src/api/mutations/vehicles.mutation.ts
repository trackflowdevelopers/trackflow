import { apiClient } from '../axios';
import type { Vehicle, CreateVehiclePayload, UpdateVehiclePayload } from '@trackflow/shared-types';

export async function createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
  const { data } = await apiClient.post<Vehicle>('/vehicles', payload);
  return data;
}

export async function updateVehicle(id: string, payload: UpdateVehiclePayload): Promise<Vehicle> {
  const { data } = await apiClient.patch<Vehicle>(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/vehicles/${id}`);
}
