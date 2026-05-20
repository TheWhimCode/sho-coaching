// Server-side booking / checkout amount from stored session fields.

import type { ProductId } from "../model/product";
import { clamp } from "../config/session";
import { computePriceWithProduct } from "./product";

export type BookingPriceInput = {
  /** Total scheduled minutes (base + live blocks), as stored on Session.liveMinutes. */
  liveMinutes: number;
  followups: number;
  liveBlocks?: number;
  productId?: ProductId | null;
};

/**
 * Derive base live minutes when only total minutes + block count are known.
 */
export function baseMinutesFromTotal(
  totalMinutes: number,
  liveBlocks: number
): number {
  if (liveBlocks <= 0) return totalMinutes;
  return Math.max(30, totalMinutes - liveBlocks * 45);
}

/** Authoritative charge in cents (site promo + product overrides applied). */
export function resolveBookingAmountCents(input: BookingPriceInput): number {
  const liveBlocks = input.liveBlocks ?? 0;
  const session = clamp({
    liveMin: baseMinutesFromTotal(input.liveMinutes, liveBlocks),
    liveBlocks,
    followups: input.followups,
    productId: input.productId ?? undefined,
  });
  return computePriceWithProduct(session).amountCents;
}

/** Booking charge minus coupon (EUR discount stored on Session.couponDiscount). */
export function resolveBookingAmountCentsAfterCoupon(
  input: BookingPriceInput & { couponDiscountEUR?: number }
): number {
  const base = resolveBookingAmountCents(input);
  const discountCents = Math.round((input.couponDiscountEUR ?? 0) * 100);
  return Math.max(base - discountCents, 0);
}
