import { IsString, IsOptional, IsBoolean, IsNumber, IsIn } from 'class-validator';
import { SUPPORTED_LOCALES } from '@common/locales';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFoodVariantDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSeasonal?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: 'Locale the label is written in',
    default: 'en',
  })
  @IsIn(SUPPORTED_LOCALES)
  @IsOptional()
  lang?: string;
}
