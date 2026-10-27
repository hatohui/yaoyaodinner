import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ORDERING_STAGES } from './set-ordering-stage.dto';

export class EventDto {
  @ApiProperty() id: string;
  @ApiProperty() pin: string;
  @ApiPropertyOptional({ nullable: true, type: String }) name: string | null;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional({ nullable: true, type: String })
  presetMenuId: string | null;
  @ApiProperty({ enum: ORDERING_STAGES, enumName: 'StoredOrderingStage' })
  orderingStage: (typeof ORDERING_STAGES)[number];
  @ApiProperty() createdAt: string;
}

export class EventStatsDto {
  @ApiProperty() tables: number;
  @ApiProperty() occupied: number;
  @ApiProperty() people: number;
  @ApiProperty() orders: number;
}

export class EventSummaryDto extends EventDto {
  @ApiProperty({ type: EventStatsDto }) stats: EventStatsDto;
}
