import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { randomUUID } from 'crypto';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { TrackingGateway } from './tracking.gateway';
import type { FmbPayload, VehicleStatus, WsVehicleUpdate } from '@trackflow/shared-types';
import { decodeCodec8, IO_IGNITION, IO_MOVEMENT, IO_ODOMETER, IO_DALLAS_TEMP_1 } from './codec8';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class TrackingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingService.name);
  private client: mqtt.MqttClient;

  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepo: Repository<VehicleEntity>,
    private readonly gateway: TrackingGateway,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const url = this.configService.get<string>('MQTT_URL') ?? 'mqtt://localhost:1883';
    this.client = mqtt.connect(url, {
      clientId: `trackflow-server-${randomUUID()}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on('connect', () => {
      this.logger.log('MQTT connected');
      this.client.subscribe('devices/+/data', { qos: 1 });
    });

    this.client.on('message', (topic, message) => {
      void this.handleMessage(topic, message);
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT error', err.message);
    });
  }

  onModuleDestroy(): void {
    this.client?.end();
  }

  sendCommand(imei: string, command: string): void {
    const topic = `devices/${imei}/cmd`;
    this.client.publish(topic, command, { qos: 1 }, (err) => {
      if (err) this.logger.error(`Command publish failed for ${imei}: ${err.message}`);
      else this.logger.log(`Command sent to ${imei}: ${command}`);
    });
  }

  private parsePayload(imei: string, message: Buffer): FmbPayload | null {
    if (message[0] === 0x00 || message[0] === 0x08) {
      const records = decodeCodec8(message);
      if (!records || records.length === 0) {
        this.logger.warn(`Failed to decode Codec 8 from IMEI ${imei}`);
        return null;
      }
      const r = records[records.length - 1];
      return {
        ts: r.ts,
        lat: r.lat,
        lng: r.lng,
        alt: r.alt,
        speed: r.speed,
        heading: r.heading,
        sat: r.sat,
        ignition: r.io.get(IO_IGNITION) ?? 0,
        movement: r.io.get(IO_MOVEMENT) ?? 0,
        etemp: r.io.has(IO_DALLAS_TEMP_1) ? r.io.get(IO_DALLAS_TEMP_1)! / 10 : undefined,
        odo: r.io.has(IO_ODOMETER) ? r.io.get(IO_ODOMETER)! / 1000 : undefined,
      };
    }

    try {
      return JSON.parse(message.toString()) as FmbPayload;
    } catch {
      this.logger.warn(`Invalid payload from IMEI ${imei}`);
      return null;
    }
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    const parts = topic.split('/');
    if (parts.length !== 3 || parts[0] !== 'devices' || parts[2] !== 'data') return;
    const imei = parts[1];

    const payload = this.parsePayload(imei, message);
    if (!payload) return;

    const vehicle = await this.vehiclesRepo.findOneBy({ deviceImei: imei });
    if (!vehicle) {
      this.logger.debug(`Unknown IMEI: ${imei}`);
      return;
    }

    const distanceDriven =
      vehicle.lastLatitude !== null && vehicle.lastLongitude !== null
        ? haversineKm(vehicle.lastLatitude, vehicle.lastLongitude, payload.lat, payload.lng)
        : 0;

    const status = this.resolveStatus(payload.ignition, payload.speed, vehicle.status);

    vehicle.lastLatitude = payload.lat;
    vehicle.lastLongitude = payload.lng;
    vehicle.lastSpeed = payload.speed;
    vehicle.lastFuelLevel = payload.fuel ?? null;
    vehicle.lastSeenAt = new Date(payload.ts);
    vehicle.status = status;
    vehicle.totalMileage = Number(vehicle.totalMileage) + distanceDriven;

    await this.vehiclesRepo.save(vehicle);

    await this.vehiclesRepo.manager.query(
      `INSERT INTO tracking_points (
         id, "vehicleId", latitude, longitude, altitude, speed, heading,
         satellites, ignition, moving, "fuelLevel", "engineTemp", rpm,
         odometer, "distanceDriven", "timestamp"
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        randomUUID(),
        vehicle.id,
        payload.lat,
        payload.lng,
        payload.alt ?? 0,
        payload.speed ?? 0,
        payload.heading ?? 0,
        payload.sat ?? 0,
        payload.ignition === 1,
        payload.movement === 1,
        payload.fuel ?? null,
        payload.etemp ?? null,
        payload.rpm ?? null,
        payload.odo ?? null,
        distanceDriven,
        new Date(payload.ts),
      ],
    );

    const update: WsVehicleUpdate = {
      vehicleId: vehicle.id,
      plateNumber: vehicle.plateNumber,
      companyId: vehicle.companyId,
      latitude: payload.lat,
      longitude: payload.lng,
      speed: payload.speed,
      heading: payload.heading ?? 0,
      fuelLevel: payload.fuel ?? null,
      status,
      timestamp: new Date(payload.ts).toISOString(),
    };

    this.gateway.emitUpdate(update);
  }

  private resolveStatus(ignition: number, speed: number, current: VehicleStatus): VehicleStatus {
    if (current === 'maintenance') return 'maintenance';
    if (ignition === 1) return speed > 2 ? 'active' : 'idle';
    return 'stopped';
  }
}
