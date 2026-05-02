import { ApiProperty } from '@nestjs/swagger';
import { AuthUser, UserRole } from '@trackflow/shared-types';

export class AuthUserDto implements AuthUser {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  companyId: string;
}
