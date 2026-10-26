-- CreateTable
CREATE TABLE "preset_menu_translation" (
    "preset_id" VARCHAR(255) NOT NULL,
    "language" VARCHAR(10) NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "preset_menu_translation_pkey" PRIMARY KEY ("preset_id","language")
);

-- AddForeignKey
ALTER TABLE "preset_menu_translation" ADD CONSTRAINT "preset_menu_translation_preset_id_fkey" FOREIGN KEY ("preset_id") REFERENCES "preset_menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preset_menu_translation" ADD CONSTRAINT "preset_menu_translation_language_fkey" FOREIGN KEY ("language") REFERENCES "language"("code") ON DELETE CASCADE ON UPDATE CASCADE;
