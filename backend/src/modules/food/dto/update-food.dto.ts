import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { SUPPORTED_LOCALES } from '@common/locales';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFoodDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ nullable: true, type: String, description: 'Storage key of the image, or null to clear' })
  @IsString()
  @IsOptional()
  imageUrl?: string | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description:
      'Set to false for joke/gag menu items: guests can still order them and see a price, but they are excluded from table/split totals.',
  })
  @IsBoolean()
  @IsOptional()
  shouldCalculate?: boolean;

  @ApiPropertyOptional({
    description:
      'Staff pick: shows a recommended tag next to this food across the menu.',
  })
  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;

  @ApiPropertyOptional({
    description: 'Locale the name/description are written in',
    default: 'en',
  })
  @IsIn(SUPPORTED_LOCALES)
  @IsOptional()
  lang?: string;
}
