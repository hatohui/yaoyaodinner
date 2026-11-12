import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@libs/prisma";
import { CacheSettings } from "@common/cache/constants";
import { CacheService } from "@libs/redis";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { AiJobsService } from "@modules/ai-jobs/ai-jobs.service";

const CATEGORY_CACHE_PREFIX = "categories:";

@Injectable()
export class CategoryService {
  constructor(private aiJobs: AiJobsService) {}

  async findAll(lang = "en") {
    const cacheKey = CacheSettings.categories.all.key(lang);
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const rows = await prisma.category.findMany({
      include: { translations: { where: { language: lang } } },
    });

    const categories = rows.map((c) => {
      const t = c.translations[0];
      return {
        id: c.id,
        key: c.key,
        name: t?.name ?? null,
        description: t?.description ?? null,
        isAvailable: c.isAvailable,
      };
    });

    await CacheService.set(cacheKey, categories, CacheSettings.categories.all.ttl);
    return categories;
  }

  async findOne(id: string, lang = "en") {
    const cacheKey = CacheSettings.categories.one.key(id, lang);
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const row = await prisma.category.findUnique({
      where: { id },
      include: { translations: { where: { language: lang } } },
    });

    if (!row) throw new NotFoundException("Category not found");

    const t = row.translations[0];
    const category = {
      id: row.id,
      key: row.key,
      name: t?.name ?? null,
      description: t?.description ?? null,
      isAvailable: row.isAvailable,
    };

    await CacheService.set(cacheKey, category, CacheSettings.categories.one.ttl);
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const id = uuidv4();
    const lang = dto.lang ?? "en";
    const row = await prisma.category.create({
      data: {
        id,
        key: dto.key,
        isAvailable: dto.isAvailable ?? true,
        translations: {
          create: [{ language: lang, name: dto.name, description: dto.description ?? null }],
        },
      },
      include: { translations: true },
    });
    await CacheService.deleteByPrefix(CATEGORY_CACHE_PREFIX);

    if (dto.name) await this.aiJobs.enqueue({ kind: "category", id });

    return row;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");

    const lang = dto.lang ?? "en";
    const row = await prisma.category.update({
      where: { id },
      data: {
        isAvailable: dto.isAvailable ?? undefined,
        translations:
          dto.name !== undefined || dto.description !== undefined
            ? {
                upsert: {
                  where: { categoryId_language: { categoryId: id, language: lang } },
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
      include: { translations: true },
    });
    await CacheService.deleteByPrefix(CATEGORY_CACHE_PREFIX);

    return row;
  }

  async remove(id: string) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Category not found");
    await prisma.category.delete({ where: { id } });
    await CacheService.deleteByPrefix(CATEGORY_CACHE_PREFIX);
    return { id };
  }

  async bulkToggle(ids: string[], isAvailable: boolean) {
    await prisma.category.updateMany({
      where: { id: { in: ids } },
      data: { isAvailable },
    });
    await CacheService.deleteByPrefix(CATEGORY_CACHE_PREFIX);
    return { count: ids.length };
  }

  async bulkRemove(ids: string[]) {
    await prisma.category.deleteMany({ where: { id: { in: ids } } });
    await CacheService.deleteByPrefix(CATEGORY_CACHE_PREFIX);
    return { count: ids.length };
  }
}
