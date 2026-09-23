import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheService } from "@libs/redis";
import { CacheSettings } from "@common/cache/constants";
import { CreateOrderDto } from "./dto/create-order.dto";
import { BatchCreateOrderDto } from "./dto/batch-create-order.dto";
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
      splits: order.splits.map((s) => ({ personId: s.personId })),
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

  private async resolvePrice(variantId: string): Promise<number> {
    const variant = await prisma.foodVariant.findUnique({
      where: { id: variantId },
      select: { price: true },
    });
    if (!variant) throw new NotFoundException("Food variant not found");
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
   * Ordering the same thing again (same variant, price and split) bumps the
   * existing line's quantity instead of adding a duplicate row.
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
        splits,
      },
      include: orderIncludeWithLang(lang),
    });
  }

  async create(dto: CreateOrderDto, lang = "en") {
    const [price, eventId] = await Promise.all([
      this.resolvePrice(dto.variantId),
      this.orderableTableEventId(dto.tableId),
    ]);
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
          personIds: dto.personIds,
        },
        lang,
      ),
    );
    await this.bustPopular();
    return this.toResponseDto(order);
  }

  async createBatch(dto: BatchCreateOrderDto, lang = "en") {
    const eventId = await this.orderableTableEventId(dto.tableId);
    const splitAll = dto.splitAll ?? true;
    const priced = await Promise.all(
      dto.items.map(async (item) => ({
        item,
        price: await this.resolvePrice(item.variantId),
      })),
    );

    // sequential so repeats within one batch merge into the same line
    const orders = await prisma.$transaction(async (tx) => {
      const placed: Awaited<ReturnType<typeof this.placeOrMerge>>[] = [];
      for (const { item, price } of priced) {
        placed.push(
          await this.placeOrMerge(
            tx,
            {
              tableId: dto.tableId,
              variantId: item.variantId,
              eventId,
              quantity: item.quantity ?? 1,
              price,
              splitAll,
              personIds: dto.personIds,
            },
            lang,
          ),
        );
      }
      return placed;
    });
    await this.bustPopular();
    return orders.map((o) => this.toResponseDto(o));
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
