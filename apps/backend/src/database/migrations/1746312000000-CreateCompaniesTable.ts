import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompaniesTable1746312000000 implements MigrationInterface {
  name = 'CreateCompaniesTable1746312000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id"        uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name"      character varying NOT NULL,
        "phone"     character varying,
        "address"   character varying,
        "isActive"  boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_companies_name" UNIQUE ("name"),
        CONSTRAINT "PK_companies_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
