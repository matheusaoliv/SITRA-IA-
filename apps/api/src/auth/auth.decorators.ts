import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { RequestWithUser } from './auth.types';
export const IS_PUBLIC_KEY = 'sitra:isPublic';
export const REQUIRED_ROLES_KEY = 'sitra:requiredRoles';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const Roles = (...roles: OrganizationRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles);
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) =>
  context.switchToHttp().getRequest<RequestWithUser>().user,
);
