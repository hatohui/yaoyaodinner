INSERT INTO "language" ("code", "name", "direction")
VALUES
  ('en', 'English', 'LTR'),
  ('vi', 'Tiếng Việt', 'LTR'),
  ('zh', '中文', 'LTR'),
  ('th', 'ภาษาไทย', 'LTR'),
  ('ja', '日本語', 'LTR')
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "glossary_term" ADD COLUMN IF NOT EXISTS "ja" VARCHAR(255);
