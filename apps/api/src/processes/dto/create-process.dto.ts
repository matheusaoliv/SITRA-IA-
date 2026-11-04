import { IsDateString, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { ProcessType } from '@prisma/client';

export class CreateProcessDto {
  @IsString()
  @Length(3, 60)
  protocolNumber!: string;

  @IsEnum(ProcessType)
  type!: ProcessType;

  @IsString()
  organizationId!: string;

  @IsString()
  @Length(3, 180)
  applicantName!: string;

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
}
