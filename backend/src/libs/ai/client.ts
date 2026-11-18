import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ContentBlock,
  type ToolInputSchema,
} from "@aws-sdk/client-bedrock-runtime";
import {
  LANGUAGE_ROWS,
  LOCALE_NAMES,
  SUPPORTED_LOCALES,
  isTextInLocaleScript,
} from "@common/locales";
import { prisma } from "../prisma";
import { CacheService } from "../redis";

export const MODEL =
  process.env.BEDROCK_MODEL_ID ||
  "global.anthropic.claude-haiku-4-5-20251001-v1:0";
export const TOOL_NAME = "submit";

export type Schema = {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
};

export const Type = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  OBJECT: "object",
  ARRAY: "array",
} as const;

export const LOCALE_LEGEND = SUPPORTED_LOCALES.map(
  (l) => `${l} is ${LOCALE_NAMES[l] ?? l}`,
).join(", ");

export const SYSTEM_INSTRUCTION = [
  "You write and translate menu content for a Malaysian Chinese restaurant.",
  `Always answer by calling the ${TOOL_NAME} tool with every requested field in every requested locale.`,
  `Top-level keys are locale codes: ${LOCALE_LEGEND}.`,
  "Copy any provided id value verbatim; never invent, drop, reorder, or merge array entries.",
  "Name each dish the way a native speaker expects to see it on a restaurant menu, not word for word; keep proper nouns and brand names as they are.",
  "Option labels are portions: keep the number and translate the unit naturally, where pcs means pieces, pax means people served, pairs means pairs and per portion means one serving; keep S, M and L unchanged.",
].join(" ");

export type CallOptions = {
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
  model?: string;
  fallbackModel?: string;
};

export const FALLBACK_MODEL =
  process.env.AI_FALLBACK_MODEL_ID || "global.amazon.nova-2-lite-v1:0";
export const FUN_MODEL = process.env.AI_FUN_MODEL_ID || MODEL;
const PRIMARY_RPM = Number(process.env.AI_PRIMARY_RPM) || 9;

export const SINGLE_CALL: CallOptions = {
  timeoutMs: 20_000,
  maxTokens: 2_048,
  temperature: 0,
};
export const RETRY_CALL: CallOptions = { ...SINGLE_CALL, temperature: 0.7 };
export const PLAYFUL_CALL: CallOptions = {
  ...SINGLE_CALL,
  temperature: 1,
  model: FUN_MODEL,
  fallbackModel: FALLBACK_MODEL,
};
export const ROAST_TRANSLATE_CALL: CallOptions = {
  timeoutMs: 12_000,
  maxTokens: 2_000,
  temperature: 0.3,
  fallbackModel: FALLBACK_MODEL,
};
export const ROAST_CALL: CallOptions = {
  timeoutMs: 12_000,
  maxTokens: 400,
  temperature: 1,
  model: FUN_MODEL,
  fallbackModel: FALLBACK_MODEL,
};
export const PLAN_CALL: CallOptions = {
  timeoutMs: 25_000,
  maxTokens: 1_500,
  temperature: 0.8,
  model: FUN_MODEL,
  fallbackModel: FALLBACK_MODEL,
};
/** Edits should follow the note, not get creative with it. */
export const EDIT_TEMPERATURE = 0.3;
export const PLAN_RETRY_CALL: CallOptions = {
  ...PLAN_CALL,
  temperature: 0.6,
  model: MODEL,
  fallbackModel: undefined,
};
export const BATCH_CALL: CallOptions = {
  timeoutMs: 45_000,
  maxTokens: 5_000,
  temperature: 0,
};

let _client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  _client ??= new BedrockRuntimeClient({
    region:
      process.env.BEDROCK_REGION || process.env.AWS_REGION || "ap-southeast-1",
    maxAttempts: 2,
    requestHandler: { connectionTimeout: 3_000, requestTimeout: 50_000 },
  });
  return _client;
}

let languagesEnsured: Promise<void> | null = null;
export function ensureLanguages() {
  languagesEnsured ??= prisma.language
    .createMany({ data: LANGUAGE_ROWS, skipDuplicates: true })
    .then(() => undefined)
    .catch((err) => {
      languagesEnsured = null;
      throw err;
    });
  return languagesEnsured;
}

