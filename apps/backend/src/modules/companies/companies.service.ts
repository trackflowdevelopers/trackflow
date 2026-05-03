import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyEntity } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import type { Company, PaginatedResponse } from '@trackflow/shared-types';

interface CompanyRow {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user_count: number;
}

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly companiesRepo: Repository<CompanyEntity>,
  ) {}

  async findAll(query: ListCompaniesQueryDto): Promise<PaginatedResponse<Company>> {
    const { search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 } = query;
    const em = this.companiesRepo.manager;
    const searchParam = search ? `%${search.toLowerCase()}%` : null;
    const orderCol = sortBy === 'userCount' ? 'user_count' : 'c."createdAt"';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const [{ total }] = await em.query<[{ total: string }]>(
      `SELECT COUNT(DISTINCT c.id)::int AS total
       FROM companies c
       WHERE ($1::text IS NULL OR LOWER(c.name) LIKE $1 OR LOWER(COALESCE(c.phone, '')) LIKE $1)`,
      [searchParam],
    );

    const rows = await em.query<CompanyRow[]>(
      `SELECT c.id, c.name, c.phone, c.address, c."isActive", c."createdAt", c."updatedAt",
              COUNT(u.id)::int AS user_count
       FROM companies c
       LEFT JOIN users u ON u."companyId" = c.id::text
       WHERE ($1::text IS NULL OR LOWER(c.name) LIKE $1 OR LOWER(COALESCE(c.phone, '')) LIKE $1)
       GROUP BY c.id
       ORDER BY ${orderCol} ${orderDir}
       LIMIT $2 OFFSET $3`,
      [searchParam, limit, offset],
    );

    return {
      data: rows.map(this.rowToCompany),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async findOne(id: string): Promise<Company> {
    const entity = await this.companiesRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Company ${id} not found`);
    return this.entityToCompany(entity);
  }

  async create(dto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companiesRepo.findOneBy({ name: dto.name });
    if (existing) throw new ConflictException('Company name already in use');
    const entity = this.companiesRepo.create(dto);
    const saved = await this.companiesRepo.save(entity);
    return this.entityToCompany(saved);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    const entity = await this.companiesRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Company ${id} not found`);
    Object.assign(entity, dto);
    const saved = await this.companiesRepo.save(entity);
    return this.entityToCompany(saved);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.companiesRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`Company ${id} not found`);
    await this.companiesRepo.remove(entity);
  }

  private rowToCompany(row: CompanyRow): Company {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      isActive: row.isActive,
      userCount: Number(row.user_count),
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }

  private entityToCompany(entity: CompanyEntity): Company {
    return {
      id: entity.id,
      name: entity.name,
      phone: entity.phone,
      address: entity.address,
      isActive: entity.isActive,
      userCount: 0,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
