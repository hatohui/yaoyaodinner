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
  'ai_roast_table',
  'ai_roast_guest',
  'ai_plan',
] as const;
export const AI_AUDIT_ACTIONS = ['ai_roast_table', 'ai_roast_guest', 'ai_plan'] as const;
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
  @ApiPropertyOptional({ description: 'Guest who triggered an AI generation' })
  personId?: string;
  @ApiPropertyOptional({ description: 'Their name at the time' })
  personName?: string;
  @ApiPropertyOptional({ description: 'Guest being roasted' })
  targetName?: string;
}

export class AiUsageDto {
  @ApiProperty({ nullable: true, type: String, description: 'Null for admin calls' })
  personId: string | null;
  @ApiProperty({ nullable: true, type: String })
  personName: string | null;
  @ApiPropertyOptional({ nullable: true, type: Number })
  tableNo: number | null;
  @ApiPropertyOptional({ nullable: true, type: String })
  tableName: string | null;
  @ApiProperty() total: number;
  @ApiProperty() tableRoasts: number;
  @ApiProperty() guestRoasts: number;
  @ApiProperty() plans: number;
  @ApiProperty({ type: String, format: 'date-time' }) lastAt: Date;
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
