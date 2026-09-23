import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonPfpDto {
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Storage key of the profile picture, or null to clear',
  })
  @IsString()
  @IsOptional()
  pfpUrl?: string | null;
}
