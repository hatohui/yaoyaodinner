import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchOrderItemDto {
  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  quantity?: number;
}

export class BatchCreateOrderDto {
  @ApiProperty()
  @IsString()
  tableId: string;

  @ApiProperty({ type: [BatchOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BatchOrderItemDto)
  items: BatchOrderItemDto[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  splitAll?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  personIds?: string[];
}
