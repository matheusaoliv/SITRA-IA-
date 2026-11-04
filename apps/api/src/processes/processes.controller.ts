import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateProcessDto } from './dto/create-process.dto';
import { ListProcessesQueryDto } from './dto/list-processes-query.dto';
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
  findAll(@Query() query: ListProcessesQueryDto) {
    return this.processes.findAll(query);
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
