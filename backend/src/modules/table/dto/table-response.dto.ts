import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TableDto {
  @ApiPropertyOptional({ nullable: true, type: String })
  slotId?: string | null;
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() capacity: number;
  @ApiProperty() seated: number;
  @ApiProperty() isStaging: boolean;
  @ApiProperty() no: number;
  @ApiPropertyOptional({ nullable: true, type: Number }) x: number | null;
  @ApiPropertyOptional({ nullable: true, type: Number }) y: number | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableLeaderId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableLeaderName?: string | null;
  @ApiPropertyOptional({
    type: [String],
    description: 'Seated people whose name matched the current search',
  })
  matchedPeople?: string[];
  @ApiPropertyOptional({
    type: [String],
    description: 'Everyone seated, by name (list endpoint only)',
  })
  seatedNames?: string[];
  @ApiPropertyOptional({ nullable: true, type: String })
  eventId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  bannerUrl: string | null;
  @ApiPropertyOptional({
    description: 'What the table has ordered so far (list endpoint only)',
  })
  orderTotal?: number;
  @ApiPropertyOptional({ nullable: true, type: String })
  currency?: string | null;
}

export class TableListDto {
  @ApiProperty({ type: [TableDto] }) tables: TableDto[];
  @ApiProperty() total: number;
}
