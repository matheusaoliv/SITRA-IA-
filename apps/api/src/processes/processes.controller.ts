import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ProcessStatus } from '@prisma/client';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { ProcessesService } from './processes.service';

@Controller('processes')
export class ProcessesController {
  constructor(private readonly processes: ProcessesService) {}

  @Post()
  create(@Body() dto: CreateProcessDto) {
    return this.processes.create(dto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: ProcessStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.processes.findAll({
      organizationId,
      status,
      search: search?.trim(),
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.processes.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProcessDto) {
    return this.processes.update(id, dto);
  }
}
