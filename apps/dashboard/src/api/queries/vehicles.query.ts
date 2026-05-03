import { apiClient } from '../axios';
import type {
  Vehicle,
  VehicleListQuery,
  PaginatedResponse,
  TrackingPoint,
  VehicleRoute,
} from '@trackflow/shared-types';

export async function getVehicles(query: VehicleListQuery): Promise<PaginatedResponse<Vehicle>> {
  const { data } = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles', { params: query });
  return data;
}

export async function getVehicleById(id: string): Promise<Vehicle> {
  const { data } = await apiClient.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function getVehicleTrackingPoints(
  vehicleId: string,
  limit = 50,
): Promise<TrackingPoint[]> {
  const { data } = await apiClient.get<TrackingPoint[]>(`/vehicles/${vehicleId}/tracking-points`, {
    params: { limit },
  });
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
