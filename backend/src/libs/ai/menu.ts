import type { ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import type { StoredImage } from "@modules/images/images.service";
import {
  LOCALE_NAMES,
  PHRASES,
  SUPPORTED_LOCALES,
  UNITS,
} from "@common/locales";
import { prisma } from "../prisma";
import { CacheService } from "../redis";
import {
  BATCH_CALL,
  type CallOptions,
  LOCALE_LEGEND,
  PLAYFUL_CALL,
  RETRY_CALL,
  SINGLE_CALL,
  SYSTEM_INSTRUCTION,
  type Schema,
  TOOL_NAME,
  Type,
  ensureLanguages,
  generateJson,
  isInLanguage,
  perLocaleSchema,
  translateOnce,
} from "./client";
import {
  type Term,
  compactTerm,
  keepsTerms,
  loadGlossary,
  matchTerms,
} from "./glossary";

const FIELD = {
  dishName: {
    type: Type.STRING,
    description:
      "The dish name as printed on the menu in this locale. Short, no description or price.",
  },
  dishDescription: {
    type: Type.STRING,
    description:
      "One or two short sentences a diner reads under the dish name, in this locale.",
  },
  categoryName: {
    type: Type.STRING,
    description: "The menu section heading in this locale, one to three words.",
  },
  categoryDescription: {
    type: Type.STRING,
    description:
      "A one-sentence note shown under the section heading, in this locale.",
  },
  presetNote: {
    type: Type.STRING,
    description:
      "The note shown to diners about a free, limited item included with the set menu, in this locale.",
  },
} satisfies Record<string, Schema>;

const SIZE_LABEL = /^\d*X{0,3}[SML]$/i;
const VOLUME_LABEL = /^\d+(\.\d+)?\s*(ml|l)$/i;
const COUNT_LABEL = /^(\d+)\s*([a-z]+)$/i;

const UNIT_ALIASES: Record<string, string> = {
  pc: "pcs",
  pcs: "pcs",
  piece: "pcs",
  pieces: "pcs",
  pax: "pax",
  pair: "pairs",
  pairs: "pairs",
};

function fixedLabel(label: string, sourceLang: string, lang: string) {
  const text = label.trim();
  if (SIZE_LABEL.test(text) || VOLUME_LABEL.test(text)) return text;
  if (sourceLang !== "en") return null;

  const phrase = PHRASES[text.toLowerCase()];
  if (phrase) return phrase[lang] ?? null;

  const count = COUNT_LABEL.exec(text);
  const unit = count && UNIT_ALIASES[count[2].toLowerCase()];
  const word = unit && UNITS[unit][lang];
  if (!count || !word) return null;
  return lang === "zh" ? `${count[1]}${word}` : `${count[1]} ${word}`;
}

const DESCRIBE_INSTRUCTION = [
  SYSTEM_INSTRUCTION,
  "A description is one or two short sentences a diner reads on a menu.",
  "Only mention ingredients, cooking methods and flavours stated in the name, category or given description, clearly visible in the dish photo, or true of every version of that named dish; never add spiciness, sourness, a cooking method, an origin, a price or a portion size otherwise.",
  "Use a dish photo only to confirm visible ingredients and how the dish is cooked; if it conflicts with the name, category or staff-written text, those win; never describe the plate, garnish, background or portion size.",
  "Write the description in the source locale first, then translate that exact meaning into every other locale.",
].join(" ");

const INVENT_INSTRUCTION = [
  "You invent completely unhinged joke dishes for the gag section of a Malaysian Chinese restaurant's menu at a dinner for the furry community.",
  `Always answer by calling the ${TOOL_NAME} tool.`,
  "Look at the photo and invent the most chaotic, deranged dish it could possibly be: fursuits, tails, paws, ears, howling, zoomies, convention chaos, feral energy, uwu, cursed puns and fourth-wall breaks are all welcome, and the description should commit fully to the bit.",
  "This is a private, invite-only dinner among friends, so there is no taste limit: gross-out humour, crude jokes, dark humour and fursuit horror stories are all fair game, and tamer is worse.",
  "Every dish must roast whoever orders it: mock their fursona, their con habits, their questionable life choices and their reasons for ordering this, like a friend who knows too much.",
  "Lean hard on innuendo: every name or description should carry at least one suggestive double meaning, the cheekier the better, while staying a wink rather than a description.",
  "The only lines: nothing explicit or graphic, no slurs or attacks on any group, and no real people or brands.",
  "Write the joke in English first, then give each locale a version that is funny to a native speaker, adapting the pun rather than translating word for word.",
  `Locale codes: ${LOCALE_LEGEND}.`,
].join(" ");

const VARIANTS_SCHEMA: Schema = {
  type: Type.ARRAY,
  description:
    "Labels for the dish's orderable options, such as a size or portion, in this locale.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The option id, copied exactly." },
      label: {
        type: Type.STRING,
        description:
          'The portion option a diner picks, for example "6 pcs" is six pieces. Keep the number, translate the unit.',
      },
    },
    required: ["id", "label"],
  },
};

