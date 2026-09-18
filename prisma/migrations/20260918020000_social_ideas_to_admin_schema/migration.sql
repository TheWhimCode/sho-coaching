-- Isolate the admin planning board from coaching tables in public.
CREATE SCHEMA IF NOT EXISTS "admin";

CREATE TABLE "admin"."SocialIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "dueDate" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "plannedDate" TEXT,
    "placedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialIdea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialIdea_createdAt_idx" ON "admin"."SocialIdea"("createdAt");

INSERT INTO "admin"."SocialIdea" (
    "id",
    "title",
    "notes",
    "platform",
    "status",
    "dueDate",
    "reference",
    "checklist",
    "plannedDate",
    "placedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "title",
    "notes",
    "platform",
    "status",
    "dueDate",
    "reference",
    "checklist",
    "plannedDate",
    "placedAt",
    "createdAt",
    "updatedAt"
FROM "public"."SocialIdea";

DROP TABLE "public"."SocialIdea";
