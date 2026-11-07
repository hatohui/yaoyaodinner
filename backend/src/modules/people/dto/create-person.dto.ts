import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonDto {
  @ApiProperty({ example: 'Amy', maxLength: 60 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ description: 'Table to seat this person at' })
  @IsString()
  @IsNotEmpty()
  tableId: string;
}
