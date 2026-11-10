import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../libs/prisma';
import type {
  TableAuditAction,
  TableAuditActor,
  TableAuditDetailsDto,
  TableAuditDto,
} from './dto/table-audit.dto';

export interface TableAuditEntry {
  action: TableAuditAction;
  actor: TableAuditActor;
  tableId?: string | null;
  eventId?: string | null;
  tableNo?: number | null;
  tableName?: string | null;
  details?: TableAuditDetailsDto;
}

@Injectable()
export class TableAuditService {
  private readonly logger = new Logger(TableAuditService.name);

  /** Never fails the change itself - a missing history row beats a failed edit. */
  async log(...entries: TableAuditEntry[]) {
    if (entries.length === 0) return;
    try {
      await prisma.tableAudit.createMany({
        data: entries.map((e) => ({
          id: uuidv4(),
          action: e.action,
          actor: e.actor,
          tableId: e.tableId ?? null,
          eventId: e.eventId ?? null,
          tableNo: e.tableNo ?? null,
          tableName: e.tableName ?? null,
          details: (e.details ?? Prisma.DbNull) as Prisma.InputJsonValue,
        })),
      });
    } catch (error) {
      this.logger.error('Failed to write table audit', error);
    }
  }

  async pruneOlderThan(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await prisma.tableAudit.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(`Pruned ${count} table audit rows older than ${days} days`);
    return { pruned: count };
  }

  async list(count: number): Promise<TableAuditDto[]> {
    const rows = await prisma.tableAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: count,
    });
    return rows.map((r) => ({
      ...r,
      action: r.action as TableAuditAction,
      actor: r.actor as TableAuditActor,
      details: (r.details as TableAuditDetailsDto | null) ?? null,
    }));
  }
}
