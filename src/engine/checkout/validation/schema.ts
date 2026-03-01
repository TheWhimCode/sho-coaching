// engine/checkout/validation/schema.ts
// Zod schema for checkout/booking request bodies (API validation).

import { z } from "zod";

export const CheckoutZ = z.object({
  slotId: z.string(),
  sessionType: z.string(),
  liveMinutes: z
    .number()
    .int()
    .min(30)
    .max(120)
    .refine((n) => n % 15 === 0, "15-min steps"),
  discordId: z.string().trim().max(64).optional(),
  discordName: z.string().trim().max(64).optional(),
  followups: z.number().int().min(0).max(2).optional().default(0),
  liveBlocks: z.number().int().min(0).max(2).optional().default(0),
  holdKey: z.string().optional(),
});

export type CheckoutZ = z.infer<typeof CheckoutZ>;
