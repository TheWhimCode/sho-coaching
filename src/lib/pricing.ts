// /lib/pricing.ts
import { z } from "zod";

export const CheckoutZ = z.object({
  slotId: z.string(),
  sessionType: z.string(),
  liveMinutes: z.number().int().min(30).max(120)
    .refine(n => n % 15 === 0, "15-min steps"),
 discordId: z.string().trim().max(64).optional(),
discordName: z.string().trim().max(64).optional(),

  followups: z.number().int().min(0).max(2).optional().default(0),
  // keep liveBlocks in the payload for analytics/metadata,
  // but pricing is based on liveMinutes (= base + 45*liveBlocks)
  liveBlocks: z.number().int().min(0).max(2).optional().default(0),
  holdKey: z.string().optional(),
});

export type CheckoutZ = z.infer<typeof CheckoutZ>;

/**
 * Price ladder:
 * - Base price at 60m = €40
 * - ± €10 per 15m step
 * - + €15 per follow-up
 * NOTE: liveMinutes should already include 45m per live block.
 */
export function computePriceEUR(liveMinutes: number, followups = 0) {
  const mins = Math.min(120, Math.max(30, Math.round(liveMinutes / 15) * 15));
  const fu = Math.min(2, Math.max(0, followups | 0));

  const minutesPrice = 40 + ((mins - 60) / 15) * 10;
  const priceEUR = Math.round(minutesPrice + fu * 15);

  return { priceEUR, amountCents: priceEUR * 100 };
}
