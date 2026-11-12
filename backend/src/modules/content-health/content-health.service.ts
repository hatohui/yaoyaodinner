import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { prisma } from '@libs/prisma';
import { AiService } from '@libs/ai';
import { SUPPORTED_LOCALES } from '@common/locales';
import { AiJobsService, type BatchItem } from '@modules/ai-jobs/ai-jobs.service';
import { ImagesService } from '@modules/images/images.service';
import type { FillAllTab } from './dto/content-health.dto';
import type { SaveFoodLocaleDto } from './dto/food-draft.dto';

type Translation = { language: string; name: string; description: string | null };

function displayName(rows: Translation[], lang: string) {
  return (
    rows.find((r) => r.language === lang && r.name.trim())?.name ??
    rows.find((r) => r.language === 'en' && r.name.trim())?.name ??
    rows.find((r) => r.name.trim())?.name ??
    ''
  );
}

@Injectable()
export class ContentHealthService {
  constructor(
    private aiJobs: AiJobsService,
    private images: ImagesService,
  ) {}

  async report(lang = 'en') {
    const [foods, categories] = await Promise.all([
      prisma.food.findMany({
        include: {
          translations: true,
          variants: { include: { translations: true } },
        },
      }),
      prisma.category.findMany({ include: { translations: true } }),
    ]);

    const foodIssues = foods
      .map((f) => {
        const byLang = new Map(f.translations.map((t) => [t.language, t]));
        const anyDescription = f.translations.some((t) => t.description?.trim());
        const labelledVariants = f.variants.filter((v) =>
          v.translations.some((t) => t.label.trim().length > 0),
        );

        const missingNames = SUPPORTED_LOCALES.filter(
          (l) => !byLang.get(l)?.name.trim(),
        );
        const missingDescriptions = anyDescription
          ? SUPPORTED_LOCALES.filter((l) => !byLang.get(l)?.description?.trim())
          : [];
        const missingVariants =
          labelledVariants.length > 0
            ? SUPPORTED_LOCALES.filter((l) =>
                labelledVariants.some(
                  (v) =>
                    !v.translations.some((t) => t.language === l && t.label.trim()),
                ),
              )
            : [];

        const missingTranslations = [
          ...new Set([...missingNames, ...missingDescriptions, ...missingVariants]),
        ];

        const variantLabels = [
          ...new Set(
            labelledVariants
              .map(
                (v) =>
                  (
                    v.translations.find((t) => t.language === lang)?.label ??
                    v.translations.find((t) => t.language === 'en')?.label ??
                    v.translations.find((t) => t.label.trim())?.label ??
                    ''
                  ).trim(),
              )
              .filter(Boolean),
          ),
        ];

        return {
          id: f.id,
          name: displayName(f.translations, lang),
          imageUrl: f.imageUrl,
          categoryId: f.categoryId,
          isAvailable: f.isAvailable,
          missingTranslations,
          missingNames,
          missingDescriptions,
          missingVariants,
          variantLabels,
          missingDescription: !anyDescription,
          missingImage: !f.imageUrl,
        };
      })
      .filter(
        (f) =>
          f.missingTranslations.length > 0 || f.missingDescription || f.missingImage,
      )
      .sort(
        (a, b) =>
          Number(b.isAvailable) - Number(a.isAvailable) ||
          a.name.localeCompare(b.name),
      );

    const categoryIssues = categories
      .map((c) => {
        const byLang = new Map(c.translations.map((t) => [t.language, t]));
        const missingTranslations = SUPPORTED_LOCALES.filter(
          (l) => !byLang.get(l)?.name.trim(),
        );
        return {
          id: c.id,
          name: displayName(c.translations, lang) || c.key,
          isAvailable: c.isAvailable,
          missingTranslations,
          missingNames: missingTranslations,
        };
      })
      .filter((c) => c.missingTranslations.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      locales: SUPPORTED_LOCALES,
      foods: foodIssues,
      categories: categoryIssues,
      summary: {
        foods: foods.length,
        categories: categories.length,
        missingTranslations: foodIssues.filter((f) => f.missingTranslations.length > 0)
          .length,
        missingDescriptions: foodIssues.filter((f) => f.missingDescription).length,
        missingImages: foodIssues.filter((f) => f.missingImage).length,
        categoryTranslations: categoryIssues.length,
      },
    };
  }

  async fillCategory(id: string) {
    const exists = await prisma.category.count({ where: { id } });
    if (!exists) throw new NotFoundException('Category not found');
    await this.aiJobs.enqueue({ kind: 'category', id });
    return { id, status: 'pending' as const };
  }

  async fillAll(tab: FillAllTab) {
    const { foods, categories } = await this.report();
    const items: BatchItem[] =
      tab === 'categories'
        ? categories.map((c) => ({ kind: 'category', id: c.id }))
        : tab === 'descriptions'
          ? foods
              .filter((f) => f.missingDescription)
              .map((f) => ({ kind: 'food', id: f.id, describe: true }))
          : foods
              .filter((f) => f.missingTranslations.length > 0)
              .map((f) => ({ kind: 'food', id: f.id }));
    return this.aiJobs.enqueueBatch(items);
  }

  async jobs(ids: string[]) {
    const [batch, jobs] = await Promise.all([
      this.aiJobs.batch(),
      this.aiJobs.statuses(ids),
    ]);
    return { batch, jobs };
  }

  async draftFood(id: string, describe = false, regenerate = false) {
    const food = await prisma.food.findUnique({
      where: { id },
      include: {
        translations: true,
        variants: { include: { translations: true } },
      },
    });
    if (!food) throw new NotFoundException('Food not found');

    const draft = await AiService.draftFood(id, {
      describe,
      regenerate,
      mode: 'refresh',
      loadImage: (key) => this.images.readImage(key),
    });
    if (!draft) throw new ServiceUnavailableException('AI could not draft this dish');

    const labelIn = (lang: string) =>
      food.variants.flatMap((v) => {
        const label = v.translations.find((t) => t.language === lang)?.label;
        return label?.trim() ? [{ id: v.id, label }] : [];
      });

    return {
      sourceLang: draft.sourceLang,
      variants: labelIn(draft.sourceLang),
      locales: Object.entries(draft.locales).map(([lang, content]) => {
        const t = food.translations.find((r) => r.language === lang);
        return {
          lang,
          current: {
            name: t?.name || undefined,
            description: t?.description || undefined,
            variants: labelIn(lang),
          },
          draft: content,
        };
      }),
    };
  }

  async saveFoodContent(id: string, locales: SaveFoodLocaleDto[]) {
    const exists = await prisma.food.count({ where: { id } });
    if (!exists) throw new NotFoundException('Food not found');
    const flags = new Map(locales.map((l) => [l.lang, l.isAiGenerated]));
    const updated = await AiService.saveFoodContent(
      id,
      Object.fromEntries(
        locales.map(({ lang, name, description, variants }) => [
          lang,
          { name, description, variants },
        ]),
      ),
      (lang) => flags.get(lang) ?? false,
    );
    return { updated };
  }

  async describe(
    name: string,
    category: string | null,
    lang: string,
    imageKey?: string,
  ) {
    const image = imageKey
      ? await this.images.readImage(imageKey).catch(() => null)
      : null;
    return {
      description: await AiService.describeDish(lang, name, category, image),
    };
  }
}
