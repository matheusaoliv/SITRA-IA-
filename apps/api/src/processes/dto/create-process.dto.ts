import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ProcessType } from '@prisma/client';
import { Trim } from '../../common/trim.decorator';

export class CreateProcessDto {
  @Trim()
  @IsString()
  @Length(3, 60)
  protocolNumber!: string;

  @IsEnum(ProcessType)
  type!: ProcessType;

  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @Trim()
  @IsString()
  @Length(3, 180)
  applicantName!: string;

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
}
