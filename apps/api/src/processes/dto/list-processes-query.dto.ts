import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessStatus } from '@prisma/client';

export class ListProcessesQueryDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
