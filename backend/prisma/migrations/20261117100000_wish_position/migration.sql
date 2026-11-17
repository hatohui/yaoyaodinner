-- AlterTable
ALTER TABLE "table_wish" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing wishes per (table_id, kind) in creation order
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY table_id, kind ORDER BY created_at ASC) - 1 AS pos
  FROM "table_wish"
)
UPDATE "table_wish" w
SET "position" = ranked.pos
FROM ranked
WHERE w.id = ranked.id;
