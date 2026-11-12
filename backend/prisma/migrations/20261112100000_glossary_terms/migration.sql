CREATE TABLE "glossary_term" (
    "id" VARCHAR(255) NOT NULL,
    "en" VARCHAR(255),
    "vi" VARCHAR(255),
    "zh" VARCHAR(255),
    "th" VARCHAR(255),
    "note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_term_pkey" PRIMARY KEY ("id")
);
