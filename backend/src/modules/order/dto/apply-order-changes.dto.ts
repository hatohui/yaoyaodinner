import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BatchOrderItemDto } from './batch-create-order.dto';

export class OrderCutDto {
  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'The new quantity; 0 deletes the order' })
  @IsInt()
  @Min(0)
  @Max(99)
  quantity: number;
}

export class ApplyOrderChangesDto {
  @ApiProperty()
  @IsString()
  tableId: string;

  @ApiProperty({
    type: [BatchOrderItemDto],
    description: 'Dishes to add, shared by the whole table',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BatchOrderItemDto)
  adds: BatchOrderItemDto[];

  @ApiProperty({ type: [OrderCutDto], description: 'Existing orders to shrink or delete' })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderCutDto)
  cuts: OrderCutDto[];
}
