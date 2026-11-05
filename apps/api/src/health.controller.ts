import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/auth.decorators';
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { service: 'sitra-api', status: 'ok', decisionAuthority: 'human', version: '0.3.0' };
  }
}
