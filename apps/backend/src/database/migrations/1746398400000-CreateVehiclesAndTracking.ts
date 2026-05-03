import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehiclesAndTracking1746398400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        "plateNumber" varchar NOT NULL UNIQUE,
        make varchar NOT NULL,
        model varchar NOT NULL,
        year integer NOT NULL,
        "fuelType" varchar NOT NULL,
        "fuelTankCapacity" float NOT NULL DEFAULT 0,
        "fuelConsumptionNorm" float NOT NULL DEFAULT 0,
        "deviceImei" varchar NOT NULL UNIQUE,
        "companyId" varchar NOT NULL,
        "currentDriverId" varchar,
        status varchar NOT NULL DEFAULT 'offline',
        "lastLatitude" float,
        "lastLongitude" float,
        "lastSpeed" float,
        "lastFuelLevel" float,
        "lastSeenAt" timestamptz,
        "totalMileage" float NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tracking_points (
        id uuid DEFAULT gen_random_uuid(),
        "vehicleId" varchar NOT NULL,
        latitude float NOT NULL,
        longitude float NOT NULL,
        altitude float NOT NULL DEFAULT 0,
        speed float NOT NULL DEFAULT 0,
        heading float NOT NULL DEFAULT 0,
        satellites integer NOT NULL DEFAULT 0,
        ignition boolean NOT NULL DEFAULT false,
        moving boolean NOT NULL DEFAULT false,
        "fuelLevel" float,
        "engineTemp" float,
        rpm float,
        odometer float,
        "fuelConsumed" float,
        "distanceDriven" float,
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (id, "timestamp")
      )
    `);

    await queryRunner.query(
      `SELECT create_hypertable('tracking_points', 'timestamp', if_not_exists => TRUE)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS tracking_points`);
    await queryRunner.query(`DROP TABLE IF EXISTS vehicles`);
  }
}
