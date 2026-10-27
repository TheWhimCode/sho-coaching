CREATE TYPE "admin"."RecurringItemType" AS ENUM ('task', 'event');

CREATE TYPE "admin"."RecurrenceFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

CREATE TABLE "admin"."RecurringItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "admin"."RecurringItemType" NOT NULL,
    "date" TEXT,
    "time" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "frequency" "admin"."RecurrenceFrequency" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RecurringItem_title_check" CHECK (char_length(btrim("title")) > 0),
    CONSTRAINT "RecurringItem_date_check" CHECK ("date" IS NULL OR "date" ~ '^\d{4}-\d{2}-\d{2}$'),
    CONSTRAINT "RecurringItem_time_check" CHECK ("time" IS NULL OR "time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    CONSTRAINT "RecurringItem_when_check" CHECK ("date" IS NOT NULL OR "time" IS NOT NULL),
    CONSTRAINT "RecurringItem_all_day_check" CHECK ("allDay" = false OR ("time" IS NULL AND "date" IS NOT NULL)),
    CONSTRAINT "RecurringItem_category_check" CHECK ("category" IS NULL OR char_length(btrim("category")) > 0),
    CONSTRAINT "RecurringItem_interval_check" CHECK ("interval" >= 1),
    CONSTRAINT "RecurringItem_weekdays_check" CHECK (
        "weekdays" <@ ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[]
        AND (
            ("frequency" = 'weekly' AND cardinality("weekdays") >= 1)
            OR ("frequency" <> 'weekly' AND cardinality("weekdays") = 0)
        )
    )
);

CREATE INDEX "RecurringItem_date_idx" ON "admin"."RecurringItem"("date");

CREATE INDEX "RecurringItem_category_idx" ON "admin"."RecurringItem"("category");
