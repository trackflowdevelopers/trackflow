import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImmobilizerToVehicles1746484800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "isImmobilized" boolean NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN IF EXISTS "isImmobilized"
    `);
  }
}
