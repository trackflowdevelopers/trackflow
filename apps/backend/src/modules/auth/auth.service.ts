import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUser, LoginResponse } from '@trackflow/shared-types';
import { UserEntity } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, isActive: true },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.buildTokens(user);
  }

  async refresh(dto: RefreshDto): Promise<LoginResponse> {
    let payload: AuthUser;
    try {
      payload = this.jwtService.verify<AuthUser>(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.id, isActive: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return this.buildTokens(user);
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.toAuthUser(user);
  }

  private buildTokens(user: UserEntity): LoginResponse {
    const authUser = this.toAuthUser(user);
    const accessToken = this.jwtService.sign(authUser, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN'),
    });
    const refreshToken = this.jwtService.sign(authUser, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
    return { accessToken, refreshToken, user: authUser };
  }

  private toAuthUser(user: UserEntity): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
