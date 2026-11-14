import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ProcessStatus } from '@prisma/client';
import { Trim } from '../../common/trim.decorator';

export class UpdateProcessDto {
  @Trim()
  @IsOptional()
  @IsString()
  @Length(3, 180)
  applicantName?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  infractionNoticeNumber?: string;

  @IsOptional()
  @IsDateString()
  violationDate?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  subject?: string;

  @IsOptional()
  @IsEnum(ProcessStatus)
  status?: ProcessStatus;
}