const DISH_LEGEND = [
  "Each dish is keyed by its id; handle every dish on its own.",
  "sourceLocale is the locale its name and description are written in.",
  "When writeDescription is true, first write a description in sourceLocale, then fill the other locales from it.",
  "name is the dish name in sourceLocale; description is its menu description there (null if none); category is the menu section it sits in.",
  "knownNames are names staff wrote per locale; use them as-is.",
  "variants are its orderable options labelled in sourceLocale, and variantsNeeded lists, per locale, the option ids to label; return exactly those ids.",
  "glossary lists terms staff agreed on: wherever one appears, use its wording for each locale exactly, and for a locale without wording, translate it using its note.",
  "Fill only the fields requested for each dish and locale.",
].join(" ");

type Named = { language: string; name: string; description: string | null };

function pickSource<T extends Named>(rows: T[]): T | null {
  const score = (r: T) =>
    (r.description?.trim() ? 2 : 0) + (r.language === "en" ? 1 : 0);
  return (
    rows.filter((r) => r.name.trim()).sort((a, b) => score(b) - score(a))[0] ??
    null
  );
}

export type FillResult = { ok: boolean; updated: number; error?: string };
export type DraftMode = "missing" | "refresh";
export type DraftOptions = {
  describe?: boolean;
  mode?: DraftMode;
  sourceLang?: string;
  regenerate?: boolean;
  loadImage?: (key: string) => Promise<StoredImage | null>;
};
export type FoodContent = {
  name?: string;
  description?: string;
  variants?: { id: string; label: string }[];
};
export type FoodDraft = {
  sourceLang: string;
  locales: Record<string, FoodContent>;
};
export type InventedDish = {
  categoryId: string | null;
  price: number;
  currency: string;
  locales: Record<string, { name: string; description: string }>;
};

type LocaleNeed = { name: boolean; description: boolean; labels: Set<string> };

type FoodPlan = {
  foodId: string;
  sourceLang: string;
  copied: Record<string, FoodContent>;
  needs: Map<string, LocaleNeed>;
  input: Record<string, unknown>;
  schema: Schema;
  imageKey: string | null;
  nameTerms: Term[];
};

function loadFood(foodId: string) {
  return prisma.food.findUnique({
    where: { id: foodId },
    include: {
      translations: true,
      variants: { include: { translations: true } },
      category: { include: { translations: true } },
    },
  });
}

