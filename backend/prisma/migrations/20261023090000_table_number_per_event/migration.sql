-- AlterTable
ALTER TABLE "table" ADD COLUMN     "no" INTEGER;

UPDATE "table" t SET "no" = ranked.rn
FROM (
  SELECT tb.id,
         row_number() OVER (
           PARTITION BY tb.is_staging, tb.event_id
           ORDER BY s.no NULLS LAST, tb.id
         ) AS rn
  FROM "table" tb
  LEFT JOIN "table_slot" s ON s.id = tb.slot_id
) ranked
WHERE t.id = ranked.id;

ALTER TABLE "table" ALTER COLUMN "no" SET NOT NULL;

-- CreateIndex
CREATE INDEX "table_event_id_no_idx" ON "table"("event_id", "no");
