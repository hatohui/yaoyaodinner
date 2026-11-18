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
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
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
  addedById: w.addedById ?? null,
  addedByName: w.addedByName ?? null,
  position: w.position,
  quantity: w.quantity,
  createdAt: w.createdAt,
});

@Injectable()
export class TableWishService {
  async findByTable(tableId: string, lang: string) {
    return (await findWishes(tableId, lang)).map(toDto);
  }

  async create(
    dto: CreateTableWishDto,
    lang: string,
    addedBy?: { id: string; name: string } | null,
  ) {
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

    const personIds = dto.personIds && [...new Set(dto.personIds)];
    if (personIds?.length) await this.assertPeopleAtTable(dto.tableId, personIds);

    const last = await prisma.tableWish.aggregate({
      where: { tableId: dto.tableId, kind: dto.kind },
      _max: { position: true },
    });
    const wish = await prisma.tableWish.create({
      data: {
        id: uuidv4(),
        tableId: dto.tableId,
        kind: dto.kind,
        position: (last._max.position ?? -1) + 1,
        quantity: dto.quantity ?? 1,
        variantId: dto.variantId ?? null,
        label: dto.variantId ? null : label,
        addedById: addedBy?.id ?? null,
        addedByName: addedBy?.name ?? null,
        people: personIds?.length
          ? { create: personIds.map((personId) => ({ personId })) }
          : undefined,
      },
      include: includeWithLang(lang),
    });
    return toDto(wish);
  }

  async update(id: string, dto: UpdateTableWishDto, lang: string) {
    if (dto.variantId) await this.assertSwappable(id, dto.variantId);
    const personIds = dto.personIds && [...new Set(dto.personIds)];
    if (personIds?.length) await this.assertSeated(id, personIds);

    const existing = await prisma.tableWish.findUnique({
      where: { id },
      select: { tableId: true, kind: true },
    });
    if (!existing) throw new NotFoundException('Wish not found');

    const targetKind = dto.kind ?? existing.kind;
    const repositioning = dto.position !== undefined || targetKind !== existing.kind;

    if (!repositioning) {
      const wish = await prisma.tableWish.update({
        where: { id },
        data: {
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

    const siblings = await prisma.tableWish.findMany({
      where: { tableId: existing.tableId, kind: targetKind, id: { not: id } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    const targetIndex =
      dto.position !== undefined
        ? Math.max(0, Math.min(dto.position, siblings.length))
        : siblings.length;
    const orderedIds = siblings.map((s) => s.id);
    orderedIds.splice(targetIndex, 0, id);

    const wish = await prisma.$transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((wishId, position) =>
          wishId === id
            ? null
            : tx.tableWish.update({ where: { id: wishId }, data: { position } }),
        ),
      );
      return tx.tableWish.update({
        where: { id },
        data: {
          kind: targetKind,
          position: targetIndex,
          variantId: dto.variantId,
          people: personIds && {
            deleteMany: {},
            create: personIds.map((personId) => ({ personId })),
          },
        },
        include: includeWithLang(lang),
      });
    });
    return toDto(wish);
  }

  private async assertPeopleAtTable(tableId: string, personIds: string[]) {
    const seated = await prisma.people.count({
      where: { id: { in: personIds }, tableId },
    });
    if (seated !== personIds.length) {
      throw new BadRequestException('Pick people sitting at this table');
    }
  }

  private async assertSeated(id: string, personIds: string[]) {
    const wish = await prisma.tableWish.findUnique({
      where: { id },
      select: { tableId: true },
    });
    if (!wish) throw new NotFoundException('Wish not found');
    await this.assertPeopleAtTable(wish.tableId, personIds);
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
    const wish = await prisma.tableWish.findUnique({
      where: { id },
      include: includeWithLang('en'),
    });
    if (!wish) throw new NotFoundException('Wish not found');
    await prisma.tableWish.delete({ where: { id } });
    return {
      name: wish.variant?.food.translations[0]?.name ?? wish.label ?? '',
      kind: wish.kind,
    };
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
