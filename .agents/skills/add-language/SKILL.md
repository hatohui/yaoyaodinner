---
name: add-language
description: >-
  Guides adding a new UI and content localization language across the YaoYao Dinner
  backend, database schema/migrations, AI translation pipeline, frontend i18n, and
  Cloudflare Pages metadata functions. Use when adding support for a new locale.
---

# Adding a New Language to YaoYao Dinner

Follow every step below so UI strings, database rows, glossary fields, AI content checks, and edge metadata stay in sync. Never add a locale only to `SUPPORTED_LOCALES` without a database migration and script-validation rule, or batch AI fill jobs will fail on foreign-key checks or drop generated text.

## 1. Backend Locale Registry (`backend/src/common/locales.ts`)

Update the centralized locale configuration in `backend/src/common/locales.ts`:

1. Append the ISO 639-1 code to `SUPPORTED_LOCALES`.
2. Add `{ code, name, direction }` to `LANGUAGE_ROWS` (used by `AiService` and `LanguageService` to upsert rows into the `language` table).
3. Add the English language name to `LOCALE_NAMES` (used in AI tool schemas and instructions).
4. Add unit translations (`pcs`, `pax`, `pairs`) to `UNITS` and fixed label translations (`per portion`, `per person`, `regular`, `small`, `large`) to `PHRASES`.
5. Update `isTextInLocaleScript(text, lang, isSentence)` so the AI language validator accepts the new language's script (for example, add Unicode block regex checks or diacritic checks) and rejects cross-script hallucinations.

## 2. Database Schema, Migration & Seed (`backend/prisma/`)

Deployment runs `bun run prisma:migrate:deploy` without running `prisma db seed`, so a SQL migration is mandatory:

1. Create a timestamped migration in `backend/prisma/migrations/<timestamp>_add_<language>/migration.sql`:
   ```sql
   INSERT INTO "language" ("code", "name", "direction")
   VALUES ('<code>', '<Native Name>', '<LTR|RTL>')
   ON CONFLICT ("code") DO NOTHING;

   ALTER TABLE "glossary_term" ADD COLUMN IF NOT EXISTS "<code>" VARCHAR(255);
   ```
2. Add `<code> String? @db.VarChar(255)` to `model GlossaryTerm` in `backend/prisma/schema.prisma`.
3. Add `{ code, name, direction }` to `languages` in `seedLanguages()` inside `backend/prisma/seed.ts`.
4. Run `bun run prisma:generate` in `backend/` to regenerate Prisma client types.

## 3. Backend AI & Glossary Modules (`backend/src/`)

1. In `backend/src/libs/ai.ts`, add the new column to `Term` (`Pick<GlossaryTerm, ...>`) and `loadGlossary()`'s Prisma `select` object.
2. In `backend/src/modules/glossary/dto/glossary.dto.ts`, add the field to `GlossaryTermDto` and `SaveGlossaryTermDto`.
3. In `backend/src/modules/glossary/glossary.service.ts`, add the locale code to `FIELDS` and `TERM_SELECT`.

## 4. Frontend i18n, Glossary UI & API Models (`frontend/src/` & `frontend/public/`)

1. Create `frontend/public/languages/<code>.json` by translating all keys from `frontend/public/languages/en.json`.
2. Add `<code>: string` under `admin.glossary.fields` in `frontend/src/i18next.d.ts` and add the translated field name under `admin.glossary.fields` in every `frontend/public/languages/*.json` file.
3. Add the code to `supportedLngs` in both `initI18n` and `changeLanguage` inside `frontend/src/config/i18n.tsx`.
4. Add `{ code, name }` to `LANGUAGES` in `frontend/src/components/common/LanguageSelector.tsx` and `languages` in `frontend/src/pages/dev/@LanguageTestCard.tsx`.
5. Add the code to `TARGET_LANGS` in `frontend/src/components/common/ManualTranslationDialog.tsx`.
6. Update the Glossary UI in `frontend/src/pages/admin/glossary/`:
   - Add the code to `GLOSSARY_LANG_FIELDS` in `@useGlossary.ts`.
   - Adjust the responsive `sm:grid-cols-[repeat(<N>,minmax(0,1fr))_minmax(0,1.5fr)_auto]` column count in `@AddGlossaryTerm.tsx` and `@GlossaryRow.tsx` to match `GLOSSARY_LANG_FIELDS.length`.
7. Regenerate frontend Orval API types (`bun run api:generate` in `frontend/` while backend runs), or update `SaveFoodLocaleDtoLang`, `PlanTableDtoLang`, `RoastTableDtoLang`, `GlossaryTermDto`, and `SaveGlossaryTermDto` under `frontend/src/api/model/`.

## 5. Cloudflare Pages Edge Functions (`frontend/functions/`)

1. Update `SupportedLang`, `SUPPORTED_LANGS`, and `LOCALE_MAP` in `frontend/functions/_shared.ts`.
2. Add localized copy for the new language in:
   - `LANDING_COPY` in `frontend/functions/index.ts`
   - `FEEDBACK_TITLES` and `FEEDBACK_DESCRIPTIONS` in `frontend/functions/feedback.ts`
   - `FOOD_LABELS` in `frontend/functions/menu/[id].ts`
   - `formatTableMeta` switch statement in `frontend/functions/tables/[id].ts`

## 6. Verification

1. In `backend/`: run `bun run prisma:generate` and `bun run build`.
2. In `frontend/`: run `bun run build`, `bunx tsc --noEmit`, and `bunx eslint` on the edited TypeScript files.
3. Verify `isTextInLocaleScript` accepts sample names and sentences in the new language while rejecting other scripts.
4. After deployment/migration, check Content Health (`/api/content-health` and `/api/languages/codes`) and run a single-item and batch AI fill to confirm translations persist without foreign-key or validation drops.
