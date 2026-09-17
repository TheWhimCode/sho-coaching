ALTER TABLE "public"."SocialIdea" ADD COLUMN "placedAt" TIMESTAMP(3);
UPDATE "public"."SocialIdea" SET "placedAt" = "updatedAt" WHERE "plannedDate" IS NOT NULL;
