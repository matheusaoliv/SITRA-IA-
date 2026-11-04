import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      service: 'sitra-api',
      status: 'ok',
      decisionAuthority: 'human',
      version: '0.2.0',
    };
  }
}
