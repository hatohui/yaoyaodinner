-- CreateTable
CREATE TABLE "event_seasonal_price" (
    "event_id" VARCHAR(255) NOT NULL,
    "variant_id" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "event_seasonal_price_pkey" PRIMARY KEY ("event_id","variant_id")
);

-- AddForeignKey
ALTER TABLE "event_seasonal_price" ADD CONSTRAINT "event_seasonal_price_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_seasonal_price" ADD CONSTRAINT "event_seasonal_price_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "food_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
