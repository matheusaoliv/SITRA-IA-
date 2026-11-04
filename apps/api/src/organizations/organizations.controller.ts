import { Body, Controller, Get, Post } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}
  @Post()
  @Roles(OrganizationRole.GESTOR)
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.organizations.create(dto, user);
  }
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.findAll(user);
  }
}
