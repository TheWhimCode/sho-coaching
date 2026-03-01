/**
 * One-time repair: align _prisma_migrations with renamed/edited migration folders.
 * Run from project root: node prisma/repair-migration-history.mjs
 * Requires: DATABASE_URL in env (e.g. from .env in project root).
 *
 * What it does:
 * 1. Removes old migration names the DB has but folders were renamed (20250128, 202512XX, 20251227).
 * 2. Updates checksum for 20251227030003_add_submit_ip to match the current file (we edited it).
 * 3. Inserts rows for the renamed migrations so they count as "already applied" (no re-run).
 */

import "dotenv/config";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "migrations");

function sha256(path) {
  const content = readFileSync(path, "utf8");
  return createHash("sha256").update(content).digest("hex");
}

async function main() {
  const prisma = new PrismaClient();

  const oldNames = [
    "20250128_add_champions_to_session",
    "202512XX_add_draft",
    "20251227_add_submit_ip",
  ];

  const newRows = [
    {
      migration_name: "20251204130000_add_champions_to_session",
      path: "20251204130000_add_champions_to_session/migration.sql",
    },
    {
      migration_name: "20251226120000_add_draft",
      path: "20251226120000_add_draft/migration.sql",
    },
    {
      migration_name: "20251227040000_add_draft_submit_ip",
      path: "20251227040000_add_draft_submit_ip/migration.sql",
    },
  ];

  console.log("Deleting old migration records...");
  for (const name of oldNames) {
    const r = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE migration_name = $1`,
      name
    );
    console.log(`  ${name}: ${r} row(s) removed`);
  }

  console.log("Updating checksum for 20251227030003_add_submit_ip...");
  const checksum303 = sha256(
    join(migrationsDir, "20251227030003_add_submit_ip/migration.sql")
  );
  const r2 = await prisma.$executeRawUnsafe(
    `UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = $2`,
    checksum303,
    "20251227030003_add_submit_ip"
  );
  console.log(`  ${r2} row(s) updated`);

  console.log("Inserting new migration records (as already applied)...");
  const now = new Date().toISOString();
  for (const { migration_name, path } of newRows) {
    const fullPath = join(migrationsDir, path);
    const checksum = sha256(fullPath);
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
         VALUES (gen_random_uuid(), $1, $2::timestamptz, $3, NULL, NULL, $2::timestamptz, 1)`,
        checksum,
        now,
        migration_name
      );
      console.log(`  ${migration_name}: inserted`);
    } catch (err) {
      if (err?.code === "23505") console.log(`  ${migration_name}: already present, skip`);
      else throw err;
    }
  }

  console.log("\nFixing Session.scheduledStart type (drift: TIMESTAMP(6) vs TIMESTAMP(3))...");
  try {
    const triggerDef = await prisma.$queryRawUnsafe(`
      SELECT pg_get_triggerdef(t.oid, true) AS def
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'Session' AND t.tgname = 'trg_notify_session_rescheduled'
    `).then((rows) => rows?.[0]?.def ?? null);
    if (triggerDef) {
      await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS trg_notify_session_rescheduled ON "Session"`);
    }
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Session" ALTER COLUMN "scheduledStart" SET DATA TYPE TIMESTAMP(3)`
    );
    if (triggerDef) await prisma.$executeRawUnsafe(triggerDef);
    console.log("  scheduledStart set to TIMESTAMP(3).");
  } catch (e) {
    if (e?.message?.includes("type") || e?.code === "42804") console.log("  (column type already correct or error – continue anyway)");
    else console.warn("  ", e?.message || e);
  }

  await prisma.$disconnect();
  console.log("\nDone. Run: npx prisma migrate dev --name add_item_stat");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
