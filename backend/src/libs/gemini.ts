import { GoogleGenAI, Type, Schema } from "@google/genai";
import { prisma } from "./prisma";
import { CacheService } from "./redis";

const SUPPORTED_LOCALES = ["en", "vi", "zh", "th"];
// Google retires model ids; override with GEMINI_MODEL without a code change
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const SYSTEM_INSTRUCTION = [
  "You translate restaurant menu content.",
  "Return every requested field in every requested locale in one single JSON object.",
  "Output JSON only - no prose, no explanation, no markdown fences.",
  "Top-level keys are the target locale codes.",
  "Copy any provided id value verbatim; never invent, drop, reorder, or merge array entries.",
  "Translate naturally for a diner reading a menu; keep proper nouns and brand names untranslated.",
].join(" ");

let _ai: GoogleGenAI | null = null;
let _initialized = false;

function getAi(): GoogleGenAI | null {
  if (_initialized) return _ai;
  _initialized = true;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Gemini] GEMINI_API_KEY not set, AI features disabled");
    return null;
  }
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

/**
 * One request per entity: the response schema nests every target locale under a
 * single JSON object, so four locales cost one call instead of one call each.
 */
async function translateOnce<T>(
  subject: string,
  sourceLang: string,
  payload: object,
  localeFields: Record<string, Schema>,
): Promise<Record<string, T> | null> {
  const ai = getAi();
  if (!ai) return null;

  const targets = SUPPORTED_LOCALES.filter((l) => l !== sourceLang);
  if (targets.length === 0) return null;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: Object.fromEntries(
      targets.map((lang) => [
        lang,
        {
          type: Type.OBJECT,
          properties: localeFields,
          required: Object.keys(localeFields),
        },
      ]),
    ),
    required: targets,
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Translate this ${subject} from '${sourceLang}' into: ${targets.join(
        ", ",
      )}.\n\n${JSON.stringify(payload)}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as Record<string, T>;
  } catch (err) {
    console.error(`[Gemini] Failed to translate ${subject}`, err);
    return null;
  }
}

export const AiService = {
  async translateCategory(
    categoryId: string,
    sourceLang: string,
    name: string,
    description: string | null,
  ): Promise<boolean> {
    if (!name) return false;

    const fields: Record<string, Schema> = { name: { type: Type.STRING } };
    if (description) fields.description = { type: Type.STRING };

    const result = await translateOnce<{ name?: string; description?: string }>(
      "menu category",
      sourceLang,
      { name, description },
      fields,
    );
    if (!result) return false;

    for (const [language, data] of Object.entries(result)) {
      if (!data?.name) continue;
      await prisma.categoryTranslation.upsert({
        where: { categoryId_language: { categoryId, language } },
        create: {
          categoryId,
          language,
          name: data.name,
          description: data.description ?? null,
        },
        update: { name: data.name, description: data.description ?? null },
      });
    }

    await CacheService.deleteByPrefix("categories:");
    return true;
  },

  async translateFood(
    foodId: string,
    sourceLang: string,
    name: string,
    description: string | null,
    variants: { id: string; label: string }[],
  ): Promise<boolean> {
    if (!name && variants.length === 0) return false;

    const fields: Record<string, Schema> = {};
    if (name) fields.name = { type: Type.STRING };
    if (description) fields.description = { type: Type.STRING };
    if (variants.length > 0) {
      fields.variants = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            label: { type: Type.STRING },
          },
          required: ["id", "label"],
        },
      };
    }

    const result = await translateOnce<{
      name?: string;
      description?: string;
      variants?: { id: string; label: string }[];
    }>("dish and its variants", sourceLang, { name, description, variants }, fields);
    if (!result) return false;

    const knownVariantIds = new Set(variants.map((v) => v.id));

    for (const [language, data] of Object.entries(result)) {
      if (!data) continue;

      if (data.name) {
        await prisma.foodTranslation.upsert({
          where: { foodId_language: { foodId, language } },
          create: {
            foodId,
            language,
            name: data.name,
            description: data.description ?? null,
          },
          update: { name: data.name, description: data.description ?? null },
        });
      }

      for (const v of data.variants ?? []) {
        if (!v?.label || !knownVariantIds.has(v.id)) continue;
        await prisma.foodVariantTranslation.upsert({
          where: { variantId_language: { variantId: v.id, language } },
          create: { variantId: v.id, language, label: v.label },
          update: { label: v.label },
        });
      }
    }

    await CacheService.deleteByPrefix("foods:");
    return true;
  },

  async translateFoodVariant(
    variantId: string,
    sourceLang: string,
    label: string,
  ): Promise<boolean> {
    if (!label) return false;

    const result = await translateOnce<{ label?: string }>(
      "dish variant label",
      sourceLang,
      { label },
      { label: { type: Type.STRING } },
    );
    if (!result) return false;

    for (const [language, data] of Object.entries(result)) {
      if (!data?.label) continue;
      await prisma.foodVariantTranslation.upsert({
        where: { variantId_language: { variantId, language } },
        create: { variantId, language, label: data.label },
        update: { label: data.label },
      });
    }

    await CacheService.deleteByPrefix("foods:");
    return true;
  },
};
