// /lib/pricing.ts
import { z } from "zod";

//
// Schema used on checkout form submission
//
export const CheckoutZ = z.object({
  slotId: z.string(),

  sessionType: z.enum([
    "vod",
    "instant",
    "signature",
    "custom",
    "bootcamp",
  ]),

  productType: z.enum(["normal", "bundle"]).default("normal"),

  liveMinutes: z.number().int().min(30).max(120)
    .refine(n => n % 15 === 0, "15-min steps"),

  discordId: z.string().trim().max(64).optional(),
  discordName: z.string().trim().max(64).optional(),

  followups: z.number().int().min(0).max(2).optional().default(0),

  // analytics support – pricing still uses liveMinutes
  liveBlocks: z.number().int().min(0).max(2).optional().default(0),

  holdKey: z.string().optional(),
})
.superRefine((data, ctx) => {
  // enforce bootcamp restriction
  if (data.sessionType === "bootcamp" && data.productType !== "bundle") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bootcamp can only be purchased as a bundle",
      path: ["productType"],
    });
  }
});

export type CheckoutZ = z.infer<typeof CheckoutZ>;

/**
 * Bundle pricing table
 * readable and future-safe
 */
const BUNDLE_PRICE_EUR: Record<string, number> = {
  bootcamp: 110,
  // future:
  // mastery: 150,
};

/**
 * Normal price ladder:
 * - Base price at 60m = €40
 * - ± €10 per 15m step
 * - + €15 per follow-up
 */
export function computePriceEUR(
  liveMinutes: number,
  followups = 0,
  productType: "normal" | "bundle" = "normal",
  sessionType?: string
) {

  //
  // Bootcamp = bundle override
  //
  if (sessionType === "bootcamp") {
    const price = BUNDLE_PRICE_EUR.bootcamp;
    return { priceEUR: price, amountCents: price * 100 };
  }

  //
  // fallback normal pricing
  //
  const mins = Math.min(120, Math.max(30, Math.round(liveMinutes / 15) * 15));
  const fu = Math.min(2, Math.max(0, followups | 0));

  const minutesPrice = 40 + ((mins - 60) / 15) * 10;
  const priceEUR = Math.round(minutesPrice + fu * 15);

  return { priceEUR, amountCents: priceEUR * 100 };
}
