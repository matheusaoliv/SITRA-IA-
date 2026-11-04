import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';

@Controller('api/v1/health')
class HealthController {
  @Get()
  getHealth() {
    return { service: 'sitra-api', status: 'ok', decisionAuthority: 'human' };
  }
}

@Module({ controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.API_PORT || 3001);
}
bootstrap();