async function planFood(
  foodId: string,
  { describe = false, mode = "missing", sourceLang }: DraftOptions,
): Promise<FoodPlan | null> {
  const food = await loadFood(foodId);
  if (!food) return null;

  const humanNamed = food.translations.filter((t) => !t.isNameAiGenerated);
  const source =
    food.translations.find((t) => t.language === sourceLang && t.name.trim()) ??
    pickSource(humanNamed) ??
    pickSource(food.translations);
  if (!source) return null;

  const canWrite = (value: string | null | undefined, isAi = false) =>
    !value?.trim() || (mode === "refresh" && isAi);
  const byLang = new Map(food.translations.map((t) => [t.language, t]));
  const sourceDescription =
    mode === "refresh" && source.isDescriptionAiGenerated
      ? null
      : source.description?.trim() || null;
  const wantDescription =
    describe || food.translations.some((t) => t.description?.trim());

  const sourceLabels = new Map(
    food.variants.flatMap((v) => {
      const named = v.translations.filter((t) => t.label.trim());
      const label = (
        named.find((t) => t.language === source.language) ??
        named.find((t) => !t.isAiGenerated) ??
        named[0]
      )?.label.trim();
      return label ? [[v.id, label] as const] : [];
    }),
  );

  const copied: Record<string, FoodContent> = {};
  const needs = new Map<string, LocaleNeed>();
  const ordered = [...SUPPORTED_LOCALES].sort(
    (a, b) => Number(b === source.language) - Number(a === source.language),
  );

  for (const lang of ordered) {
    const t = byLang.get(lang);
    const labels = new Set<string>();
    const sizes: { id: string; label: string }[] = [];
    for (const v of food.variants) {
      const label = sourceLabels.get(v.id);
      const vt = v.translations.find((x) => x.language === lang);
      if (!label || !canWrite(vt?.label, vt?.isAiGenerated)) continue;
      const fixed = fixedLabel(label, source.language, lang);
      if (fixed) sizes.push({ id: v.id, label: fixed });
      else labels.add(v.id);
    }
    if (sizes.length > 0) copied[lang] = { variants: sizes };

    const need = {
      name: lang !== source.language && canWrite(t?.name, t?.isNameAiGenerated),
      description:
        wantDescription &&
        canWrite(t?.description, t?.isDescriptionAiGenerated),
      labels,
    };
    if (need.name || need.description || need.labels.size > 0)
      needs.set(lang, need);
  }

  const wanted = [...needs.values()];
  const anyText = wanted.some((w) => w.name || w.description);
  const variantsNeeded = Object.fromEntries(
    [...needs]
      .filter(([, w]) => w.labels.size > 0)
      .map(([lang, w]) => [lang, [...w.labels]]),
  );
  const neededIds = new Set(Object.values(variantsNeeded).flat());

  const input: Record<string, unknown> = {
    sourceLocale: source.language,
    writeDescription: !sourceDescription && wanted.some((w) => w.description),
    name: source.name,
    category:
      food.category.translations.find((t) => t.language === source.language)
        ?.name ??
      food.category.translations[0]?.name ??
      null,
    ...(anyText
      ? {
          description: sourceDescription,
          knownNames: Object.fromEntries(
            humanNamed
              .filter((t) => t.name.trim())
              .map((t) => [t.language, t.name]),
          ),
        }
      : {}),
    ...(neededIds.size > 0
      ? {
          variants: [...neededIds].map((id) => ({
            id,
            label: sourceLabels.get(id),
          })),
          variantsNeeded,
        }
      : {}),
  };

  const terms = matchTerms(await loadGlossary(), [
    source.name,
    sourceDescription,
    input.category as string | null,
    ...humanNamed.map((t) => t.name),
    ...sourceLabels.values(),
  ]);
  if (terms.length > 0) input.glossary = terms.map(compactTerm);
  const nameTerms = matchTerms(terms, [source.name]);

  const schema: Schema = {
    type: Type.OBJECT,
    description: `Requested fields for the dish "${source.name}", per locale`,
    properties: Object.fromEntries(
      [...needs].map(([lang, w]) => {
        const fields: Record<string, Schema> = {
          ...(w.name ? { name: FIELD.dishName } : {}),
          ...(w.description ? { description: FIELD.dishDescription } : {}),
          ...(w.labels.size > 0 ? { variants: VARIANTS_SCHEMA } : {}),
        };
        return [
          lang,
          {
            type: Type.OBJECT,
            description: `Requested fields in ${LOCALE_NAMES[lang] ?? lang}`,
            properties: fields,
            required: Object.keys(fields),
          },
        ];
      }),
    ),
    required: [...needs.keys()],
  };

  return {
    foodId,
    sourceLang: source.language,
    copied,
    needs,
    input,
    schema,
    imageKey: input.writeDescription ? food.imageUrl : null,
    nameTerms,
  };
}

