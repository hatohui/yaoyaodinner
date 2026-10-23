import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Subset of a table that guests holding its code can edit. Capacity and the host
 * stay admin-only.
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
    description:
      'Person id hosting this table, or null to clear (admin passphrase required)',
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
