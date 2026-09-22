-- Add is_recommended flag to food (staff-picked dishes highlighted in the menu
-- alongside the order-count driven "popular" tag)
ALTER TABLE "food" ADD COLUMN "is_recommended" BOOLEAN NOT NULL DEFAULT false;
