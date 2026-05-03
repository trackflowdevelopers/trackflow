import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { VehicleStatus, VehicleSortBy } from '@trackflow/shared-types';

const VEHICLE_STATUSES: VehicleStatus[] = ['active', 'idle', 'stopped', 'offline', 'maintenance'];
const SORT_FIELDS: VehicleSortBy[] = ['createdAt', 'plateNumber', 'status', 'totalMileage'];

export class ListVehiclesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsEnum(VEHICLE_STATUSES)
  status?: VehicleStatus;

  @IsOptional()
  @IsEnum(SORT_FIELDS)
  sortBy?: VehicleSortBy;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