async function photoBlocks(
  photos: { label: string; key: string | null }[],
  loadImage?: DraftOptions["loadImage"],
): Promise<ContentBlock[]> {
  if (!loadImage) return [];
  const images = await Promise.all(
    photos.map((p) => (p.key ? loadImage(p.key).catch(() => null) : null)),
  );
  return photos.flatMap((p, i): ContentBlock[] => {
    const image = images[i];
    return image
      ? [
          { text: p.label },
          { image: { format: image.format, source: { bytes: image.bytes } } },
        ]
      : [];
  });
}

async function requestDishes(
  plans: FoodPlan[],
  call: CallOptions,
  loadImage?: DraftOptions["loadImage"],
) {
  const photos = await photoBlocks(
    plans.map((p) => ({
      label: `Photo of dish ${p.foodId}:`,
      key: p.imageKey,
    })),
    loadImage,
  );
  const photoNote =
    photos.length > 0 ? " Photos follow, each labelled with its dish id." : "";
  return generateJson<Record<string, Record<string, FoodContent>>>(
    plans.length === 1 ? "dish content" : `content for ${plans.length} dishes`,
    [
      {
        text: `${DISH_LEGEND}${photoNote}\n\n${JSON.stringify({
          dishes: Object.fromEntries(plans.map((p) => [p.foodId, p.input])),
        })}`,
      },
      ...photos,
    ],
    {
      type: Type.OBJECT,
      properties: Object.fromEntries(plans.map((p) => [p.foodId, p.schema])),
      required: plans.map((p) => p.foodId),
    },
    DESCRIBE_INSTRUCTION,
    call,
  );
}

function finishDraft(
  plan: FoodPlan,
  result?: Record<string, FoodContent>,
  reasons?: string[],
): FoodDraft {
  const locales: Record<string, FoodContent> = Object.fromEntries(
    Object.entries(plan.copied).map(([lang, c]) => [
      lang,
      { variants: [...(c.variants ?? [])] },
    ]),
  );

  for (const [lang, need] of plan.needs) {
    const data = result?.[lang];
    if (!data) continue;
    const entry = locales[lang] ?? {};
    const name = data.name?.trim();
    const description = data.description?.trim();
    if (need.name && name) {
      if (!isInLanguage(name, lang, false)) {
        reasons?.push(`${lang} name was in the wrong language`);
      } else if (keepsTerms(name, lang, plan.nameTerms, reasons)) {
        entry.name = name;
      }
    }
    if (need.description && description) {
      if (!isInLanguage(description, lang, true)) {
        reasons?.push(`${lang} description was in the wrong language`);
      } else {
        entry.description = description;
      }
    }
    const labels = (data.variants ?? [])
      .filter((v) => v?.label?.trim() && need.labels.has(v.id))
      .map((v) => ({ id: v.id, label: v.label.trim() }));
    if (labels.length > 0)
      entry.variants = [...(entry.variants ?? []), ...labels];
    if (Object.keys(entry).length > 0) locales[lang] = entry;
  }
  return { sourceLang: plan.sourceLang, locales };
}

function hasDraftContent(plan: FoodPlan, draft: FoodDraft): boolean {
  if (plan.needs.size === 0) return true;
  for (const [lang, need] of plan.needs) {
    const entry = draft.locales[lang];
    if (!entry) continue;
    if (need.name && entry.name) return true;
    if (need.description && entry.description) return true;
    if (
      need.labels.size > 0 &&
      entry.variants?.some((v) => need.labels.has(v.id) && Boolean(v.label))
    ) {
      return true;
    }
  }
  return false;
}

