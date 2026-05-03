import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { VehicleStatus, FuelType } from '@trackflow/shared-types';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plateNumber: string;

  @Column()
  make: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column({ type: 'varchar' })
  fuelType: FuelType;

  @Column({ type: 'float', default: 0 })
  fuelTankCapacity: number;

  @Column({ type: 'float', default: 0 })
  fuelConsumptionNorm: number;

  @Column({ unique: true })
  deviceImei: string;

  @Column()
  companyId: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  currentDriverId: string | null;

  @Column({ type: 'varchar', default: 'offline' })
  status: VehicleStatus;

  @Column({ type: 'float', nullable: true, default: null })
  lastLatitude: number | null;

  @Column({ type: 'float', nullable: true, default: null })
  lastLongitude: number | null;

  @Column({ type: 'float', nullable: true, default: null })
  lastSpeed: number | null;

  @Column({ type: 'float', nullable: true, default: null })
  lastFuelLevel: number | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  lastSeenAt: Date | null;

  @Column({ type: 'float', default: 0 })
  totalMileage: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
