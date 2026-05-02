import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '@trackflow/shared-types';

export const CurrentUser = createParamDecorator(
  (_: string, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
