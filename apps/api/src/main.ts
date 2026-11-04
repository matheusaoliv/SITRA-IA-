import 'reflect-metadata';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

config({ path: process.env.ENV_FILE || '../../.env' });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  await app.listen(process.env.API_PORT || 3001);
}
bootstrap();
