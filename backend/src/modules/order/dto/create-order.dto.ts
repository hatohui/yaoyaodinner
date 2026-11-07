import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  tableId: string;

  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({
    default: true,
    description: 'Shared by the whole table (default)',
  })
  @IsBoolean()
  @IsOptional()
  splitAll?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: 'People the cost is split across when splitAll is false',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  personIds?: string[];
}
