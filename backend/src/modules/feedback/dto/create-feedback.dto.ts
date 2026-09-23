import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  by?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'Storage key of an attached image',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
