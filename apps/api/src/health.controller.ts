import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Public } from './auth/auth.decorators';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ service: 'sitra-api', status: 'error', database: 'unavailable' });
    }
    return { service: 'sitra-api', status: 'ok', database: 'ok', decisionAuthority: 'human', version: '0.4.0' };
  }
}
