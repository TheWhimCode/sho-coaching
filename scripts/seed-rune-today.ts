/**
 * One-off: seed today's RuneDaily by sampling master+ games.
 * Usage: npx tsx scripts/seed-rune-today.ts
 * Requires: .env with DATABASE_URL and RIOT_API_KEY
 */
import "dotenv/config";
import { ensureRuneDailyForDay } from "../src/lib/skillcheck/ensureRuneDaily";

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

async function main() {
  const dayKey = ymdUTC(new Date());
  console.log("Seeding rune daily for dayKey:", dayKey);
  const result = await ensureRuneDailyForDay(dayKey);
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
