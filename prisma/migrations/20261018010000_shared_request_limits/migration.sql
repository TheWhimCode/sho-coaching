CREATE TABLE "public"."RequestLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "RequestLimit_pkey" PRIMARY KEY ("key")
);
