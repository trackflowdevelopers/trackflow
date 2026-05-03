import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { FuelType, VehicleStatus } from '@trackflow/shared-types';

const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'gas', 'electric'];
const VEHICLE_STATUSES: VehicleStatus[] = ['active', 'idle', 'stopped', 'offline', 'maintenance'];

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsEnum(FUEL_TYPES)
  fuelType?: FuelType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelTankCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelConsumptionNorm?: number;

  @IsOptional()
  @IsString()
  deviceImei?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  currentDriverId?: string | null;

  @IsOptional()
  @IsEnum(VEHICLE_STATUSES)
  status?: VehicleStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
