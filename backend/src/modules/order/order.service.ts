import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { OrderRound, Prisma } from "@prisma/client";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheService } from "@libs/redis";
import { CacheSettings } from "@common/cache/constants";
import { CreateOrderDto } from "./dto/create-order.dto";
import { BatchCreateOrderDto } from "./dto/batch-create-order.dto";
import { ApplyOrderChangesDto } from "./dto/apply-order-changes.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

const orderIncludeWithLang = (lang: string) => ({
  variant: {
    include: {
      food: { include: { translations: { where: { language: lang } } } },
      translations: { where: { language: lang } },
    },
  },
  splits: true,
});

type OrderWithLangInclude = Awaited<
  ReturnType<
    typeof prisma.order.findMany<{
      include: ReturnType<typeof orderIncludeWithLang>;
    }>
  >
>[number];

@Injectable()
export class OrderService {
  private bustPopular() {
    return CacheService.delete(CacheSettings.food.popular.key);
  }

  private toResponseDto(order: OrderWithLangInclude) {
    return {
      id: order.id,
      tableId: order.tableId,
      variantId: order.variantId,
      foodId: order.variant.food.id,
      eventId: order.eventId,
      quantity: order.quantity,
      price: Number(order.price),
      currency: order.variant.currency,
      splitAll: order.splitAll,
      foodName: order.variant.food.translations[0]?.name ?? "",
      foodImageUrl: order.variant.food.imageUrl,
      variantLabel: order.variant.translations[0]?.label ?? "",
      shouldCalculate: order.variant.food.shouldCalculate,
      isSeasonal: order.variant.isSeasonal,
      splits: order.splits.map((s) => ({ personId: s.personId })),
      round: order.round,
      priceEdited: order.priceEdited,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async findByTable(tableId: string, lang = "en") {
    const orders = await prisma.order.findMany({
      where: { tableId },
      include: orderIncludeWithLang(lang),
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.toResponseDto(o));
  }

  async findAll(lang = "en") {
    const orders = await prisma.order.findMany({
      include: orderIncludeWithLang(lang),
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => this.toResponseDto(o));
  }

  /** Seasonal dishes take the event's price, or 0 until the admin sets one. */
  private async resolvePrice(
    variantId: string,
    eventId: string | null,
  ): Promise<number> {
    const variant = await prisma.foodVariant.findUnique({
      where: { id: variantId },
      select: {
        price: true,
        isSeasonal: true,
        eventPrices: eventId ? { where: { eventId } } : false,
      },
    });
    if (!variant) throw new NotFoundException("Food variant not found");
    if (variant.isSeasonal) {
      const eventPrice = variant.eventPrices?.[0]?.price;
      return eventPrice ? Number(eventPrice) : 0;
    }
    return variant.price ? Number(variant.price) : 0;
  }

  /**
   * An order always belongs to whoever is sitting there, so ordering onto an
   * empty table is rejected — seat someone first.
   */
  private async orderableTableEventId(tableId: string): Promise<string | null> {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { eventId: true, _count: { select: { people: true } } },
    });
    if (!table) throw new NotFoundException("Table not found");
    if (table._count.people === 0) {
      throw new BadRequestException(
        "Add someone to this table before ordering",
      );
    }
    return table.eventId;
  }

  private splitData(splitAll: boolean, personIds?: string[]) {
    if (splitAll) return undefined;
    if (!personIds || personIds.length === 0) {
      throw new BadRequestException(
        "You must select at least one person to split with",
      );
    }
    return { create: personIds.map((personId) => ({ personId })) };
  }

  /**
   * Ordering the same thing again (same variant, price, split and round) bumps
   * the existing line's quantity instead of adding a duplicate row.
   */
  private async placeOrMerge(
    tx: Pick<typeof prisma, 'order'>,
    line: {
      tableId: string;
      variantId: string;
      eventId: string | null;
      quantity: number;
      price: number;
      splitAll: boolean;
      round: OrderRound;
      personIds?: string[];
    },
    lang: string,
  ) {
    const splits = this.splitData(line.splitAll, line.personIds);
    const wanted = [...new Set(line.personIds ?? [])].sort().join(",");
    const candidates = await tx.order.findMany({
      where: {
        tableId: line.tableId,
        variantId: line.variantId,
        splitAll: line.splitAll,
        round: line.round,
        priceEdited: false,
      },
      include: { splits: { select: { personId: true } } },
    });
    const match = candidates.find(
      (o) =>
        Number(o.price) === line.price &&
        (line.splitAll ||
          o.splits
            .map((s) => s.personId)
            .sort()
            .join(",") === wanted),
    );

    if (match) {
      return tx.order.update({
        where: { id: match.id },
        data: { quantity: { increment: line.quantity } },
        include: orderIncludeWithLang(lang),
      });
    }
    return tx.order.create({
      data: {
        id: uuidv4(),
        tableId: line.tableId,
        variantId: line.variantId,
        eventId: line.eventId,
        quantity: line.quantity,
        price: line.price,
        splitAll: line.splitAll,
        round: line.round,
        splits,
      },
      include: orderIncludeWithLang(lang),
    });
  }

  async create(dto: CreateOrderDto, round: OrderRound, lang = "en") {
    const eventId = await this.orderableTableEventId(dto.tableId);
    const price = await this.resolvePrice(dto.variantId, eventId);
    const order = await prisma.$transaction((tx) =>
      this.placeOrMerge(
        tx,
        {
          tableId: dto.tableId,
          variantId: dto.variantId,
          eventId,
          quantity: dto.quantity ?? 1,
          price,
          splitAll: dto.splitAll ?? true,
          round,
          personIds: dto.personIds,
        },
        lang,
      ),
    );
    await this.bustPopular();
    return this.toResponseDto(order);
  }

  /**
   * Adds many dishes at once: one lookup for lines to merge into, one insert for the
   * new shared lines, and no per-row reads, so a whole plan lands in a few round trips.
   */
  private async addLines(
    tx: Pick<typeof prisma, 'order' | 'orderSplit'>,
    batch: {
      tableId: string;
      eventId: string | null;
      round: OrderRound;
      splitAll: boolean;
      personIds?: string[];
      items: { variantId: string; quantity: number; price: number }[];
    },
  ) {
    // repeats of one dish at one price merge, as they would one by one
    const merged = new Map<string, { variantId: string; quantity: number; price: number }>();
    for (const item of batch.items) {
      const key = `${item.variantId}|${item.price}`;
      const existing = merged.get(key);
      if (existing) existing.quantity += item.quantity;
      else merged.set(key, { ...item });
    }
    const wanted = [...new Set(batch.personIds ?? [])].sort().join(",");
    const candidates = await tx.order.findMany({
      where: {
        tableId: batch.tableId,
        variantId: { in: [...new Set(batch.items.map((i) => i.variantId))] },
        splitAll: batch.splitAll,
        round: batch.round,
        priceEdited: false,
      },
      include: { splits: { select: { personId: true } } },
    });

    const ids: string[] = [];
    const fresh: Prisma.OrderCreateManyInput[] = [];
    for (const item of merged.values()) {
      const match = candidates.find(
        (o) =>
          o.variantId === item.variantId &&
          Number(o.price) === item.price &&
          (batch.splitAll ||
            o.splits
              .map((s) => s.personId)
              .sort()
              .join(",") === wanted),
      );
      if (match) {
        await tx.order.update({
          where: { id: match.id },
          data: { quantity: { increment: item.quantity } },
          select: { id: true },
        });
        ids.push(match.id);
        continue;
      }
      const id = uuidv4();
      ids.push(id);
      fresh.push({
        id,
        tableId: batch.tableId,
        variantId: item.variantId,
        eventId: batch.eventId,
        quantity: item.quantity,
        price: item.price,
        splitAll: batch.splitAll,
        round: batch.round,
      });
    }
    if (fresh.length > 0) {
      await tx.order.createMany({ data: fresh });
      const splits = this.splitData(batch.splitAll, batch.personIds);
      if (splits)
        await tx.orderSplit.createMany({
          data: fresh.flatMap((o) =>
            splits.create.map(({ personId }) => ({ orderId: o.id!, personId })),
          ),
        });
    }
    return ids;
  }

  private async priced(items: { variantId: string; quantity?: number }[], eventId: string | null) {
    return Promise.all(
      items.map(async (item) => ({
        variantId: item.variantId,
        quantity: item.quantity ?? 1,
        price: await this.resolvePrice(item.variantId, eventId),
      })),
    );
  }

  private async responsesFor(ids: string[], lang: string) {
    const rows = await prisma.order.findMany({
      where: { id: { in: ids } },
      include: orderIncludeWithLang(lang),
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return [...new Set(ids)].flatMap((id) => {
      const row = byId.get(id);
      return row ? [this.toResponseDto(row)] : [];
    });
  }

  async createBatch(dto: BatchCreateOrderDto, round: OrderRound, lang = "en") {
    const eventId = await this.orderableTableEventId(dto.tableId);
    const items = await this.priced(dto.items, eventId);
    const ids = await prisma.$transaction((tx) =>
      this.addLines(tx, {
        tableId: dto.tableId,
        eventId,
        round,
        splitAll: dto.splitAll ?? true,
        personIds: dto.personIds,
        items,
      }),
    );
    await this.bustPopular();
    return this.responsesFor(ids, lang);
  }

  /**
   * Applies an AI suggestion in one transaction: new shared dishes are added and
   * the trimmed orders shrink or go, so the table never sees half of it.
   */
  async applyChanges(dto: ApplyOrderChangesDto, round: OrderRound | null) {
    const eventId = await this.orderableTableEventId(dto.tableId);
    const items = await this.priced(dto.adds, eventId);
    await prisma.$transaction(async (tx) => {
      if (items.length > 0 && round)
        await this.addLines(tx, {
          tableId: dto.tableId,
          eventId,
          round,
          splitAll: true,
          items,
        });
      const deleting = dto.cuts.filter((c) => c.quantity === 0).map((c) => c.orderId);
      if (deleting.length > 0)
        await tx.order.deleteMany({ where: { id: { in: deleting }, tableId: dto.tableId } });
      for (const cut of dto.cuts.filter((c) => c.quantity > 0))
        await tx.order.updateMany({
          where: { id: cut.orderId, tableId: dto.tableId },
          data: { quantity: cut.quantity },
        });
    });
    await this.bustPopular();
  }

  async update(id: string, dto: UpdateOrderDto, lang = "en") {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");

    const splitAll = dto.splitAll ?? order.splitAll;
    const resetSplits =
      dto.splitAll !== undefined || dto.personIds !== undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (resetSplits) {
        await tx.orderSplit.deleteMany({ where: { orderId: id } });
        if (!splitAll) {
          if (!dto.personIds || dto.personIds.length === 0) {
            throw new BadRequestException(
              "You must select at least one person to split with",
            );
          }
          await tx.orderSplit.createMany({
            data: dto.personIds.map((personId) => ({ orderId: id, personId })),
          });
        }
      }
      return tx.order.update({
        where: { id },
        data: {
          quantity: dto.quantity ?? order.quantity,
          splitAll,
          ...(dto.price !== undefined && {
            price: dto.price,
            priceEdited: true,
          }),
        },
        include: orderIncludeWithLang(lang),
      });
    });
    if (dto.quantity !== undefined) await this.bustPopular();
    return this.toResponseDto(updated);
  }

  async remove(id: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    await prisma.order.delete({ where: { id } });
    await this.bustPopular();
    return { id };
  }
}
