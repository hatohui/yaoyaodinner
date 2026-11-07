import {
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReactDto {
  @ApiProperty({ example: '👍', description: 'Any emoji' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  emoji: string;

  @ApiProperty({ example: 1, description: 'Number of reactions to add', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  count?: number;
}
