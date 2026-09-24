ALTER TABLE "admin"."Recipe"
ADD COLUMN "familyKey" TEXT,
ADD COLUMN "familyTitle" TEXT,
ADD COLUMN "variantLabel" TEXT;

CREATE INDEX "Recipe_familyKey_idx" ON "admin"."Recipe"("familyKey");
