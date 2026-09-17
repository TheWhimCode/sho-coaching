ALTER TABLE "public"."SocialIdea"
ADD COLUMN "checklist" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "plannedDate" TEXT;
