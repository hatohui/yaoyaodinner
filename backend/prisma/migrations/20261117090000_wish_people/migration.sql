-- CreateTable
CREATE TABLE "table_wish_person" (
    "wish_id" VARCHAR(255) NOT NULL,
    "person_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "table_wish_person_pkey" PRIMARY KEY ("wish_id","person_id")
);

-- CreateIndex
CREATE INDEX "table_wish_person_person_id_idx" ON "table_wish_person"("person_id");

-- AddForeignKey
ALTER TABLE "table_wish_person" ADD CONSTRAINT "table_wish_person_wish_id_fkey" FOREIGN KEY ("wish_id") REFERENCES "table_wish"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_wish_person" ADD CONSTRAINT "table_wish_person_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
