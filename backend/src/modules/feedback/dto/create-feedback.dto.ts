import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
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
  @MaxLength(100)
  @Matches(/^feedback-images\/[0-9a-f-]{36}$/i, {
    message: 'Invalid image key',
  })
  imageUrl?: string;
}
