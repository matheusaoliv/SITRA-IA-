import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(2, 20)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;
}