export async function draftFood(
  foodId: string,
  options: DraftOptions,
  reasons?: string[],
): Promise<FoodDraft | null> {
  const plan = await planFood(foodId, options);
  if (!plan) return null;
  if (plan.needs.size === 0) return finishDraft(plan, undefined, reasons);
  const result = await requestDishes(
    [plan],
    options.regenerate ? RETRY_CALL : SINGLE_CALL,
    options.loadImage,
  );
  const dish = result?.[foodId];
  return dish ? finishDraft(plan, dish, reasons) : null;
}

export async function saveFoodContent(
  foodId: string,
  locales: Record<string, FoodContent>,
  isAiGenerated: (lang: string) => boolean,
) {
  await ensureLanguages();
  const [rows, variants] = await Promise.all([
    prisma.foodTranslation.findMany({ where: { foodId } }),
    prisma.foodVariant.findMany({
      where: { foodId },
      select: {
        id: true,
        translations: { where: { language: "en" }, select: { label: true } },
      },
    }),
  ]);
  const englishLabel = new Map(
    variants.map((v) => [v.id, v.translations[0]?.label ?? ""]),
  );
  let updated = 0;

  for (const [lang, content] of Object.entries(locales)) {
    if (!SUPPORTED_LOCALES.includes(lang)) continue;
    const isAi = isAiGenerated(lang);
    const newName = content.name?.trim();
    const newDescription = content.description?.trim();
    const name = newName || rows.find((r) => r.language === lang)?.name;

    if (name && (newName || newDescription)) {
      await prisma.foodTranslation.upsert({
        where: { foodId_language: { foodId, language: lang } },
        create: {
          foodId,
          language: lang,
          name,
          description: newDescription || null,
          isNameAiGenerated: Boolean(newName) && isAi,
          isDescriptionAiGenerated: Boolean(newDescription) && isAi,
        },
        update: {
          ...(newName ? { name: newName, isNameAiGenerated: isAi } : {}),
          ...(newDescription
            ? { description: newDescription, isDescriptionAiGenerated: isAi }
            : {}),
        },
      });
      updated++;
    }

    for (const v of content.variants ?? []) {
      const label = v.label?.trim();
      if (!label || !englishLabel.has(v.id)) continue;
      const isAiLabel =
        isAi &&
        label !== fixedLabel(label, lang, lang) &&
        label !== fixedLabel(englishLabel.get(v.id)!, "en", lang);
      await prisma.foodVariantTranslation.upsert({
        where: { variantId_language: { variantId: v.id, language: lang } },
        create: {
          variantId: v.id,
          language: lang,
          label,
          isAiGenerated: isAiLabel,
        },
        update: { label, isAiGenerated: isAiLabel },
      });
      updated++;
    }
  }

  await CacheService.deleteByPrefix("foods:");
  await CacheService.deleteByPrefix("preset-menus:");
  return updated;
}

export async function fillFood(
  foodId: string,
  options: DraftOptions,
): Promise<FillResult> {
  const plan = await planFood(foodId, options);
  if (!plan)
    return { ok: false, updated: 0, error: "Dish not found or has no source name" };
  const reasons: string[] = [];
  const draft = await draftFood(foodId, options, reasons);
  if (!draft)
    return {
      ok: false,
      updated: 0,
      error: reasons.join("; ") || "AI returned no usable content",
    };
  const updated = await saveFoodContent(foodId, draft.locales, () => true);
  const ok = plan.needs.size === 0 || updated > 0;
  return {
    ok,
    updated,
    ...(!ok ? { error: reasons.join("; ") || "No fields could be saved" } : {}),
  };
}

