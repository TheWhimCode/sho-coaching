import { z } from "zod";

export const CheckoutZ = z.object({
  slotId: z.string(),
  sessionType: z.string(),
  liveMinutes: z.number().int().min(30).max(120).refine(n => n % 15 === 0, "15-min steps"),
  discord: z.string().trim().max(64).optional().default(""),
  inGame: z.boolean().optional().default(false),
  followups: z.number().int().min(0).max(2).optional().default(0),
  liveBlocks: z.number().int().min(0).max(2).optional().default(0),
  holdKey: z.string().optional(),                 
});

export type CheckoutZ = z.infer<typeof CheckoutZ>;

export function computePriceEUR(liveMinutes: number, followups = 0) {
  const mins = Math.min(120, Math.max(30, Math.round(liveMinutes / 15) * 15));
  const fu = Math.min(2, Math.max(0, followups | 0));
  const base = 40 + ((mins - 60) / 15) * 10;
  const priceEUR = Math.round(base + fu * 15);
  return { priceEUR, amountCents: priceEUR * 100 };
}
