CREATE TABLE "public"."SocialIdea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idea',
    "dueDate" TEXT,
    "reference" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SocialIdea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialIdea_createdAt_idx" ON "public"."SocialIdea"("createdAt");
