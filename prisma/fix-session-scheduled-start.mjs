/**
 * One-off: align Session.scheduledStart with migration history (TIMESTAMP(3)).
 * Drops trigger trg_notify_session_rescheduled, alters column, recreates trigger.
 * Run: node prisma/fix-session-scheduled-start.mjs
 * Then: npx prisma migrate dev --name add_item_stat
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1) Get trigger definition so we can recreate it after altering the column
const triggerDef = await prisma.$queryRawUnsafe(`
  SELECT pg_get_triggerdef(t.oid, true) AS def
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'Session' AND t.tgname = 'trg_notify_session_rescheduled'
`).then((rows) => rows?.[0]?.def ?? null);

if (triggerDef) {
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_notify_session_rescheduled ON "Session"`);
  console.log("Dropped trigger trg_notify_session_rescheduled");
}

await prisma.$executeRawUnsafe(
  `ALTER TABLE "Session" ALTER COLUMN "scheduledStart" SET DATA TYPE TIMESTAMP(3)`
);
console.log("Session.scheduledStart set to TIMESTAMP(3).");

if (triggerDef) {
  await prisma.$executeRawUnsafe(triggerDef);
  console.log("Recreated trigger trg_notify_session_rescheduled");
}

console.log("Run: npx prisma migrate dev --name add_item_stat");
await prisma.$disconnect();
