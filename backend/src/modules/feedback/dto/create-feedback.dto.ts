import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiPropertyOptional({ maxLength: 60 })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  by?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Storage key of an attached image',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
