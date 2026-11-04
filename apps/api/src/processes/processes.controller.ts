import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { AuthenticatedUser } from '../auth/auth.types';
import { CreateProcessDto } from './dto/create-process.dto';
import { ListProcessesQueryDto } from './dto/list-processes-query.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ProcessesService } from './processes.service';
@Controller('processes')
export class ProcessesController {
  constructor(private readonly processes: ProcessesService) {}
  @Post()
  @Roles(OrganizationRole.PROTOCOLO, OrganizationRole.GESTOR)
  create(@Body() dto: CreateProcessDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.processes.create(dto, actor);
  }
  @Get()
  findAll(@Query() query: ListProcessesQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.processes.findAll(query, actor);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.processes.findOne(id, actor);
  }
  @Patch(':id')
  @Roles(OrganizationRole.ANALISTA, OrganizationRole.GESTOR)
  update(@Param('id') id: string, @Body() dto: UpdateProcessDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.processes.update(id, dto, actor);
  }
}
