ALTER TABLE "admin"."SocialIdea" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "platform" ORDER BY "createdAt" DESC) - 1 AS "sortOrder"
  FROM "admin"."SocialIdea"
)
UPDATE "admin"."SocialIdea" AS idea
SET "sortOrder" = ordered."sortOrder"
FROM ordered
WHERE idea."id" = ordered."id";

CREATE INDEX "SocialIdea_platform_sortOrder_idx" ON "admin"."SocialIdea"("platform", "sortOrder");
