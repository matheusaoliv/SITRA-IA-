import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { CurrentUser, Roles } from './auth.decorators';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';
class CreateMemberDto {
  @IsString() @Length(2, 160) name!: string;
  @IsEmail() email!: string;
  @IsString() @Length(14, 200) password!: string;
  @IsEnum(OrganizationRole) role!: OrganizationRole;
}
class UpdateMemberRoleDto {
  @IsEnum(OrganizationRole) role!: OrganizationRole;
}
@Controller('organizations/:organizationId/members')
@Roles(OrganizationRole.GESTOR)
export class OrganizationMembersController {
  constructor(private readonly auth: AuthService) {}
  @Get()
  list(@Param('organizationId') organizationId: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.auth.listOrganizationUsers(organizationId, actor);
  }
  @Post()
  create(@Param('organizationId') organizationId: string, @Body() body: CreateMemberDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.auth.createOrganizationUser({ ...body, organizationId }, actor);
  }
  @Patch(':userId')
  updateRole(@Param('organizationId') organizationId: string, @Param('userId') userId: string, @Body() body: UpdateMemberRoleDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.auth.updateMembershipRole(organizationId, userId, body.role, actor);
  }
}
