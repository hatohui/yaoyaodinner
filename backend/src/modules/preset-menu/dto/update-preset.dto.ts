import { IsNumber, IsBoolean, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePresetDto {
  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Empty string clears the note in every language.' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({ description: 'Language the note is written in.', example: 'en' })
  @IsString()
  @IsOptional()
  lang?: string;
}
