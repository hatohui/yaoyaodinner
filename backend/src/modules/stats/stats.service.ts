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
        food: {
          include: {
            translations: { where: { language: lang } },
            _count: { select: { variants: true } },
          },
        },
      },
    });
    const names = new Map<string, string>();
    for (const v of variants) {
      const foodName = v.food.translations[0]?.name ?? 'Unknown';
      const label = v.translations[0]?.label?.trim();
      const suffix =
        label ||
        (v.food._count.variants > 1 && v.price !== null
          ? `${Number(v.price)} ${v.currency}`
          : '');
      names.set(v.id, suffix ? `${foodName} (${suffix})` : foodName);
    }
    return names;
  }

  /** `limit` 0 returns every item that has been ordered. */
  async popular(
    scope: 'event' | 'all',
    lang = 'en',
    forEventId?: string,
    limit = 10,
    includeJokes = true,
    groupBy: 'food' | 'variant' = 'food',
  ) {
    const eventId =
      scope === 'event'
        ? await this.events.resolveEventId(forEventId)
        : undefined;
    if (scope === 'event' && !eventId) return [];

    const grouped = await prisma.order.groupBy({
      by: ['variantId'],
      where: {
        ...(eventId ? { eventId } : {}),
        ...(includeJokes ? {} : { variant: { food: { shouldCalculate: true } } }),
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      ...(groupBy === 'variant' && limit > 0 ? { take: limit } : {}),
    });

    if (groupBy === 'variant') {
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

    const variants = await prisma.foodVariant.findMany({
      where: { id: { in: grouped.map((g) => g.variantId) } },
      select: {
        id: true,
        foodId: true,
        food: {
          select: {
            translations: {
              where: { language: lang },
              select: { name: true },
            },
          },
        },
      },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));
    const byFood = new Map<string, { name: string; count: number }>();

    for (const g of grouped) {
      const v = variantMap.get(g.variantId);
      if (!v) continue;
      const qty = g._sum.quantity ?? 0;
      const existing = byFood.get(v.foodId);
      if (existing) {
        existing.count += qty;
      } else {
        byFood.set(v.foodId, {
          name: v.food.translations[0]?.name ?? 'Unknown',
          count: qty,
        });
      }
    }

    const sorted = Array.from(byFood.entries())
      .map(([foodId, info]) => ({
        variantId: foodId,
        name: info.name,
        count: info.count,
      }))
      .sort((a, b) => b.count - a.count);

    return limit > 0 ? sorted.slice(0, limit) : sorted;
  }

  async tableTotals(forEventId?: string) {
    const eventId = await this.events.resolveEventId(forEventId);
    if (!eventId) return [];

    const [tables, preset] = await Promise.all([
      prisma.table.findMany({
        where: { eventId, isStaging: false },
        orderBy: { no: 'asc' },
        include: {
          slot: { select: { name: true } },
          _count: { select: { people: true } },
          orders: {
            select: {
              price: true,
              quantity: true,
              variant: { select: { food: { select: { shouldCalculate: true } } } },
            },
          },
        },
      }),
      this.events.getPresetPrice(eventId),
    ]);

    const rows = tables.map((t) => {
      const ordersTotal = t.orders.reduce(
        (sum, o) =>
          o.variant.food.shouldCalculate
            ? sum + Number(o.price) * o.quantity
            : sum,
        0,
      );
      return {
        tableId: t.id,
        name: t.slot?.name ?? '',
        no: t.no,
        total: (t._count.people > 0 ? preset.price : 0) + ordersTotal,
      };
    });

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
