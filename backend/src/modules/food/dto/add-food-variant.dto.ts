import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddFoodVariantDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiPropertyOptional({ nullable: true })
  @IsNumber()
  @IsOptional()
  price?: number | null;

  @ApiPropertyOptional({ example: 'RM' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isSeasonal?: boolean;

  @ApiPropertyOptional({
    description: 'Locale the label is written in',
    default: 'en',
  })
  @IsString()
  @IsOptional()
  lang?: string;
}