export function isInLanguage(
  raw: string,
  lang: string,
  isSentence: boolean,
  names: (string | null | undefined)[] = [],
) {
  const text = names
    .filter((n): n is string => Boolean(n?.trim()))
    .flatMap((n) => [n, ...n.split(/[\s/|,()（）]+/)])
    .filter((n) => n.trim())
    .sort((a, b) => b.length - a.length)
    .reduce((t, n) => t.split(n).join(" "), raw);
  const ok = isTextInLocaleScript(text, lang, isSentence);
  if (!ok) console.warn(`[AI] Dropped ${lang} text in the wrong language`);
  return ok;
}

async function isOverPrimaryLimit() {
  const minute = Math.floor(Date.now() / 60_000);
  const used = await CacheService.increment(`ai:rpm:${MODEL}:${minute}`, 70);
  return used > PRIMARY_RPM;
}

export async function generateJson<T>(
  subject: string,
  contents: string | ContentBlock[],
  schema: Schema,
  systemInstruction = SYSTEM_INSTRUCTION,
  call: CallOptions = SINGLE_CALL,
): Promise<T | null> {
  const models = [...new Set([call.model ?? MODEL, call.fallbackModel])].filter(
    (m): m is string => Boolean(m),
  );
  for (const [i, model] of models.entries()) {
    const hasNext = i < models.length - 1;
    if (model === MODEL && hasNext && (await isOverPrimaryLimit())) {
      console.warn(`[AI] ${MODEL} is over ${PRIMARY_RPM}/min, skipping it`);
      continue;
    }
    const result = await converse<T>(
      model,
      subject,
      contents,
      schema,
      systemInstruction,
      call,
    );
    if (result) return result;
  }
  return null;
}

async function converse<T>(
  model: string,
  subject: string,
  contents: string | ContentBlock[],
  schema: Schema,
  systemInstruction: string,
  call: CallOptions,
): Promise<T | null> {
  try {
    const response = await getClient().send(
      new ConverseCommand({
        modelId: model,
        system: [{ text: systemInstruction }],
        messages: [
          {
            role: "user",
            content:
              typeof contents === "string" ? [{ text: contents }] : contents,
          },
        ],
        inferenceConfig: {
          temperature: call.temperature,
          maxTokens: call.maxTokens,
        },
        toolConfig: {
          tools: [
            {
              toolSpec: {
                name: TOOL_NAME,
                description: `Return the ${subject}`,
                inputSchema: { json: schema } as ToolInputSchema,
              },
            },
          ],
          toolChoice: { tool: { name: TOOL_NAME } },
        },
      }),
      { abortSignal: AbortSignal.timeout(call.timeoutMs) },
    );

    const toolUse = response.output?.message?.content?.find(
      (block) => block.toolUse,
    )?.toolUse;
    return (toolUse?.input as T | undefined) ?? null;
  } catch (err) {
    console.error(`[AI] ${model} failed to generate ${subject}`, err);
    return null;
  }
}

export function perLocaleSchema(
  locales: string[],
  localeFields: Record<string, Schema>,
): Schema {
  return {
    type: Type.OBJECT,
    properties: Object.fromEntries(
      locales.map((lang) => [
        lang,
        {
          type: Type.OBJECT,
          description: `Content in ${LOCALE_NAMES[lang] ?? lang}`,
          properties: localeFields,
          required: Object.keys(localeFields),
        },
      ]),
    ),
    required: locales,
  };
}

export async function translateOnce<T>(
  subject: string,
  sourceLang: string,
  payload: object,
  localeFields: Record<string, Schema>,
): Promise<Record<string, T> | null> {
  const targets = SUPPORTED_LOCALES.filter((l) => l !== sourceLang);
  if (targets.length === 0) return null;

  return generateJson<Record<string, T>>(
    subject,
    `Translate this ${subject} from '${sourceLang}' into: ${targets.join(
      ", ",
    )}.\n\n${JSON.stringify(payload)}`,
    perLocaleSchema(targets, localeFields),
  );
}
