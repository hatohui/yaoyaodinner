import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { CreateFoodDto } from "./dto/create-food.dto";
import { UpdateFoodDto } from "./dto/update-food.dto";
import { AddFoodVariantDto } from "./dto/add-food-variant.dto";
import { UpdateFoodVariantDto } from "./dto/update-food-variant.dto";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheService } from "@libs/redis";
import { CacheSettings } from "@common/cache/constants";
import { AiService } from "@libs/ai";
import { AiJobsService } from "@modules/ai-jobs/ai-jobs.service";
import { ImagesService } from "@modules/images/images.service";
import { EventService } from "@modules/event/event.service";

const FOOD_CACHE_PREFIX = "foods:";

@Injectable()
export class FoodService {
  constructor(
    private images: ImagesService,
    private events: EventService,
    private aiJobs: AiJobsService,
  ) {}

  private async getPopularityMap(): Promise<Map<string, number>> {
    const cacheKey = CacheSettings.food.popular.key;
    const cached = await CacheService.get<[string, number][]>(cacheKey);
    if (cached) return new Map(cached);

    const grouped = await prisma.order.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
    });

    const perFood = new Map<string, number>();
    if (grouped.length > 0) {
      const variants = await prisma.foodVariant.findMany({
        where: { id: { in: grouped.map((g) => g.variantId) } },
        select: { id: true, foodId: true },
      });
      const variantToFood = new Map(variants.map((v) => [v.id, v.foodId]));
      for (const g of grouped) {
        const foodId = variantToFood.get(g.variantId);
        if (!foodId) continue;
        perFood.set(foodId, (perFood.get(foodId) ?? 0) + (g._sum.quantity ?? 0));
      }
    }

    await CacheService.set(
      cacheKey,
      [...perFood.entries()],
      CacheSettings.food.popular.ttl,
    );
    return perFood;
  }

  /** Only the most-ordered foods are popular, not everything ever ordered. */
  private async getPopularFoodIds(limit = 8): Promise<Set<string>> {
    const perFood = await this.getPopularityMap();
    const available = await prisma.food.findMany({
      where: { id: { in: [...perFood.keys()] }, isAvailable: true },
      select: { id: true },
    });
    const availableIds = new Set(available.map((f) => f.id));
    return new Set(
      [...perFood.entries()]
        .filter(([foodId]) => availableIds.has(foodId))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([foodId]) => foodId),
    );
  }

  async findAll(
    lang = "en",
    page = 1,
    count = 20,
    categoryId = "all",
    sortBy: "name" | "price" | "popular" = "name",
    sortOrder: "asc" | "desc" = "asc",
    popularOnly = false,
    recommendedOnly = false,
    search = "",
  ) {
    const offset = (page - 1) * count;
    const query = search.trim().toLowerCase();

    const cacheKey = CacheSettings.food.all.key(
      lang,
      page,
      count,
      categoryId,
      sortBy,
      sortOrder,
      popularOnly ? "1" : "0",
      recommendedOnly ? "1" : "0",
      query,
    );

    const cachedFoods = await CacheService.get(cacheKey);
    if (cachedFoods) return cachedFoods;

    const popularityMap = await this.getPopularityMap();
    const popularIds = await this.getPopularFoodIds();

    const where = {
      isAvailable: true,
      ...(categoryId !== "all" && categoryId !== "" ? { categoryId } : {}),
      ...(popularOnly ? { id: { in: [...popularIds] } } : {}),
      ...(recommendedOnly ? { isRecommended: true } : {}),
    };

    const rawFoods = await prisma.food.findMany({
      where,
      include: {
        translations: { where: { language: lang } },
        variants: { where: { isAvailable: true }, orderBy: { price: "asc" } },
      },
    });

    const mapped = rawFoods.map((f) => {
      const t = f.translations[0];
      const defaultVariant = f.variants[0] ?? null;
      return {
        id: f.id,
        name: t?.name ?? "",
        description: t?.description ?? null,
        imageUrl: f.imageUrl,
        categoryId: f.categoryId,
        isAvailable: f.isAvailable,
        isPopular: popularIds.has(f.id),
        isRecommended: f.isRecommended,
        defaultVariantId: defaultVariant?.id ?? null,
        price:
          defaultVariant && !defaultVariant.isSeasonal && defaultVariant.price !== null
            ? Number(defaultVariant.price)
            : null,
        currency: defaultVariant?.currency ?? null,
        variantCount: f.variants.length,
        shouldCalculate: f.shouldCalculate,
        isAiTranslated: Boolean(t?.isNameAiGenerated || t?.isDescriptionAiGenerated),
      };
    });

    // matched on the translated text, so a search finds dishes on every page
    const allFoods = query
      ? mapped.filter(
          (f) =>
            f.name.toLowerCase().includes(query) ||
            f.description?.toLowerCase().includes(query),
        )
      : mapped;

    const dir = sortOrder === "desc" ? -1 : 1;
    allFoods.sort((a, b) => {
      if (sortBy === "price") {
        const av = a.price ?? Number.POSITIVE_INFINITY;
        const bv = b.price ?? Number.POSITIVE_INFINITY;
        return (av - bv) * dir;
      }
      if (sortBy === "popular") {
        const av = popularityMap.get(a.id) ?? 0;
        const bv = popularityMap.get(b.id) ?? 0;
        return (bv - av) * dir;
      }
      return a.name.localeCompare(b.name) * dir;
    });

    const total = allFoods.length;
    const foods = allFoods.slice(offset, offset + count);

    const result = { foods, page, count: foods.length, total };

    await CacheService.set(cacheKey, result, CacheSettings.food.all.ttl);

    return result;
  }

  /** Name matches for search-as-you-type; prefix matches rank first. */
  async suggest(query: string, lang = "en", limit = 8) {
    const q = query.trim();
    if (!q) return [];

    const rows = await prisma.foodTranslation.findMany({
      where: {
        language: lang,
        name: { contains: q, mode: "insensitive" },
        food: { isAvailable: true },
      },
      select: { foodId: true, name: true, food: { select: { imageUrl: true } } },
      orderBy: { name: "asc" },
      take: limit * 3,
    });

    const lower = q.toLowerCase();
    const rank = (name: string) => (name.toLowerCase().startsWith(lower) ? 0 : 1);
    return rows
      .sort((a, b) => rank(a.name) - rank(b.name))
      .slice(0, limit)
      .map((r) => ({ id: r.foodId, name: r.name, imageUrl: r.food.imageUrl }));
  }

  private foodDetailInclude(lang: string) {
    return {
      translations: { where: { language: lang } },
      variants: {
        include: { translations: { where: { language: lang } } },
      },
    };
  }

  private toDetailDto(food: {
    id: string;
    imageUrl: string | null;
    categoryId: string;
    isAvailable: boolean;
    shouldCalculate: boolean;
    isRecommended: boolean;
    translations: {
      name: string;
      description: string | null;
      isNameAiGenerated: boolean;
      isDescriptionAiGenerated: boolean;
    }[];
    variants: {
      id: string;
      price: unknown;
      currency: string;
      isSeasonal: boolean;
      isAvailable: boolean;
      translations: { label: string; isAiGenerated: boolean }[];
    }[];
  }, isPopular = false) {
    const t = food.translations[0];
    return {
      id: food.id,
      name: t?.name ?? "",
      description: t?.description ?? null,
      imageUrl: food.imageUrl,
      categoryId: food.categoryId,
      isAvailable: food.isAvailable,
      shouldCalculate: food.shouldCalculate,
      isPopular,
      isRecommended: food.isRecommended,
      isAiTranslated:
        Boolean(t?.isNameAiGenerated || t?.isDescriptionAiGenerated) ||
        food.variants.some((v) => v.translations[0]?.isAiGenerated),
      variants: food.variants.map((v) => this.toVariantDto(v)),
    };
  }

  private toVariantDto(variant: {
    id: string;
    price: unknown;
    currency: string;
    isSeasonal: boolean;
    isAvailable: boolean;
    translations: { label: string }[];
  }) {
    return {
      id: variant.id,
      label: variant.translations[0]?.label ?? "",
      price:
        !variant.isSeasonal && variant.price !== null && variant.price !== undefined
          ? Number(variant.price)
          : null,
      currency: variant.currency,
      isSeasonal: variant.isSeasonal,
      isAvailable: variant.isAvailable,
    };
  }

  async findOne(id: string, lang = "en") {
    const food = await prisma.food.findUnique({
      where: { id },
      include: this.foodDetailInclude(lang),
    });
    if (!food) throw new NotFoundException("Food not found");
    const [popularIds, orderedBy] = await Promise.all([
      this.getPopularFoodIds(),
      this.countPeopleOrdering(id),
    ]);
    return { ...this.toDetailDto(food, popularIds.has(food.id)), orderedBy };
  }

  private async countPeopleOrdering(foodId: string) {
    const eventId = await this.events.getActiveId();
    if (!eventId) return 0;
    const ofFood = { variant: { foodId } };
    return prisma.people.count({
      where: {
        eventId,
        OR: [
          { table: { orders: { some: { ...ofFood, splitAll: true } } } },
          { orderSplits: { some: { order: ofFood } } },
        ],
      },
    });
  }

  async findAllForAdmin(
    lang = "en",
    page = 1,
    count = 20,
    categoryId = "all",
    search?: string,
    sort = "name_asc",
  ) {
    const offset = (page - 1) * count;
    const where = {
      ...(categoryId !== "all" && categoryId !== "" ? { categoryId } : {}),
      ...(search
        ? {
          translations: {
            some: { name: { contains: search, mode: "insensitive" as const } },
          },
        }
        : {}),
    };

    const [rawFoods, popularIds, perFood] = await Promise.all([
      prisma.food.findMany({
        where,
        orderBy: { id: "asc" },
        include: this.foodDetailInclude(lang),
      }),
      this.getPopularFoodIds(),
      this.getPopularityMap(),
    ]);

    const allFoods = rawFoods.map((f) => ({
      ...this.toDetailDto(f, popularIds.has(f.id)),
      orderCount: perFood.get(f.id) ?? 0,
    }));

    allFoods.sort((a, b) => {
      if (sort === "most_ordered") {
        return b.orderCount - a.orderCount || a.name.localeCompare(b.name);
      }
      if (sort === "least_ordered") {
        return a.orderCount - b.orderCount || a.name.localeCompare(b.name);
      }
      if (sort === "price_asc") {
        const av = a.variants[0]?.price ?? Number.POSITIVE_INFINITY;
        const bv = b.variants[0]?.price ?? Number.POSITIVE_INFINITY;
        return av - bv || a.name.localeCompare(b.name);
      }
      if (sort === "price_desc") {
        const av = a.variants[0]?.price ?? Number.NEGATIVE_INFINITY;
        const bv = b.variants[0]?.price ?? Number.NEGATIVE_INFINITY;
        return bv - av || a.name.localeCompare(b.name);
      }
      if (sort === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      return a.name.localeCompare(b.name);
    });

    const total = allFoods.length;
    const foods = allFoods.slice(offset, offset + count);

    return {
      foods,
      page,
      count: foods.length,
      total,
    };
  }

  async createWeird(imageKey: string) {
    const image = await this.images.readImage(imageKey);
    if (!image) throw new BadRequestException("Couldn't read that photo");

    const categories = await prisma.category.findMany({
      where: { isAvailable: true },
      orderBy: { key: "asc" },
      select: {
        id: true,
        key: true,
        translations: { where: { language: "en" }, select: { name: true } },
      },
    });
    if (categories.length === 0) throw new BadRequestException("Add a category first");

    const dish = await AiService.inventDish(
      image,
      categories.map((c) => ({ id: c.id, name: c.translations[0]?.name ?? c.key })),
    );
    if (!dish) throw new ServiceUnavailableException("AI couldn't invent a dish");

    const foodId = uuidv4();
    const food = await prisma.food.create({
      data: {
        id: foodId,
        imageUrl: imageKey,
        categoryId: dish.categoryId ?? categories[0].id,
        shouldCalculate: false,
        translations: {
          create: Object.entries(dish.locales).map(([language, t]) => ({
            language,
            name: t.name,
            description: t.description,
            isNameAiGenerated: true,
            isDescriptionAiGenerated: true,
          })),
        },
        variants: {
          create: [
            {
              id: uuidv4(),
              price: dish.price,
              currency: "RM",
              isAvailable: true,
              translations: { create: [{ language: "en", label: "Regular" }] },
            },
          ],
        },
      },
      include: this.foodDetailInclude("en"),
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    await this.aiJobs.enqueue({ kind: "food", id: foodId });

    return this.toDetailDto(food);
  }

  async create(dto: CreateFoodDto) {
    const foodId = uuidv4();
    const lang = dto.lang ?? "en";
    const food = await prisma.food.create({
      data: {
        id: foodId,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        shouldCalculate: dto.shouldCalculate ?? true,
        isRecommended: dto.isRecommended ?? false,
        translations: {
          create: [
            {
              language: lang,
              name: dto.name,
              description: dto.description ?? null,
            },
          ],
        },
        variants: dto.variants
          ? {
            create: dto.variants.map((v) => ({
              id: uuidv4(),
              price: v.isSeasonal ? null : (v.price ?? null),
              currency: v.currency ?? "RM",
              isSeasonal: v.isSeasonal ?? false,
              isAvailable: true,
              translations: {
                create: [{ language: lang, label: v.label }],
              },
            })),
          }
          : undefined,
      },
      include: this.foodDetailInclude(lang),
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    await this.aiJobs.enqueue({ kind: "food", id: foodId });

    return this.toDetailDto(food);
  }

  async update(id: string, dto: UpdateFoodDto) {
    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Food not found");

    const lang = dto.lang ?? "en";
    const food = await prisma.food.update({
      where: { id },
      data: {
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable,
        shouldCalculate: dto.shouldCalculate,
        isRecommended: dto.isRecommended,
        translations:
          dto.name !== undefined || dto.description !== undefined
            ? {
              upsert: {
                where: { foodId_language: { foodId: id, language: lang } },
                create: {
                  language: lang,
                  name: dto.name ?? "",
                  description: dto.description ?? null,
                },
                update: {
                  name: dto.name,
                  description: dto.description,
                  ...(dto.name !== undefined ? { isNameAiGenerated: false } : {}),
                  ...(dto.description !== undefined
                    ? { isDescriptionAiGenerated: false }
                    : {}),
                },
              },
            }
            : undefined,
      },
      include: this.foodDetailInclude(lang),
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);

    if (dto.name?.trim() || dto.description?.trim()) {
      await this.aiJobs.enqueue({
        kind: "food",
        id,
        mode: "refresh",
        sourceLang: lang,
      });
    }

    if (dto.imageUrl !== undefined && existing.imageUrl && dto.imageUrl !== existing.imageUrl) {
      await this.images.deleteKey(existing.imageUrl);
    }

    const popularIds = await this.getPopularFoodIds();
    return this.toDetailDto(food, popularIds.has(food.id));
  }

  async remove(id: string) {
    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Food not found");

    const orderCount = await prisma.order.count({
      where: { variant: { foodId: id } },
    });
    if (orderCount > 0) {
      throw new ConflictException(
        "This food has order history and can't be deleted - toggle its availability instead",
      );
    }

    await prisma.food.delete({ where: { id } });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    if (existing.imageUrl) await this.images.deleteKey(existing.imageUrl);
    return { id };
  }

  async bulkToggle(ids: string[], isAvailable: boolean) {
    await prisma.food.updateMany({
      where: { id: { in: ids } },
      data: { isAvailable },
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    return { count: ids.length };
  }

  async bulkRemove(ids: string[]) {
    const withOrders = await prisma.order.findMany({
      where: { variant: { foodId: { in: ids } } },
      select: { variant: { select: { foodId: true } } },
      distinct: ["variantId"],
    });
    const blockedIds = new Set(withOrders.map((o) => o.variant.foodId));
    const deletableIds = ids.filter((id) => !blockedIds.has(id));

    const existing = await prisma.food.findMany({
      where: { id: { in: deletableIds } },
      select: { imageUrl: true },
    });
    await prisma.food.deleteMany({ where: { id: { in: deletableIds } } });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    await Promise.all(
      existing
        .map((f) => f.imageUrl)
        .filter((k): k is string => Boolean(k))
        .map((k) => this.images.deleteKey(k)),
    );
    return { deleted: deletableIds.length, skipped: [...blockedIds] };
  }

  async addVariant(foodId: string, dto: AddFoodVariantDto) {
    const food = await prisma.food.findUnique({ where: { id: foodId } });
    if (!food) throw new NotFoundException("Food not found");

    const lang = dto.lang ?? "en";
    const variant = await prisma.foodVariant.create({
      data: {
        id: uuidv4(),
        foodId,
        price: dto.isSeasonal ? null : (dto.price ?? null),
        currency: dto.currency ?? "RM",
        isSeasonal: dto.isSeasonal ?? false,
        isAvailable: true,
        translations: { create: [{ language: lang, label: dto.label }] },
      },
      include: { translations: { where: { language: lang } } },
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    await this.aiJobs.enqueue({ kind: "food", id: foodId });

    return this.toVariantDto(variant);
  }

  async updateVariant(variantId: string, dto: UpdateFoodVariantDto) {
    const existing = await prisma.foodVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException("Food variant not found");

    const lang = dto.lang ?? "en";
    const variant = await prisma.foodVariant.update({
      where: { id: variantId },
      data: {
        price:
          dto.isSeasonal === true
            ? null
            : dto.price !== undefined
              ? dto.price
              : undefined,
        currency: dto.currency,
        isSeasonal: dto.isSeasonal,
        isAvailable: dto.isAvailable,
        translations:
          dto.label !== undefined
            ? {
              upsert: {
                where: { variantId_language: { variantId, language: lang } },
                create: { language: lang, label: dto.label },
                update: { label: dto.label, isAiGenerated: false },
              },
            }
            : undefined,
      },
      include: { translations: { where: { language: lang } } },
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    if (dto.label?.trim()) {
      await this.aiJobs.enqueue({
        kind: "food",
        id: existing.foodId,
        mode: "refresh",
        sourceLang: lang,
      });
    }

    return this.toVariantDto(variant);
  }

  async removeVariant(variantId: string) {
    const existing = await prisma.foodVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException("Food variant not found");

    const orderCount = await prisma.order.count({ where: { variantId } });
    if (orderCount > 0) {
      throw new ConflictException(
        "This variant has order history and can't be deleted - toggle its availability instead",
      );
    }

    await prisma.foodVariant.delete({ where: { id: variantId } });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
    return { id: variantId };
  }
}
