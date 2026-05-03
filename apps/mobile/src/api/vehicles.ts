import type {
  Vehicle,
  VehicleListQuery,
  PaginatedResponse,
  VehicleRoute,
  Company,
} from '@trackflow/shared-types';
import { apiClient } from './client';

export async function getVehicles(query: VehicleListQuery): Promise<PaginatedResponse<Vehicle>> {
  const { data } = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles', { params: query });
  return data;
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const { data } = await apiClient.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function getVehicleRoute(
  vehicleId: string,
  from: string,
  to: string,
): Promise<VehicleRoute> {
  const { data } = await apiClient.get<VehicleRoute>(`/vehicles/${vehicleId}/route`, {
    params: { from, to },
  });
  return data;
}

export async function getCompanyById(id: string): Promise<Company> {
  const { data } = await apiClient.get<Company>(`/companies/${id}`);
  return data;
}
