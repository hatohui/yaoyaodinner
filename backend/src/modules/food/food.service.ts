import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateFoodDto } from "./dto/create-food.dto";
import { UpdateFoodDto } from "./dto/update-food.dto";
import { AddFoodVariantDto } from "./dto/add-food-variant.dto";
import { UpdateFoodVariantDto } from "./dto/update-food-variant.dto";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheService } from "@libs/redis";
import { CacheSettings } from "@common/cache/constants";
import { AiService } from "@libs/gemini";
import { ImagesService } from "@modules/images/images.service";

const FOOD_CACHE_PREFIX = "foods:";

@Injectable()
export class FoodService {
  constructor(private images: ImagesService) {}

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

  async getPopularFoodIds(limit = 8): Promise<string[]> {
    const perFood = await this.getPopularityMap();
    return [...perFood.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([foodId]) => foodId);
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
  ) {
    const offset = (page - 1) * count;

    const cacheKey = CacheSettings.food.all.key(
      lang,
      page,
      count,
      categoryId,
      sortBy,
      sortOrder,
      popularOnly ? "1" : "0",
      recommendedOnly ? "1" : "0",
    );

    const cachedFoods = await CacheService.get(cacheKey);
    if (cachedFoods) return cachedFoods;

    const popularityMap = await this.getPopularityMap();

    const where = {
      isAvailable: true,
      ...(categoryId !== "all" && categoryId !== "" ? { categoryId } : {}),
      ...(popularOnly ? { id: { in: [...popularityMap.keys()] } } : {}),
      ...(recommendedOnly ? { isRecommended: true } : {}),
    };

    const rawFoods = await prisma.food.findMany({
      where,
      include: {
        translations: { where: { language: lang } },
        variants: { where: { isAvailable: true }, orderBy: { price: "asc" } },
      },
    });

    const allFoods = rawFoods.map((f) => {
      const t = f.translations[0];
      const defaultVariant = f.variants[0] ?? null;
      return {
        id: f.id,
        name: t?.name ?? "",
        description: t?.description ?? null,
        imageUrl: f.imageUrl,
        categoryId: f.categoryId,
        isAvailable: f.isAvailable,
        isPopular: popularityMap.has(f.id),
        isRecommended: f.isRecommended,
        defaultVariantId: defaultVariant?.id ?? null,
        price: defaultVariant?.price ? Number(defaultVariant.price) : null,
        currency: defaultVariant?.currency ?? null,
        shouldCalculate: f.shouldCalculate,
      };
    });

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
    translations: { name: string; description: string | null }[];
    variants: {
      id: string;
      price: unknown;
      currency: string;
      isSeasonal: boolean;
      isAvailable: boolean;
      translations: { label: string }[];
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
      price: variant.price ? Number(variant.price) : null,
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
    const popularityMap = await this.getPopularityMap();
    return this.toDetailDto(food, popularityMap.has(food.id));
  }

  async findAllForAdmin(
    lang = "en",
    page = 1,
    count = 20,
    categoryId = "all",
    search?: string,
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

    const [rawFoods, total, popularityMap] = await Promise.all([
      prisma.food.findMany({
        where,
        skip: offset,
        take: count,
        orderBy: { id: "asc" },
        include: this.foodDetailInclude(lang),
      }),
      prisma.food.count({ where }),
      this.getPopularityMap(),
    ]);

    return {
      foods: rawFoods.map((f) => this.toDetailDto(f, popularityMap.has(f.id))),
      page,
      count: rawFoods.length,
      total,
    };
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
              price: v.price,
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

    const vLabels = (dto.variants ?? [])
      .map((v, idx) => ({ id: food.variants[idx]?.id, label: v.label }))
      .filter((v) => v.id && v.label) as { id: string; label: string }[];

    const translated = await AiService.translateFood(
      foodId,
      lang,
      dto.name,
      dto.description ?? null,
      vLabels,
    );

    return { ...this.toDetailDto(food), aiTranslationFailed: !translated };
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
                },
              },
            }
            : undefined,
      },
      include: this.foodDetailInclude(lang),
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);

    if (dto.imageUrl !== undefined && existing.imageUrl && dto.imageUrl !== existing.imageUrl) {
      await this.images.deleteKey(existing.imageUrl);
    }

    const popularityMap = await this.getPopularityMap();
    return this.toDetailDto(food, popularityMap.has(food.id));
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

    await prisma.food.deleteMany({ where: { id: { in: deletableIds } } });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);
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
        price: dto.price,
        currency: dto.currency ?? "RM",
        isSeasonal: dto.isSeasonal ?? false,
        isAvailable: true,
        translations: { create: [{ language: lang, label: dto.label }] },
      },
      include: { translations: { where: { language: lang } } },
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);

    const translated = await AiService.translateFoodVariant(
      variant.id,
      lang,
      dto.label,
    );

    return { ...this.toVariantDto(variant), aiTranslationFailed: !translated };
  }

  async updateVariant(variantId: string, dto: UpdateFoodVariantDto) {
    const existing = await prisma.foodVariant.findUnique({ where: { id: variantId } });
    if (!existing) throw new NotFoundException("Food variant not found");

    const lang = dto.lang ?? "en";
    const variant = await prisma.foodVariant.update({
      where: { id: variantId },
      data: {
        price: dto.price,
        currency: dto.currency,
        isSeasonal: dto.isSeasonal,
        isAvailable: dto.isAvailable,
        translations:
          dto.label !== undefined
            ? {
              upsert: {
                where: { variantId_language: { variantId, language: lang } },
                create: { language: lang, label: dto.label },
                update: { label: dto.label },
              },
            }
            : undefined,
      },
      include: { translations: { where: { language: lang } } },
    });
    await CacheService.deleteByPrefix(FOOD_CACHE_PREFIX);

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
