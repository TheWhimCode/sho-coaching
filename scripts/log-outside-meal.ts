import { readFileSync } from 'node:fs';
import { config } from 'dotenv';

// Match Next's environment precedence without printing credentials.
config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: npx tsx scripts/log-outside-meal.ts <meal.json> [--dry-run]');
  const { outsideMealSchema } = await import('../src/lib/outside-meals');
  const input = outsideMealSchema.parse(JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, '')));
  if (process.argv.includes('--dry-run')) {
    console.log(`Valid: ${input.name} (${input.date}, ${input.mealSlot}, ${input.amount} × ${input.portion}). No data saved.`);
    return;
  }
  const { prisma } = await import('../src/lib/prisma');
  try {
    const { saveOutsideMeal } = await import('../src/lib/outside-meals-store');
    const saved = await saveOutsideMeal(input);
    console.log(`Saved ${saved.id}: ${saved.name} (${saved.date}, ${saved.mealSlot}).`);
  } finally { await prisma.$disconnect(); }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Could not log meal.');
  process.exitCode = 1;
});
