import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ProcessStatus } from '@prisma/client';

export class UpdateProcessDto {
  @IsOptional()
  @IsString()
  @Length(3, 180)
  applicantName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  infractionNoticeNumber?: string;

  @IsOptional()
  @IsDateString()
  violationDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  subject?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;
}
