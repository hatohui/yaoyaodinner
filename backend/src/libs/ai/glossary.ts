import type { GlossaryTerm } from "@prisma/client";
import { SUPPORTED_LOCALES } from "@common/locales";
import { prisma } from "../prisma";

export type Term = Pick<GlossaryTerm, "en" | "vi" | "zh" | "th" | "ja" | "note">;

const GLOSSARY_TTL_MS = 30_000;
let glossaryCache: { at: number; terms: Term[] } | null = null;

export function clearGlossaryCache() {
  glossaryCache = null;
}

export async function loadGlossary(): Promise<Term[]> {
  if (glossaryCache && Date.now() - glossaryCache.at < GLOSSARY_TTL_MS)
    return glossaryCache.terms;
  const terms = await prisma.glossaryTerm.findMany({
    select: { en: true, vi: true, zh: true, th: true, ja: true, note: true },
  });
  glossaryCache = { at: Date.now(), terms };
  return terms;
}

const LATIN = /^[\p{Script=Latin}\d\s'-]+$/u;

function mentions(text: string, word: string) {
  if (!LATIN.test(word)) return text.includes(word);
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "iu").test(text);
}

export function matchTerms(
  terms: Term[],
  texts: (string | null | undefined)[],
) {
  const haystack = texts.filter(Boolean) as string[];
  return terms.filter((term) =>
    SUPPORTED_LOCALES.some((lang) => {
      const word = term[lang as keyof Term]?.trim();
      return word && haystack.some((text) => mentions(text, word));
    }),
  );
}

export function compactTerm(term: Term) {
  return Object.fromEntries(
    Object.entries(term).filter(([, value]) => value?.trim()),
  );
}

export function keepsTerms(
  name: string,
  lang: string,
  terms: Term[],
  reasons?: string[],
) {
  const missing = terms.filter((term) => {
    const word = term[lang as keyof Term]?.trim();
    return word && !mentions(name, word);
  });
  if (missing.length > 0) {
    const words = missing
      .map((t) => t[lang as keyof Term]?.trim())
      .filter(Boolean)
      .join(", ");
    console.warn(`[AI] Dropped ${lang} name that ignored the glossary (${words})`);
    reasons?.push(`${lang} name missed glossary term (${words})`);
  }
  return missing.length === 0;
}
