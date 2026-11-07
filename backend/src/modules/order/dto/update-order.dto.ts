import {
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Unit price actually charged, when it differs from the menu',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  splitAll?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  personIds?: string[];
}
