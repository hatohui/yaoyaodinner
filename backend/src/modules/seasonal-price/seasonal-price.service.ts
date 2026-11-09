import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../libs/prisma';

@Injectable()
export class SeasonalPriceService {
  async findAll(eventId: string, lang = 'en') {
    const variants = await prisma.foodVariant.findMany({
      where: { isSeasonal: true },
      include: {
        food: { include: { translations: { where: { language: lang } } } },
        translations: { where: { language: lang } },
        eventPrices: { where: { eventId } },
      },
    });
    const ordered = await prisma.order.groupBy({
      by: ['variantId'],
      where: { eventId, variantId: { in: variants.map((v) => v.id) } },
      _sum: { quantity: true },
    });
    const counts = new Map(ordered.map((o) => [o.variantId, o._sum.quantity ?? 0]));
    return variants
      .map((v) => ({
        variantId: v.id,
        foodId: v.foodId,
        foodName: v.food.translations[0]?.name ?? '',
        imageUrl: v.food.imageUrl,
        variantLabel: v.translations[0]?.label ?? '',
        currency: v.currency,
        orderedCount: counts.get(v.id) ?? 0,
        price: v.eventPrices[0] ? Number(v.eventPrices[0].price) : null,
      }))
      .sort((a, b) => a.foodName.localeCompare(b.foodName));
  }

  /** Orders nobody repriced by hand follow the event's seasonal price. */
  async set(eventId: string, variantId: string, price: number | null) {
    const variant = await prisma.foodVariant.findFirst({
      where: { id: variantId, isSeasonal: true },
    });
    if (!variant) throw new NotFoundException('Seasonal dish not found');

    const key = { eventId_variantId: { eventId, variantId } };
    await prisma.$transaction([
      price === null
        ? prisma.eventSeasonalPrice.deleteMany({ where: { eventId, variantId } })
        : prisma.eventSeasonalPrice.upsert({
            where: key,
            create: { eventId, variantId, price },
            update: { price },
          }),
      prisma.order.updateMany({
        where: { eventId, variantId, priceEdited: false },
        data: { price: price ?? 0 },
      }),
    ]);
    return { variantId, price };
  }
}
