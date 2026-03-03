-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "axom";

-- CreateTable
CREATE TABLE "axom"."events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "for" TEXT NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
