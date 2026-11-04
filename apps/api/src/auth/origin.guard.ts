import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { RequestWithUser } from './auth.types';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) return true;
    const origin = request.headers.origin;
    const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((item) => item.trim()).filter(Boolean);
    if (!origin || !allowed.includes(origin)) throw new ForbiddenException('Origem da requisição não autorizada.');
    return true;
  }
}
