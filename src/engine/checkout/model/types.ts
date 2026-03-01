// engine/checkout/model/types.ts
// Checkout domain types — single source of truth for payload, payment method, and related shapes.

import type { ProductId } from "@/engine/session/model/product";

/** Payment method for checkout (empty string = not yet selected). */
export type PayMethod = "" | "card" | "paypal" | "revolut_pay" | "klarna";

/** Checkout payload derived from URL / client state. */
export type Payload = {
  slotId: string;
  slotIds?: string;
  sessionType: string;
  baseMinutes: number;
  liveMinutes: number;
  followups: number;
  liveBlocks: number;
  preset: string;
  holdKey: string;
  startTime?: string | number;
  productId?: ProductId | null;
  discordId?: string;
  discordName?: string;
};

/** Subset of Payload (and startTime) sent to backend / API. */
export type PayloadForBackend = Pick<
  Payload,
  | "slotId"
  | "slotIds"
  | "sessionType"
  | "liveMinutes"
  | "followups"
  | "liveBlocks"
  | "preset"
  | "holdKey"
  | "productId"
  | "discordId"
  | "discordName"
> & {
  startTime?: string | number | Date;
};

/** Discord identity from OAuth / lookup. */
export type DiscordIdentity = { id: string; username?: string | null };

/** Saved card summary (e.g. from Stripe). */
export type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

/** Default payload for merging with URL / client payload. */
export const DEFAULT_PAYLOAD: Payload = {
  slotId: "",
  sessionType: "",
  baseMinutes: 60,
  liveMinutes: 60,
  followups: 0,
  liveBlocks: 0,
  preset: "",
  holdKey: "",
};
