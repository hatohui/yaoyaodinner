import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const TABLE_AUDIT_ACTIONS = [
  'created',
  'bulk_created',
  'renamed',
  'capacity_changed',
  'banner_changed',
  'host_changed',
  'numbers_swapped',
  'moved_to_staging',
  'deleted',
] as const;
export type TableAuditAction = (typeof TABLE_AUDIT_ACTIONS)[number];

export const TABLE_AUDIT_ACTORS = ['admin', 'guest'] as const;
export type TableAuditActor = (typeof TABLE_AUDIT_ACTORS)[number];

export class TableAuditDetailsDto {
  @ApiPropertyOptional({ nullable: true, type: String }) from?: string | null;
  @ApiPropertyOptional({ nullable: true, type: String }) to?: string | null;
  @ApiPropertyOptional({ description: 'Swap partner number' }) withNo?: number;
  @ApiPropertyOptional({ description: 'Swap partner name' }) withName?: string;
  @ApiPropertyOptional({ description: 'Tables created in one go' })
  count?: number;
  @ApiPropertyOptional({ description: 'People seated when deleted' })
  seated?: number;
}

export class TableAuditDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: TABLE_AUDIT_ACTIONS }) action: TableAuditAction;
  @ApiProperty({ enum: TABLE_AUDIT_ACTORS }) actor: TableAuditActor;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableId: string | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  eventId: string | null;
  @ApiPropertyOptional({ nullable: true, type: Number })
  tableNo: number | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableName: string | null;
  @ApiPropertyOptional({ type: TableAuditDetailsDto, nullable: true })
  details: TableAuditDetailsDto | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}
