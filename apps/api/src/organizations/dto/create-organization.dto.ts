import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Trim } from '../../common/trim.decorator';

export class CreateOrganizationDto {
  @Trim()
  @IsString()
  @Length(2, 160)
  name!: string;

  @Trim()
  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;
}
