import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { User, PaginatedResponse, UserRole } from '@trackflow/shared-types';

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  companyName: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  async findAll(query: ListUsersQueryDto): Promise<PaginatedResponse<User>> {
    const { search, sortOrder = 'desc', page = 1, limit = 20, companyId, role } = query;
    const em = this.usersRepo.manager;
    const searchParam = search ? `%${search.toLowerCase()}%` : null;
    const companyParam = companyId ?? null;
    const roleParam = role ?? null;
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;

    const [{ total }] = await em.query<[{ total: string }]>(
      `SELECT COUNT(*)::int AS total
       FROM users u
       WHERE ($1::text IS NULL OR LOWER(u."firstName") LIKE $1 OR LOWER(u."lastName") LIKE $1
              OR LOWER(u.email) LIKE $1 OR LOWER(COALESCE(u."phoneNumber", '')) LIKE $1)
         AND ($2::text IS NULL OR u."companyId" = $2)
         AND ($3::text IS NULL OR u.role::text = $3)`,
      [searchParam, companyParam, roleParam],
    );

    const rows = await em.query<UserRow[]>(
      `SELECT u.id, u.email, u."firstName", u."lastName", u.role, u."companyId",
              u."phoneNumber", u."isActive", u."createdAt", u."updatedAt",
              c.name AS "companyName"
       FROM users u
       LEFT JOIN companies c ON c.id::text = u."companyId"
       WHERE ($1::text IS NULL OR LOWER(u."firstName") LIKE $1 OR LOWER(u."lastName") LIKE $1
              OR LOWER(u.email) LIKE $1 OR LOWER(COALESCE(u."phoneNumber", '')) LIKE $1)
         AND ($2::text IS NULL OR u."companyId" = $2)
         AND ($3::text IS NULL OR u.role::text = $3)
       ORDER BY u."createdAt" ${orderDir}
       LIMIT $4 OFFSET $5`,
      [searchParam, companyParam, roleParam, limit, offset],
    );

    return {
      data: rows.map(this.rowToUser),
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const em = this.usersRepo.manager;
    const rows = await em.query<UserRow[]>(
      `SELECT u.id, u.email, u."firstName", u."lastName", u.role, u."companyId",
              u."phoneNumber", u."isActive", u."createdAt", u."updatedAt",
              c.name AS "companyName"
       FROM users u
       LEFT JOIN companies c ON c.id::text = u."companyId"
       WHERE u.id = $1`,
      [id],
    );
    if (!rows.length) throw new NotFoundException(`User ${id} not found`);
    return this.rowToUser(rows[0]);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepo.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const { password, ...rest } = dto;
    void password;
    const entity = this.usersRepo.create({ ...rest, passwordHash });
    const saved = await this.usersRepo.save(entity);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const entity = await this.usersRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`User ${id} not found`);
    const { password, ...rest } = dto;
    if (password) {
      entity.passwordHash = await bcrypt.hash(password, 10);
    }
    Object.assign(entity, rest);
    await this.usersRepo.save(entity);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.usersRepo.findOneBy({ id });
    if (!entity) throw new NotFoundException(`User ${id} not found`);
    await this.usersRepo.remove(entity);
  }

  private rowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      companyId: row.companyId,
      companyName: row.companyName,
      phoneNumber: row.phoneNumber,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
    };
  }
}
