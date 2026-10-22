import { Injectable } from '@nestjs/common';
import { prisma } from '../../libs/prisma';
import { EventService } from '@modules/event/event.service';

@Injectable()
export class StatsService {
  constructor(private events: EventService) {}

  private async variantNames(
    variantIds: string[],
    lang: string,
  ): Promise<Map<string, string>> {
    const variants = await prisma.foodVariant.findMany({
      where: { id: { in: variantIds } },
      include: {
        translations: { where: { language: lang } },
        food: { include: { translations: { where: { language: lang } } } },
      },
    });
    const names = new Map<string, string>();
    for (const v of variants) {
      const foodName = v.food.translations[0]?.name ?? 'Unknown';
      const label = v.translations[0]?.label;
      names.set(v.id, label ? `${foodName} (${label})` : foodName);
    }
    return names;
  }

  /** `limit` 0 returns every variant that has been ordered. */
  async popular(
    scope: 'event' | 'all',
    lang = 'en',
    forEventId?: string,
    limit = 10,
  ) {
    const eventId =
      scope === 'event'
        ? await this.events.resolveEventId(forEventId)
        : undefined;
    if (scope === 'event' && !eventId) return [];

    const grouped = await prisma.order.groupBy({
      by: ['variantId'],
      where: eventId ? { eventId } : {},
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      ...(limit > 0 ? { take: limit } : {}),
    });

    const names = await this.variantNames(
      grouped.map((g) => g.variantId),
      lang,
    );

    return grouped.map((g) => ({
      variantId: g.variantId,
      name: names.get(g.variantId) ?? 'Unknown',
      count: g._sum.quantity ?? 0,
    }));
  }

  async tableTotals(forEventId?: string) {
    const eventId = await this.events.resolveEventId(forEventId);
    if (!eventId) return [];

    const tables = await prisma.table.findMany({
      where: { eventId, isStaging: false },
      orderBy: { no: 'asc' },
      include: {
        slot: { select: { name: true } },
        orders: {
          select: {
            price: true,
            quantity: true,
            variant: { select: { food: { select: { shouldCalculate: true } } } },
          },
        },
      },
    });

    const rows = tables.map((t) => ({
      tableId: t.id,
      name: t.slot?.name ?? '',
      no: t.no,
      total: t.orders.reduce(
        (sum, o) =>
          o.variant.food.shouldCalculate
            ? sum + Number(o.price) * o.quantity
            : sum,
        0,
      ),
    }));

    const nonZero = rows.filter((r) => r.total > 0);
    const avg =
      nonZero.length > 0
        ? nonZero.reduce((s, r) => s + r.total, 0) / nonZero.length
        : 0;

    return rows.map((r) => ({
      ...r,
      isOutlier: avg > 0 && r.total > avg * 1.5,
    }));
  }

  async peopleList(
    page = 1,
    count = 20,
    search?: string,
    lang = 'en',
    forEventId?: string,
  ) {
    const eventId = await this.events.resolveEventId(forEventId);
    if (!eventId) return { people: [], total: 0 };

    const where = {
      eventId,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };

    const foodInclude = {
      variant: {
        include: {
          food: { include: { translations: { where: { language: lang } } } },
        },
      },
    };

    const [people, total] = await Promise.all([
      prisma.people.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * count,
        take: count,
        include: {
          table: {
            select: {
              id: true,
              slot: { select: { name: true } },
              orders: { where: { splitAll: true }, include: foodInclude },
            },
          },
          personalNotes: { select: { content: true }, take: 1 },
          orderSplits: { include: { order: { include: foodInclude } } },
        },
      }),
      prisma.people.count({ where }),
    ]);

    const rows = people.map((p) => {
      const shared = p.table?.orders ?? [];
      const personal = p.orderSplits.map((s) => s.order);
      const ordered = Array.from(
        new Set(
          [...shared, ...personal].map(
            (o) => o.variant.food.translations[0]?.name ?? 'Unknown',
          ),
        ),
      );
      return {
        id: p.id,
        name: p.name,
        tableName: p.table?.slot?.name ?? null,
        tableId: p.table?.id ?? null,
        ordered,
        note: p.personalNotes[0]?.content ?? null,
      };
    });

    return { people: rows, total };
  }
}
