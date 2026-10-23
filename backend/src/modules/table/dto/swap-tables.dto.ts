import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SwapTablesDto {
  @ApiProperty({ type: [String], minItems: 2, maxItems: 2 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  ids: string[];
}
