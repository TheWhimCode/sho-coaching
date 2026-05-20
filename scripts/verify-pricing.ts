/**
 * Smoke-check pricing math (run: npx tsx scripts/verify-pricing.ts)
 * Uses PRICING_DISCOUNT_PERCENT from .env.local when present.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { computePriceEUR } from "../src/engine/session/rules/pricing";
import { computePriceWithProduct } from "../src/engine/session/rules/product";
import { resolveBookingAmountCents } from "../src/engine/session/rules/resolveBookingPrice";
import { clamp } from "../src/engine/session/config/session";

const pct = process.env.PRICING_DISCOUNT_PERCENT ?? "0";
console.log(`PRICING_DISCOUNT_PERCENT=${pct}\n`);

type Case = { label: string; cents: number; expected: number };
const cases: Case[] = [];

function check(label: string, cents: number, expectedEUR: number) {
  cases.push({ label, cents, expected: Math.round(expectedEUR * 100) });
}

// List: €10/15m live, €15/follow-up; 25% promo on live only
check("30m live", computePriceEUR(30, 0).amountCents, pct === "25" ? 15 : 20);
check("45m live", computePriceEUR(45, 0).amountCents, pct === "25" ? 22.5 : 30);
check("60m live", computePriceEUR(60, 0).amountCents, pct === "25" ? 30 : 40);
check("60m + 1 FU", computePriceEUR(60, 1).amountCents, pct === "25" ? 45 : 55);
check("45m + 1 FU (signature)", computePriceEUR(45, 1).amountCents, pct === "25" ? 37.5 : 45);

const rush = computePriceWithProduct(
  clamp({ liveMin: 60, liveBlocks: 0, followups: 0, productId: "rush" })
);
check("Elo Rush bundle", rush.amountCents, 90);

check(
  "resolve 60m+block via booking",
  resolveBookingAmountCents({ liveMinutes: 105, followups: 0, liveBlocks: 1 }),
  pct === "25" ? 52.5 : 70
);

let failed = 0;
for (const c of cases) {
  const ok = c.cents === c.expected;
  console.log(`${ok ? "✓" : "✗"} ${c.label}: ${c.cents}c (expected ${c.expected}c)`);
  if (!ok) failed++;
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log("\nAll pricing checks passed.");
