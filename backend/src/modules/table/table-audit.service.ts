import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../libs/prisma';
import { AI_AUDIT_ACTIONS } from './dto/table-audit.dto';
import type {
  AiUsageDto,
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

  /** AI usage rows are never pruned; they feed the admin usage board. */
  async pruneOlderThan(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await prisma.tableAudit.deleteMany({
      where: { createdAt: { lt: cutoff }, action: { notIn: [...AI_AUDIT_ACTIONS] } },
    });
    this.logger.log(`Pruned ${count} table audit rows older than ${days} days`);
    return { pruned: count };
  }

  /** Who triggers AI generations the most, busiest first. */
  async aiUsage(): Promise<AiUsageDto[]> {
    const rows = await prisma.tableAudit.findMany({
      where: { action: { in: [...AI_AUDIT_ACTIONS] } },
      orderBy: { createdAt: 'desc' },
      select: { action: true, tableNo: true, tableName: true, details: true, createdAt: true },
    });
    const byPerson = new Map<string, AiUsageDto>();
    for (const row of rows) {
      const details = (row.details as TableAuditDetailsDto | null) ?? {};
      const key = details.personId ?? 'admin';
      const entry =
        byPerson.get(key) ??
        ({
          personId: details.personId ?? null,
          personName: details.personName ?? null,
          tableNo: row.tableNo,
          tableName: row.tableName,
          total: 0,
          tableRoasts: 0,
          guestRoasts: 0,
          plans: 0,
          lastAt: row.createdAt,
        } satisfies AiUsageDto);
      entry.total += 1;
      if (row.action === 'ai_roast_table') entry.tableRoasts += 1;
      else if (row.action === 'ai_roast_guest') entry.guestRoasts += 1;
      else entry.plans += 1;
      byPerson.set(key, entry);
    }
    return [...byPerson.values()].sort((a, b) => b.total - a.total);
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
