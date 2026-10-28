import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ORDERING_STAGES = [
  'closed',
  'open',
  'confirmed',
  'finalized',
] as const;

export class SetOrderingStageDto {
  @ApiProperty({ enum: ORDERING_STAGES, enumName: 'StoredOrderingStage' })
  @IsIn(ORDERING_STAGES)
  stage: (typeof ORDERING_STAGES)[number];

  @ApiPropertyOptional({ description: 'Owner passphrase required to re-open a finalized event' })
  @IsOptional()
  @IsString()
  passphrase?: string;
}
