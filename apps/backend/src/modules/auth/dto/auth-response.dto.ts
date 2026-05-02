import { ApiProperty } from '@nestjs/swagger';
import { AuthUser, LoginResponse } from '@trackflow/shared-types';
import { AuthUserDto } from './auth-user.dto';

export class AuthResponseDto implements LoginResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUser;
}
