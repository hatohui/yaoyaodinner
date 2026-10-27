-- CreateEnum
CREATE TYPE "OrderingStage" AS ENUM ('closed', 'open', 'confirmed', 'finalized');

-- CreateEnum
CREATE TYPE "OrderRound" AS ENUM ('pre', 'dinner');

-- AlterTable
ALTER TABLE "event" ADD COLUMN "ordering_stage" "OrderingStage" NOT NULL DEFAULT 'closed';

-- AlterTable
ALTER TABLE "order" ADD COLUMN "round" "OrderRound" NOT NULL DEFAULT 'pre',
ADD COLUMN "price_edited" BOOLEAN NOT NULL DEFAULT false;

-- Carry the old global "Accept orders" switch over to the live event
UPDATE "event" SET "ordering_stage" = 'open'
WHERE "is_active" = true
  AND EXISTS (SELECT 1 FROM "app_config" WHERE "key" = 'orders.open' AND "value" = 'true');

-- Past events are over
UPDATE "event" SET "ordering_stage" = 'finalized' WHERE "is_active" = false;

DELETE FROM "app_config" WHERE "key" = 'orders.open';
