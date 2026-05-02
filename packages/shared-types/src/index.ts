export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MANAGER = 'MANAGER',
  DRIVER = 'DRIVER',
}

export type VehicleStatus = 'active' | 'idle' | 'stopped' | 'offline' | 'maintenance';
export type FuelType = 'petrol' | 'diesel' | 'gas' | 'electric';
export type AlertType = 'speeding' | 'fuel_low' | 'geofence_exit' | 'geofence_enter' | 'engine_fault' | 'offline' | 'harsh_braking';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type GeofenceType = 'circle' | 'polygon';
export type ExportFormat = 'pdf' | 'excel';

export interface SpeedingAlertData {
  speed: number;
  limit: number;
}

export interface FuelLowAlertData {
  fuelLevel: number;
  threshold: number;
}

export interface GeofenceAlertData {
  geofenceId: string;
  geofenceName: string;
}

export interface EngineFaultAlertData {
  code: string;
  description: string;
}

export interface OfflineAlertData {
  lastSeenAt: string;
}

export interface HarshBrakingAlertData {
  deceleration: number;
}

export type AlertData =
  | SpeedingAlertData
  | FuelLowAlertData
  | GeofenceAlertData
  | EngineFaultAlertData
  | OfflineAlertData
  | HarshBrakingAlertData;

export interface Vehicle {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  fuelTankCapacity: number;
  fuelConsumptionNorm: number;
  deviceImei: string;
  status: VehicleStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastSpeed: number | null;
  lastFuelLevel: number | null;
  lastSeenAt: string | null;
  totalMileage: number;
  currentDriver: Driver | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  isActive: boolean;
  currentVehicle: Vehicle | null;
}

export interface TrackingPoint {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  satellites: number;
  ignition: boolean;
  moving: boolean;
  fuelLevel: number | null;
  engineTemp: number | null;
  rpm: number | null;
  odometer: number | null;
  fuelConsumed: number | null;
  distanceDriven: number | null;
  timestamp: string;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicle: Pick<Vehicle, 'plateNumber' | 'make' | 'model'>;
  driverId: string | null;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  data: AlertData;
  isRead: boolean;
  createdAt: string;
}

export interface CircleGeofence {
  type: 'circle';
  center: [number, number];
  radius: number;
}

export interface PolygonGeofence {
  type: 'polygon';
  coordinates: [number, number][];
}

export interface Geofence {
  id: string;
  name: string;
  type: GeofenceType;
  geometry: CircleGeofence | PolygonGeofence;
  vehicleIds: string[];
  alertOnEnter: boolean;
  alertOnExit: boolean;
  isActive: boolean;
}

export interface FuelReport {
  vehicleId: string;
  plateNumber: string;
  period: { from: string; to: string };
  totalFuelConsumedL: number;
  totalDistanceKm: number;
  avgConsumptionPer100Km: number;
  normConsumptionPer100Km: number;
  overspendL: number;
  fuelCostUzs: number;
  efficiencyPercent: number;
}

export interface FleetSummary {
  totalVehicles: number;
  activeVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  maintenanceVehicles: number;
  totalDistanceTodayKm: number;
  totalFuelTodayL: number;
  totalFuelCostTodayUzs: number;
  fuelSavingsPotentialPercent: number;
  activeAlerts: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WsVehicleUpdate {
  vehicleId: string;
  plateNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuelLevel: number;
  status: VehicleStatus;
  timestamp: string;
}

export interface ReportExportRequest {
  format: ExportFormat;
  vehicleIds: string[];
  from: string;
  to: string;
}
