ALTER TABLE "food_translation" ADD COLUMN "is_name_ai_generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "is_description_ai_generated" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "food_variant_translation" ADD COLUMN "is_ai_generated" BOOLEAN NOT NULL DEFAULT false;
