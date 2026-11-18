-- AlterTable
ALTER TABLE "table_wish" ADD COLUMN "added_by_id" VARCHAR(255),
ADD COLUMN "added_by_name" VARCHAR(255);

-- CreateIndex
CREATE INDEX "table_audit_table_id_created_at_idx" ON "table_audit"("table_id", "created_at");
