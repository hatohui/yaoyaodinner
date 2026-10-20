import { Injectable, NotFoundException } from "@nestjs/common";
import { CreatePresetDto } from "./dto/create-preset.dto";
import { UpdatePresetDto } from "./dto/update-preset.dto";
import { AddPresetItemDto, UpdatePresetItemDto } from "./dto/preset-item.dto";
import { prisma } from "../../libs/prisma";
import { v4 as uuidv4 } from "uuid";
import { CacheService } from "@libs/redis";

const PRESET_CACHE_PREFIX = "preset-menus:";

const presetInclude = (lang: string) => ({
  foods: {
    include: {
      variant: {
        include: {
          food: { include: { translations: { where: { language: lang } } } },
          translations: { where: { language: lang } },
        },
      },
    },
  },
});

type PresetWithInclude = Awaited<
  ReturnType<typeof prisma.presetMenu.findFirstOrThrow<{ include: ReturnType<typeof presetInclude> }>>
>;

@Injectable()
export class PresetMenuService {
  private toResponseDto(preset: PresetWithInclude) {
    return {
      id: preset.id,
      price: Number(preset.price),
      isActive: preset.isActive,
      items: preset.foods.map((f) => ({
        variantId: f.variantId,
        foodId: f.variant.foodId,
        foodName: f.variant.food.translations[0]?.name ?? "",
        imageUrl: f.variant.food.imageUrl,
        variantLabel: f.variant.translations[0]?.label ?? "",
        price: f.variant.price ? Number(f.variant.price) : null,
        currency: f.variant.currency,
        quantity: f.quantity,
      })),
    };
  }

  async findAll(lang = "en") {
    const presets = await prisma.presetMenu.findMany({ include: presetInclude(lang) });
    return presets.map((p) => this.toResponseDto(p));
  }

  async findOne(id: string, lang = "en") {
    const preset = await prisma.presetMenu.findUnique({
      where: { id },
      include: presetInclude(lang),
    });
    if (!preset) throw new NotFoundException("Preset menu not found");
    return this.toResponseDto(preset);
  }

  async create(dto: CreatePresetDto, lang = "en") {
    const id = uuidv4();
    await prisma.presetMenu.create({
      data: {
        id,
        price: dto.price,
        isActive: dto.isActive ?? true,
        foods: dto.foods
          ? { create: dto.foods.map((f) => ({ variantId: f.variantId, quantity: f.quantity })) }
          : undefined,
      },
    });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return this.findOne(id, lang);
  }

  async update(id: string, dto: UpdatePresetDto, lang = "en") {
    const existing = await prisma.presetMenu.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Preset menu not found");

    await prisma.presetMenu.update({
      where: { id },
      data: { price: dto.price, isActive: dto.isActive },
    });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return this.findOne(id, lang);
  }

  async remove(id: string) {
    const existing = await prisma.presetMenu.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Preset menu not found");
    await prisma.presetMenu.delete({ where: { id } });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return { id };
  }

  async addItem(presetId: string, dto: AddPresetItemDto, lang = "en") {
    const preset = await prisma.presetMenu.findUnique({ where: { id: presetId } });
    if (!preset) throw new NotFoundException("Preset menu not found");

    await prisma.presetMenuFood.upsert({
      where: { presetId_variantId: { presetId, variantId: dto.variantId } },
      create: { presetId, variantId: dto.variantId, quantity: dto.quantity ?? 1 },
      update: { quantity: dto.quantity ?? 1 },
    });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return this.findOne(presetId, lang);
  }

  async updateItem(presetId: string, variantId: string, dto: UpdatePresetItemDto, lang = "en") {
    const existing = await prisma.presetMenuFood.findUnique({
      where: { presetId_variantId: { presetId, variantId } },
    });
    if (!existing) throw new NotFoundException("Preset menu item not found");

    await prisma.presetMenuFood.update({
      where: { presetId_variantId: { presetId, variantId } },
      data: { quantity: dto.quantity },
    });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return this.findOne(presetId, lang);
  }

  async removeItem(presetId: string, variantId: string, lang = "en") {
    const existing = await prisma.presetMenuFood.findUnique({
      where: { presetId_variantId: { presetId, variantId } },
    });
    if (!existing) throw new NotFoundException("Preset menu item not found");

    await prisma.presetMenuFood.delete({ where: { presetId_variantId: { presetId, variantId } } });
    await CacheService.deleteByPrefix(PRESET_CACHE_PREFIX);
    return this.findOne(presetId, lang);
  }
}
