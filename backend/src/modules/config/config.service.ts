import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@libs/prisma";
import { CacheService } from "@libs/redis";
import { CacheSettings } from "@common/cache/constants";
import {
  CONFIG_DEFAULTS,
  CONFIG_KEYS,
  ConfigType,
  parseConfigValue,
  serializeConfigValue,
} from "@common/config/registry";

type ConfigRow = {
  key: string;
  value: string;
  type: string;
  category: string | null;
  label: string | null;
  isPublic: boolean;
  updatedAt: string | Date;
};

@Injectable()
export class ConfigService {
  private withRegistryMeta(rows: ConfigRow[]): ConfigRow[] {
    return rows.map((r) => {
      // labels and grouping follow the registry, so renames don't need a reseed
      const meta = CONFIG_DEFAULTS.find((d) => d.key === r.key);
      return meta ? { ...r, label: meta.label, category: meta.category } : r;
    });
  }

  private async loadAll(): Promise<ConfigRow[]> {
    const cached = await CacheService.get<ConfigRow[]>(
      CacheSettings.config.all.key,
    );
    if (cached) return this.withRegistryMeta(cached);

    const stored = this.withRegistryMeta(
      await prisma.appConfig.findMany({
        orderBy: [{ category: "asc" }, { key: "asc" }],
      }),
    );
    // keys added to the registry after the DB was seeded still show, at their default
    const missing = CONFIG_DEFAULTS.filter(
      (d) => !stored.some((r) => r.key === d.key),
    ).map((d) => ({
      key: d.key,
      value: serializeConfigValue(d.type, d.value),
      type: d.type,
      category: d.category,
      label: d.label,
      isPublic: d.isPublic,
      updatedAt: new Date(0),
    }));
    const rows = [...stored, ...missing];
    await CacheService.set(
      CacheSettings.config.all.key,
      rows,
      CacheSettings.config.all.ttl,
    );
    return rows;
  }

  async get<T = unknown>(key: string): Promise<T> {
    const rows = await this.loadAll();
    const row = rows.find((r) => r.key === key);
    if (row) return parseConfigValue(row.type, row.value) as T;

    const fallback = CONFIG_DEFAULTS.find((d) => d.key === key);
    return fallback?.value as T;
  }

  async getAdminPassphrase(): Promise<string | undefined> {
    return this.get<string>(CONFIG_KEYS.adminPassphrase);
  }

  async getPublic(): Promise<Record<string, unknown>> {
    const rows = await this.loadAll();
    return rows
      .filter((r) => r.isPublic)
      .reduce<Record<string, unknown>>((acc, r) => {
        acc[r.key] = parseConfigValue(r.type, r.value);
        return acc;
      }, {});
  }

  async list(): Promise<ConfigRow[]> {
    return this.loadAll();
  }

  async set(key: string, value: string): Promise<ConfigRow> {
    const existing = await prisma.appConfig.findUnique({ where: { key } });
    const meta = CONFIG_DEFAULTS.find((d) => d.key === key);
    if (!existing && !meta) throw new NotFoundException("Unknown config key");

    const type: ConfigType = (existing?.type ?? meta?.type ?? "string") as ConfigType;
    const row = await prisma.appConfig.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        type,
        category: meta?.category ?? null,
        label: meta?.label ?? null,
        isPublic: meta?.isPublic ?? false,
      },
    });

    await CacheService.delete(CacheSettings.config.all.key);
    return row;
  }
}
