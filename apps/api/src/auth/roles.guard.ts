import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLES_KEY } from './auth.decorators';
import { RequestWithUser } from './auth.types';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<RequestWithUser>().user;
    if (user?.isSystemAdmin) return true;
    if (!user?.memberships.some((membership) => roles.includes(membership.role))) throw new ForbiddenException('Seu perfil não permite executar esta operação.');
    return true;
  }
}
