-- AlterTable (runs after add_draft so Draft table exists)
ALTER TABLE "Draft" ADD COLUMN IF NOT EXISTS "submitIp" TEXT;
