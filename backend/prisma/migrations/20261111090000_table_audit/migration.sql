-- CreateTable
CREATE TABLE "table_audit" (
    "id" VARCHAR(255) NOT NULL,
    "action" VARCHAR(32) NOT NULL,
    "actor" VARCHAR(16) NOT NULL,
    "table_id" VARCHAR(255),
    "event_id" VARCHAR(255),
    "table_no" INTEGER,
    "table_name" VARCHAR(255),
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "table_audit_created_at_idx" ON "table_audit"("created_at");

-- CreateIndex
CREATE INDEX "table_audit_event_id_created_at_idx" ON "table_audit"("event_id", "created_at");
