import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWeirdFoodDto {
  @ApiProperty({ description: 'Stored image key of the uploaded photo' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageKey: string;
}
