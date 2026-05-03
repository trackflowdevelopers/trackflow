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
  companyId: string;
  companyName: string | null;
  currentDriverId: string | null;
  currentDriverName: string | null;
  status: VehicleStatus;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastSpeed: number | null;
  lastFuelLevel: number | null;
  lastSeenAt: string | null;
  totalMileage: number;
  isActive: boolean;
  isImmobilized: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VehicleSortBy = 'createdAt' | 'plateNumber' | 'status' | 'totalMileage';

export interface CreateVehiclePayload {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: FuelType;
  fuelTankCapacity: number;
  fuelConsumptionNorm: number;
  deviceImei: string;
  companyId: string;
  currentDriverId?: string;
}

export interface UpdateVehiclePayload {
  plateNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  fuelType?: FuelType;
  fuelTankCapacity?: number;
  fuelConsumptionNorm?: number;
  deviceImei?: string;
  companyId?: string;
  currentDriverId?: string | null;
  status?: VehicleStatus;
  isActive?: boolean;
}

export interface VehicleListQuery {
  search?: string;
  companyId?: string;
  status?: VehicleStatus;
  sortBy?: VehicleSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  speed: number;
  ignition: boolean;
  timestamp: string;
}

export interface RouteStop {
  lat: number;
  lng: number;
  stoppedAt: string;
  resumedAt: string | null;
  durationSec: number;
}

export interface VehicleRoute {
  vehicleId: string;
  from: string;
  to: string;
  totalDistanceKm: number;
  totalDriveSec: number;
  totalStopSec: number;
  points: RoutePoint[];
  stops: RouteStop[];
}

export interface FmbPayload {
  ts: number;
  lat: number;
  lng: number;
  alt: number;
  speed: number;
  heading: number;
  sat: number;
  ignition: number;
  movement: number;
  fuel?: number;
  etemp?: number;
  rpm?: number;
  odo?: number;
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  companyName: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  phoneNumber?: string;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  companyId?: string;
  phoneNumber?: string;
  isActive?: boolean;
}

export interface UserListQuery {
  search?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  companyId?: string;
  role?: UserRole;
}

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  phone?: string;
  address?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

export type CompanySortBy = 'createdAt' | 'userCount';

export interface CompanyListQuery {
  search?: string;
  sortBy?: CompanySortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
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
  companyId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  fuelLevel: number | null;
  status: VehicleStatus;
  timestamp: string;
}

export interface ReportExportRequest {
  format: ExportFormat;
  vehicleIds: string[];
  from: string;
  to: string;
}

export type ThemeName = 'dark' | 'light';

export interface ThemeTokens {
  name: ThemeName;
  isDark: boolean;
  statusBarStyle: 'light-content' | 'dark-content';
  bg: string;
  bg2: string;
  bodyBg: string;
  surface: string;
  surface2: string;
  surfaceStrong: string;
  surfaceFloat: string;
  surfaceElev: string;
  border: string;
  borderStrong: string;
  borderSoft: string;
  text: string;
  text2: string;
  text3: string;
  textFaint: string;
  chipBg: string;
  chipBgActive: string;
  chipFgActive: string;
  overlayPlate: string;
  navBg: string;
  iconBtnBg: string;
  iconBtnFg: string;
  markerBg: string;
  markerText: string;
  markerSubtext: string;
  markerSelectedBg: string;
  markerSelectedText: string;
  markerSelectedSub: string;
  markerShadow: string;
  cardShadow: string;
  themeToggleFg: string;
}
