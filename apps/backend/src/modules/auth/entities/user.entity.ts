import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserRole } from '@trackflow/shared-types';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  companyId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
