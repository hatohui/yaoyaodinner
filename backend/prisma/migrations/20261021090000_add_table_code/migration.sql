-- AlterTable
ALTER TABLE "table" ADD COLUMN     "code" VARCHAR(10);

UPDATE "table" SET "code" = lpad(floor(random() * 10000)::int::text, 4, '0');

ALTER TABLE "table" ALTER COLUMN "code" SET NOT NULL;
