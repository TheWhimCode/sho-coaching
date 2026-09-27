CREATE TABLE "admin"."OutsideMeal" (
  "id" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "mealSlot" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "portion" TEXT NOT NULL,
  "nutrition" JSONB NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "source" TEXT NOT NULL DEFAULT 'AI photo estimate',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutsideMeal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "OutsideMeal_date_mealSlot_idx" ON "admin"."OutsideMeal"("date", "mealSlot");
