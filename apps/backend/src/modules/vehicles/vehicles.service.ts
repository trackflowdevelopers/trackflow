import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import type {
  Vehicle,
  PaginatedResponse,
  VehicleSortBy,
  TrackingPoint,
  VehicleRoute,
  RoutePoint,
  RouteStop,
} from '@trackflow/shared-types';

interface RouteRow {
  latitude: number;
  longitude: number;
  speed: number;
  ignition: boolean;
  timestamp: Date;
  distanceDriven: number | null;
}

const MIN_STOP_SEC = 10;

interface VehicleRow {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  fuelTankCapacity: number;
  fuelConsumptionNorm: number;
  deviceImei: string;
  companyId: string;
  currentDriverId: string | null;
  status: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastSpeed: number | null;
  lastFuelLevel: number | null;
  lastSeenAt: Date | null;
  totalMileage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyName: string | null;
  currentDriverName: string | null;
}

const SORT_COLUMN: Record<VehicleSortBy, string> = {
  createdAt: 'v."createdAt"',
  plateNumber: 'v."plateNumber"',
  status: 'v.status',
  totalMileage: 'v."totalMileage"',
};

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepo: Repository<VehicleEntity>,
  ) {}

  async findAll(query: ListVehiclesQueryDto): Promise<PaginatedResponse<Vehicle>> {
    const {
      search,
      companyId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = query;
    const em = this.vehiclesRepo.manager;
    const searchParam = search ? `%${search.toLowerCase()}%` : null;
    const companyParam = companyId ?? null;
    const statusParam = status ?? null;
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const sortCol = SORT_COLUMN[sortBy] ?? 'v."createdAt"';
    const offset = (page - 1) * limit;

    const [{ total }] = await em.query<[{ total: string }]>(
      `SELECT COUNT(*)::int AS total
       FROM vehicles v
       WHERE ($1::text IS NULL OR LOWER(v."plateNumber") LIKE $1
              OR LOWER(v.make) LIKE $1 OR LOWER(v.model) LIKE $1
              OR LOWER(v."deviceImei") LIKE $1)
         AND ($2::text IS NULL OR v."companyId" = $2)
         AND ($3::text IS NULL OR v.status = $3)`,
      [searchParam, companyParam, statusParam],
    );

    const rows = await em.query<VehicleRow[]>(
      `SELECT v.id, v."plateNumber", v.make, v.model, v.year, v."fuelType",
              v."fuelTankCapacity", v."fuelConsumptionNorm", v."deviceImei",
              v."companyId", v."currentDriverId", v.status,
              v."lastLatitude", v."lastLongitude", v."lastSpeed", v."lastFuelLevel",
              v."lastSeenAt", v."totalMileage", v."isActive", v."createdAt", v."updatedAt",
              c.name AS "companyName",
              CASE WHEN u.id IS NOT NULL
                THEN u."firstName" || ' ' || u."lastName"
                ELSE NULL
              END AS "currentDriverName"
       FROM vehicles v
       LEFT JOIN companies c ON c.id::text = v."companyId"
       LEFT JOIN users u ON u.id::text = v."currentDriverId"
       WHERE ($1::text IS NULL OR LOWER(v."plateNumber") LIKE $1
              OR LOWER(v.make) LIKE $1 OR LOWER(v.model) LIKE $1
              OR LOWER(v."deviceImei") LIKE $1)
         AND ($2::text IS NULL OR v."companyId" = $2)
         AND ($3::text IS NULL OR v.status = $3)
       ORDER BY ${sortCol} ${orderDir}
       LIMIT $4 OFFSET $5`,
      [searchParam, companyParam, statusParam, limit, offset],
    );

    return {
      data: rows.map(this.rowToVehicle),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async findOne(id: string): Promise<Vehicle> {
    const em = this.vehiclesRepo.manager;
    const rows = await em.query<VehicleRow[]>(
      `SELECT v.id, v."plateNumber", v.make, v.model, v.year, v."fuelType",
              v."fuelTankCapacity", v."fuelConsumptionNorm", v."deviceImei",
              v."companyId", v."currentDriverId", v.status,
              v."lastLatitude", v."lastLongitude", v."lastSpeed", v."lastFuelLevel",
              v."lastSeenAt", v."totalMileage", v."isActive", v."createdAt", v."updatedAt",
              c.name AS "companyName",
              CASE WHEN u.id IS NOT NULL
                THEN u."firstName" || ' ' || u."lastName"
                ELSE NULL
              END AS "currentDriverName"
       FROM vehicles v
       LEFT JOIN companies c ON c.id::text = v."companyId"
       LEFT JOIN users u ON u.id::text = v."currentDriverId"
       WHERE v.id = $1`,
      [id],
    );
    if (!rows.length) throw new NotFoundException(`Vehicle ${id} not found`);
    return this.rowToVehicle(rows[0]);
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehiclesRepo.findOneBy({ plateNumber: dto.plateNumber });
    if (existing) throw new ConflictException('Plate number already in use');
    const imeiExists = await this.vehiclesRepo.findOneBy({ deviceImei: dto.deviceImei });
    if (imeiExists) throw new ConflictException('Device IMEI already in use');
    const entity = this.vehiclesRepo.create({
      ...dto,
      currentDriverId: dto.currentDriverId ?? null,
    });
    const saved = await this.vehiclesRepo.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const entity = await this.vehiclesRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Vehicle ${id} not found`);
    if (dto.plateNumber && dto.plateNumber !== entity.plateNumber) {
      const existing = await this.vehiclesRepo.findOneBy({ plateNumber: dto.plateNumber });
      if (existing) throw new ConflictException('Plate number already in use');
    }
    if (dto.deviceImei && dto.deviceImei !== entity.deviceImei) {
      const existing = await this.vehiclesRepo.findOneBy({ deviceImei: dto.deviceImei });
      if (existing) throw new ConflictException('Device IMEI already in use');
    }
    Object.assign(entity, dto);
    await this.vehiclesRepo.save(entity);
    return this.findOne(id);
  }

  async getRoute(vehicleId: string, from: Date, to: Date): Promise<VehicleRoute> {
    const em = this.vehiclesRepo.manager;
    const rows = await em.query<RouteRow[]>(
      `SELECT latitude, longitude, speed, ignition, timestamp, "distanceDriven"
       FROM tracking_points
       WHERE "vehicleId" = $1 AND timestamp >= $2 AND timestamp < $3
       ORDER BY timestamp ASC`,
      [vehicleId, from, to],
    );

    const points: RoutePoint[] = rows.map((r) => ({
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      speed: Number(r.speed),
      ignition: r.ignition,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    const stops: RouteStop[] = [];
    let stopStartIdx: number | null = null;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.ignition && stopStartIdx === null) {
        stopStartIdx = i;
      } else if (row.ignition && stopStartIdx !== null) {
        const startRow = rows[stopStartIdx];
        const durationSec =
          (new Date(row.timestamp).getTime() - new Date(startRow.timestamp).getTime()) / 1000;
        if (durationSec >= MIN_STOP_SEC) {
          stops.push({
            lat: Number(startRow.latitude),
            lng: Number(startRow.longitude),
            stoppedAt: new Date(startRow.timestamp).toISOString(),
            resumedAt: new Date(row.timestamp).toISOString(),
            durationSec,
          });
        }
        stopStartIdx = null;
      }
    }

    if (stopStartIdx !== null && rows.length > 0) {
      const startRow = rows[stopStartIdx];
      const lastRow = rows[rows.length - 1];
      const durationSec =
        (new Date(lastRow.timestamp).getTime() - new Date(startRow.timestamp).getTime()) / 1000;
      if (durationSec >= MIN_STOP_SEC) {
        stops.push({
          lat: Number(startRow.latitude),
          lng: Number(startRow.longitude),
          stoppedAt: new Date(startRow.timestamp).toISOString(),
          resumedAt: null,
          durationSec,
        });
      }
    }

    const totalDistanceKm = rows.reduce((sum, r) => sum + Number(r.distanceDriven ?? 0), 0);
    const totalStopSec = stops.reduce((sum, s) => sum + s.durationSec, 0);
    const totalSpanSec =
      rows.length >= 2
        ? (new Date(rows[rows.length - 1].timestamp).getTime() -
            new Date(rows[0].timestamp).getTime()) /
          1000
        : 0;
    const totalDriveSec = Math.max(0, totalSpanSec - totalStopSec);

    return {
      vehicleId,
      from: from.toISOString(),
      to: to.toISOString(),
      totalDistanceKm,
      totalDriveSec,
      totalStopSec,
      points,
      stops,
    };
  }

  async getTrackingPoints(vehicleId: string, limit: number): Promise<TrackingPoint[]> {
    const em = this.vehiclesRepo.manager;
    return em.query<TrackingPoint[]>(
      `SELECT id, "vehicleId", latitude, longitude, altitude, speed, heading,
              satellites, ignition, moving, "fuelLevel", "engineTemp", rpm,
              odometer, "fuelConsumed", "distanceDriven", "timestamp"
       FROM tracking_points
       WHERE "vehicleId" = $1
       ORDER BY "timestamp" DESC
       LIMIT $2`,
      [vehicleId, limit],
    );
  }

  async remove(id: string): Promise<void> {
    const entity = await this.vehiclesRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Vehicle ${id} not found`);
    await this.vehiclesRepo.remove(entity);
  }

  private rowToVehicle(row: VehicleRow): Vehicle {
    return {
      id: row.id,
      plateNumber: row.plateNumber,
      make: row.make,
      model: row.model,
      year: row.year,
      fuelType: row.fuelType as Vehicle['fuelType'],
      fuelTankCapacity: Number(row.fuelTankCapacity),
      fuelConsumptionNorm: Number(row.fuelConsumptionNorm),
      deviceImei: row.deviceImei,
      companyId: row.companyId,
      companyName: row.companyName,
      currentDriverId: row.currentDriverId,
      currentDriverName: row.currentDriverName,
      status: row.status as Vehicle['status'],
      lastLatitude: row.lastLatitude !== null ? Number(row.lastLatitude) : null,
      lastLongitude: row.lastLongitude !== null ? Number(row.lastLongitude) : null,
      lastSpeed: row.lastSpeed !== null ? Number(row.lastSpeed) : null,
      lastFuelLevel: row.lastFuelLevel !== null ? Number(row.lastFuelLevel) : null,
      lastSeenAt: row.lastSeenAt ? new Date(row.lastSeenAt).toISOString() : null,
      totalMileage: Number(row.totalMileage),
      isActive: row.isActive,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
