import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../libs/prisma';
import {
  CreateTableWishDto,
  TableWishDto,
  UpdateTableWishDto,
} from './dto/table-wish.dto';

const MAX_WISHES = 40;

const includeWithLang = (lang: string) => ({
  variant: {
    include: {
      food: { include: { translations: { where: { language: lang } } } },
      translations: { where: { language: lang } },
    },
  },
  people: { select: { personId: true } },
});

const findWishes = (tableId: string, lang: string) =>
  prisma.tableWish.findMany({
    where: { tableId },
    include: includeWithLang(lang),
    orderBy: { createdAt: 'asc' },
  });

type WishRow = Awaited<ReturnType<typeof findWishes>>[number];

const toDto = (w: WishRow): TableWishDto => ({
  id: w.id,
  tableId: w.tableId,
  kind: w.kind,
  variantId: w.variantId,
  foodId: w.variant?.foodId ?? null,
  name: w.variant?.food.translations[0]?.name ?? w.label ?? '',
  variantLabel: w.variant?.translations[0]?.label || null,
  foodImageUrl: w.variant?.food.imageUrl ?? null,
  price: w.variant?.price != null ? Number(w.variant.price) : null,
  currency: w.variant?.currency ?? '',
  shouldCalculate: w.variant?.food.shouldCalculate ?? true,
  personIds: w.people.map((p) => p.personId),
  createdAt: w.createdAt,
});

@Injectable()
export class TableWishService {
  async findByTable(tableId: string, lang: string) {
    return (await findWishes(tableId, lang)).map(toDto);
  }

  async create(dto: CreateTableWishDto, lang: string) {
    const label = dto.label?.trim() || null;
    if (Boolean(dto.variantId) === Boolean(label)) {
      throw new BadRequestException('Pick a dish or type one, not both');
    }

    const existing = await prisma.tableWish.findMany({
      where: { tableId: dto.tableId },
      select: { variantId: true, label: true },
    });
    if (existing.length >= MAX_WISHES) {
      throw new BadRequestException('This list is full');
    }
    const duplicate = existing.some((w) =>
      dto.variantId
        ? w.variantId === dto.variantId
        : w.label?.toLowerCase() === label?.toLowerCase(),
    );
    if (duplicate) throw new ConflictException('Already on the list');

    if (dto.variantId) {
      const variant = await prisma.foodVariant.findUnique({
        where: { id: dto.variantId },
        select: { id: true },
      });
      if (!variant) throw new NotFoundException('Dish not found');
    }

    const wish = await prisma.tableWish.create({
      data: {
        id: uuidv4(),
        tableId: dto.tableId,
        kind: dto.kind,
        variantId: dto.variantId ?? null,
        label: dto.variantId ? null : label,
      },
      include: includeWithLang(lang),
    });
    return toDto(wish);
  }

  async update(id: string, dto: UpdateTableWishDto, lang: string) {
    if (dto.variantId) await this.assertSwappable(id, dto.variantId);
    const personIds = dto.personIds && [...new Set(dto.personIds)];
    if (personIds?.length) await this.assertSeated(id, personIds);
    const wish = await prisma.tableWish.update({
      where: { id },
      data: {
        kind: dto.kind,
        variantId: dto.variantId,
        people: personIds && {
          deleteMany: {},
          create: personIds.map((personId) => ({ personId })),
        },
      },
      include: includeWithLang(lang),
    });
    return toDto(wish);
  }

  private async assertSeated(id: string, personIds: string[]) {
    const wish = await prisma.tableWish.findUnique({
      where: { id },
      select: { tableId: true },
    });
    if (!wish) throw new NotFoundException('Wish not found');
    const seated = await prisma.people.count({
      where: { id: { in: personIds }, tableId: wish.tableId },
    });
    if (seated !== personIds.length) {
      throw new BadRequestException('Pick people sitting at this table');
    }
  }

  /** A wish can only switch to another option of its own dish. */
  private async assertSwappable(id: string, variantId: string) {
    const [wish, variant] = await Promise.all([
      prisma.tableWish.findUnique({
        where: { id },
        select: { tableId: true, variant: { select: { foodId: true } } },
      }),
      prisma.foodVariant.findUnique({
        where: { id: variantId },
        select: { foodId: true },
      }),
    ]);
    if (!wish || !variant) throw new NotFoundException('Dish not found');
    if (wish.variant?.foodId !== variant.foodId) {
      throw new BadRequestException('Pick an option of the same dish');
    }
    const taken = await prisma.tableWish.findFirst({
      where: { tableId: wish.tableId, variantId, id: { not: id } },
      select: { id: true },
    });
    if (taken) throw new ConflictException('Already on the list');
  }

  async remove(id: string) {
    await prisma.tableWish.delete({ where: { id } });
  }

  async tableOf(id: string) {
    const wish = await prisma.tableWish.findUnique({
      where: { id },
      select: { tableId: true },
    });
    if (!wish) throw new NotFoundException('Wish not found');
    return wish.tableId;
  }
}
