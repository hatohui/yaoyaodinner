import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePersonPfpDto {
  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Storage key of the profile picture, or null to clear',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/^person-pfps\/[0-9a-f-]{36}$/i, {
    message: 'Invalid profile picture key',
  })
  pfpUrl?: string | null;
}
