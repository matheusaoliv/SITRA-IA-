import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { OrganizationMembersController } from './organization-members.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { OriginGuard } from './origin.guard';
@Module({
  controllers: [AuthController, OrganizationMembersController],
  providers: [AuthService, AuthGuard, RolesGuard, OriginGuard],
  exports: [AuthService, AuthGuard, RolesGuard, OriginGuard],
})
export class AuthModule {}
