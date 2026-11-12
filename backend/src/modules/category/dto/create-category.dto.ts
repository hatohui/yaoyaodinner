import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { SUPPORTED_LOCALES } from '@common/locales';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'appetizers' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'Appetizers' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Locale the name/description are written in',
    default: 'en',
  })
  @IsIn(SUPPORTED_LOCALES)
  @IsOptional()
  lang?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
