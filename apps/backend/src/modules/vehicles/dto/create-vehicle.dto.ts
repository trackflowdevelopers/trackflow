import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { FuelType } from '@trackflow/shared-types';

const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'gas', 'electric'];

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsEnum(FUEL_TYPES)
  fuelType: FuelType;

  @IsNumber()
  @Min(0)
  fuelTankCapacity: number;

  @IsNumber()
  @Min(0)
  fuelConsumptionNorm: number;

  @IsString()
  @IsNotEmpty()
  deviceImei: string;

  @IsString()
  @IsNotEmpty()
  companyId: string;

  @IsOptional()
  @IsString()
  currentDriverId?: string;
}
