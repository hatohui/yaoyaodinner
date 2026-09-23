import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Guest-editable subset of a table. Capacity stays admin-only (it's a hard cap),
 * but the name and who's hosting are open, matching the app's no-auth model.
 */
export class UpdateTableDetailsDto {
  @ApiPropertyOptional({ example: 'Table 4' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Person id hosting this table, or null to clear',
  })
  @IsString()
  @IsOptional()
  tableLeaderId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: String,
    description: 'Storage key of the table banner image, or null to clear',
  })
  @IsString()
  @IsOptional()
  bannerUrl?: string | null;
}
