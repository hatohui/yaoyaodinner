import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonDto {
  @ApiPropertyOptional({ example: 'Amy' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
