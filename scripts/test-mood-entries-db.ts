import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { moodRatingFields } from "../src/lib/mood-entries";

// Run against PostgreSQL using a session-local temporary copy of the migration.
// No persistent mood records or existing application tables are touched.
async function main() {
  const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set DIRECT_DATABASE_URL or DATABASE_URL for database tests.");
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    const migration = readFileSync(resolve("prisma/migrations/20261027020000_add_mood_entries/migration.sql"), "utf8");
    await client.query(migration.replaceAll('"admin"."MoodEntry"', 'pg_temp."MoodEntry"'));
    let serial = 0;
    async function insert(field: string, value: unknown, recordedAt = "2026-10-21T08:30:15.123Z") {
      return client.query(`INSERT INTO pg_temp."MoodEntry" ("id", "recordedAt", "${field}", "updatedAt") VALUES ($1,$2,$3,NOW()) RETURNING *`, [`test-${serial++}`, recordedAt, value]);
    }
    async function rejected(operation: () => Promise<unknown>, code: string) {
      await client.query("SAVEPOINT invalid_entry");
      try {
        await assert.rejects(operation, (error: { code?: string }) => error.code === code);
      } finally { await client.query("ROLLBACK TO SAVEPOINT invalid_entry"); }
    }
    for (const field of moodRatingFields) {
      for (const value of [1, 5]) await insert(field, value);
      for (const value of [0, 6, -1]) await rejected(() => insert(field, value), "23514");
      await rejected(() => insert(field, "1.5"), "22P02");
    }
    await rejected(() => insert("mood", null), "23514");
    const first = (await insert("mood", 3)).rows[0];
    const second = (await insert("energy", 4, "2026-10-21T20:30:15.123Z")).rows[0];
    const sameInstant = (await insert("stress", 2)).rows[0];
    assert.notEqual(first.id, second.id);
    assert.notEqual(first.id, sameInstant.id);
    assert.equal(first.recordedAt.toISOString(), "2026-10-21T08:30:15.123Z");
    assert.equal(second.recordedAt.toISOString().slice(0,10), "2026-10-21");
    const offset = (await insert("mood", 2, "2026-10-21T10:30:15.123+02:00")).rows[0];
    assert.equal(offset.recordedAt.toISOString(), first.recordedAt.toISOString());
    const edited = await client.query('UPDATE pg_temp."MoodEntry" SET "mood"=NULL, "stress"=5, "note"=$1, "recordedAt"=$2, "updatedAt"=NOW() WHERE "id"=$3 RETURNING *', ["Corrected", "2026-10-20T12:00:00Z", first.id]);
    assert.equal(edited.rows[0].stress,5);
    assert.equal(edited.rows[0].recordedAt.toISOString(),"2026-10-20T12:00:00.000Z");
    await rejected(() => client.query('UPDATE pg_temp."MoodEntry" SET "stress"=NULL WHERE "id"=$1',[first.id]), "23514");
    console.log("MoodEntry PostgreSQL constraints, repeat entries, UTC timestamps, and edits passed (temporary table only).");
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}
main().catch(() => { console.error("MoodEntry database tests failed."); process.exitCode = 1; });
