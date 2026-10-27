import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
