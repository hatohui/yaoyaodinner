import { ApiProperty } from '@nestjs/swagger';

export const EFFECTIVE_STAGES = [
  'closed',
  'open',
  'confirmed',
  'dinner',
  'finalized',
] as const;

export class OrderingStatusDto {
  @ApiProperty({ enum: EFFECTIVE_STAGES, enumName: 'OrderingStage' })
  stage: (typeof EFFECTIVE_STAGES)[number];
  @ApiProperty({ example: 'Asia/Kuala_Lumpur' }) timezone: string;
  @ApiProperty({ nullable: true, type: String }) deadline: string | null;
  @ApiProperty({ nullable: true, type: String }) dinnerTime: string | null;
  @ApiProperty() autoConfirm: boolean;
  @ApiProperty() dinnerPriceEditable: boolean;
}
