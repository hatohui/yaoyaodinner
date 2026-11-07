import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  personId: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @MaxLength(500)
  content: string;
}
