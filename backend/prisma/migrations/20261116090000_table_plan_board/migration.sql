-- CreateEnum
CREATE TYPE "WishKind" AS ENUM ('must', 'want');

-- CreateTable
CREATE TABLE "table_wish" (
    "id" VARCHAR(255) NOT NULL,
    "table_id" VARCHAR(255) NOT NULL,
    "variant_id" VARCHAR(255),
    "label" VARCHAR(255),
    "kind" "WishKind" NOT NULL DEFAULT 'want',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_wish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_allergy" (
    "id" VARCHAR(255) NOT NULL,
    "person_id" VARCHAR(255) NOT NULL,
    "allergen" VARCHAR(32) NOT NULL,
    "label" VARCHAR(100),

    CONSTRAINT "person_allergy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "table_wish_table_id_idx" ON "table_wish"("table_id");

-- CreateIndex
CREATE INDEX "person_allergy_person_id_idx" ON "person_allergy"("person_id");

-- AddForeignKey
ALTER TABLE "table_wish" ADD CONSTRAINT "table_wish_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_wish" ADD CONSTRAINT "table_wish_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "food_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_allergy" ADD CONSTRAINT "person_allergy_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