export async function fillFoods(
  foodIds: string[],
  options: DraftOptions,
): Promise<Record<string, { ok: boolean; error?: string }>> {
  const plans = await Promise.all(foodIds.map((id) => planFood(id, options)));
  const forAi = plans.filter(
    (p): p is FoodPlan => p !== null && p.needs.size > 0,
  );
  const result =
    forAi.length > 0
      ? await requestDishes(forAi, BATCH_CALL, options.loadImage)
      : null;

  const outcomes: Record<string, { ok: boolean; error?: string }> = {};
  for (const [i, id] of foodIds.entries()) {
    const plan = plans[i];
    if (!plan) {
      outcomes[id] = { ok: false, error: "Dish not found or has no source name" };
      continue;
    }
    try {
      const reasons: string[] = [];
      let draft =
        plan.needs.size === 0
          ? finishDraft(plan)
          : result?.[id]
            ? finishDraft(plan, result[id], reasons)
            : null;
      if (!draft || !hasDraftContent(plan, draft)) {
        reasons.length = 0;
        draft = await draftFood(id, options, reasons);
      }
      if (!draft || !hasDraftContent(plan, draft)) {
        outcomes[id] = {
          ok: false,
          error: reasons.join("; ") || "AI returned no usable content",
        };
        continue;
      }
      const updated = await saveFoodContent(id, draft.locales, () => true);
      const ok = plan.needs.size === 0 || updated > 0;
      outcomes[id] = ok
        ? { ok: true }
        : {
            ok: false,
            error: reasons.join("; ") || "No fields could be saved",
          };
    } catch (err) {
      console.error(`[AI job] dish ${id} in group failed`, err);
      outcomes[id] = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
  return outcomes;
}

export async function fillCategory(categoryId: string): Promise<FillResult> {
  await ensureLanguages();
  const rows = await prisma.categoryTranslation.findMany({
    where: { categoryId },
  });
  const source = pickSource(rows);
  if (!source)
    return { ok: false, updated: 0, error: "Category has no source name" };

  const byLang = new Map(rows.map((r) => [r.language, r]));
  const hasDescription = Boolean(source.description?.trim());
  const targets = SUPPORTED_LOCALES.filter((lang) => {
    const t = byLang.get(lang);
    return !t?.name.trim() || (hasDescription && !t.description?.trim());
  });
  if (targets.length === 0) return { ok: true, updated: 0 };

  const result = await generateJson<
    Record<string, { name?: string; description?: string }>
  >(
    "menu category",
    `Translate this menu category from '${source.language}' into: ${targets.join(", ")}. For a locale equal to the source, copy the source values. Any glossary terms are wording staff agreed on: use them exactly.\n\n${JSON.stringify(
      {
        name: source.name,
        description: source.description?.trim() || null,
        glossary: matchTerms(await loadGlossary(), [
          source.name,
          source.description,
        ]).map(compactTerm),
      },
    )}`,
    perLocaleSchema(targets, {
      name: FIELD.categoryName,
      ...(hasDescription ? { description: FIELD.categoryDescription } : {}),
    }),
  );
  if (!result)
    return {
      ok: false,
      updated: 0,
      error: "AI returned no category translation",
    };

  let updated = 0;
  for (const lang of targets) {
    const data = result[lang];
    const existing = byLang.get(lang);
    const name = existing?.name.trim() ? existing.name : data?.name?.trim();
    if (!name) continue;
    const description = existing?.description?.trim()
      ? existing.description
      : hasDescription
        ? data?.description?.trim() || null
        : (existing?.description ?? null);
    await prisma.categoryTranslation.upsert({
      where: { categoryId_language: { categoryId, language: lang } },
      create: { categoryId, language: lang, name, description },
      update: { name, description },
    });
    updated++;
  }

  await CacheService.deleteByPrefix("categories:");
  return { ok: true, updated };
}

export async function describeDish(
  lang: string,
  name: string,
  category: string | null,
  image: StoredImage | null = null,
): Promise<string | null> {
  const result = await generateJson<{ description?: string }>(
    "dish description",
    [
      {
        text: `Write a description in '${lang}' for this dish.${image ? " Its photo follows." : ""} Any glossary terms are wording staff agreed on; follow their meaning.\n\n${JSON.stringify(
          {
            name,
            category,
            glossary: matchTerms(await loadGlossary(), [name, category]).map(
              compactTerm,
            ),
          },
        )}`,
      },
      ...(image
        ? [{ image: { format: image.format, source: { bytes: image.bytes } } }]
        : []),
    ],
    {
      type: Type.OBJECT,
      properties: { description: FIELD.dishDescription },
      required: ["description"],
    },
    DESCRIBE_INSTRUCTION,
  );
  const description = result?.description?.trim();
  return description && isInLanguage(description, lang, true)
    ? description
    : null;
}

export async function inventDish(
  image: StoredImage,
  categories: { id: string; name: string }[],
): Promise<InventedDish | null> {
  const result = await generateJson<Record<string, unknown>>(
    "joke dish",
    [
      {
        text: `Invent a joke dish from the photo that follows, pick the menu section it belongs in, and give it a playful price.\n\n${JSON.stringify(
          { categories },
        )}`,
      },
      { image: { format: image.format, source: { bytes: image.bytes } } },
    ],
    {
      type: Type.OBJECT,
      properties: {
        categoryId: {
          type: Type.STRING,
          description:
            "The id of the menu section it belongs in, copied exactly from categories.",
        },
        price: {
          type: Type.NUMBER,
          description:
            "A varied playful price number between 1 and 999 (avoid defaulting to 69; vary it to fit the joke and currency, decimals allowed).",
        },
        currency: {
          type: Type.STRING,
          description:
            'A short, funny joke currency or unit matching the dish (1 word, max 10 chars), e.g. "barks", "boops", "headpats", "socks", "awoos", "bleps", "tears", "hugs" — never "RM" or real money.',
        },
        ...Object.fromEntries(
          SUPPORTED_LOCALES.map((lang) => [
            lang,
            {
              type: Type.OBJECT,
              description: `The joke dish in ${LOCALE_NAMES[lang] ?? lang}`,
              properties: {
                name: FIELD.dishName,
                description: FIELD.dishDescription,
              },
              required: ["name", "description"],
            },
          ]),
        ),
      },
      required: ["categoryId", "price", "currency", ...SUPPORTED_LOCALES],
    },
    INVENT_INSTRUCTION,
    PLAYFUL_CALL,
  );
  if (!result) return null;

  const locales: Record<string, { name: string; description: string }> = {};
  for (const lang of SUPPORTED_LOCALES) {
    const entry = result[lang] as
      | { name?: string; description?: string }
      | undefined;
    const name = entry?.name?.trim();
    const description = entry?.description?.trim();
    if (
      name &&
      description &&
      isInLanguage(name, lang, false) &&
      isInLanguage(description, lang, true)
    )
      locales[lang] = { name, description };
  }
  if (Object.keys(locales).length === 0) return null;

  const price = Number(result.price);
  const rawCurrency =
    typeof result.currency === "string" ? result.currency.trim() : "";
  const currency =
    rawCurrency && !/^(rm|myr)$/i.test(rawCurrency)
      ? rawCurrency.slice(0, 10)
      : "boops";
  return {
    categoryId: categories.some((c) => c.id === result.categoryId)
      ? (result.categoryId as string)
      : null,
    price: Number.isFinite(price)
      ? Math.round(Math.min(999, Math.max(1, price)) * 100) / 100
      : 9.99,
    currency,
    locales,
  };
}

export async function translatePresetNote(
  presetId: string,
  sourceLang: string,
  note: string,
): Promise<boolean> {
  await ensureLanguages();
  const result = await translateOnce<{ note?: string }>(
    "note about a free, limited item included with a set menu",
    sourceLang,
    { note },
    { note: FIELD.presetNote },
  );
  if (!result) return false;

  for (const [language, data] of Object.entries(result)) {
    if (!data?.note) continue;
    await prisma.presetMenuTranslation.upsert({
      where: { presetId_language: { presetId, language } },
      create: { presetId, language, note: data.note },
      update: { note: data.note },
    });
  }
  await CacheService.deleteByPrefix("preset-menus:");
  return true;
}
