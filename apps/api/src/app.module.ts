import { Module } from '@nestjs/common';
import { OrganizationsModule } from './organizations/organizations.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProcessesModule } from './processes/processes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, OrganizationsModule, ProcessesModule],
  controllers: [HealthController],
})
export class AppModule {}
