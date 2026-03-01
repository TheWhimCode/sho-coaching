// engine/checkout/booking/buildBookingCreateBody.ts
// Build the request body for POST /api/booking/create.

import type { Payload } from "../model/types";

export type BookingCreateContact = {
  studentId: string | null;
  riotTag: string;
  discordId: string | null;
  discordName: string | null;
  notes: string;
};

export type BookingCreateCoupon = {
  code: string | null;
  discount: number;
};

/**
 * Body sent to /api/booking/create.
 */
export type BookingCreateBody = {
  studentId: string | null;
  sessionType: string;
  slotId: string;
  liveMinutes: number;
  followups: number;
  riotTag: string;
  discordId: string | null;
  discordName: string | null;
  notes: string;
  waiverAccepted: boolean;
  couponCode: string | null;
  couponDiscount: number;
  holdKey: string;
  productId: string | null;
  champions: string[];
};

/**
 * Build the JSON body for POST /api/booking/create from payload + contact + waiver + coupon + champions.
 */
export function buildBookingCreateBody(
  payload: Pick<Payload, "slotId" | "holdKey" | "productId" | "followups">,
  sessionBlockTitle: string,
  totalLiveMinutes: number,
  contact: BookingCreateContact,
  waiver: boolean,
  coupon: BookingCreateCoupon,
  champions: string[]
): BookingCreateBody {
  return {
    studentId: contact.studentId ?? null,
    sessionType: sessionBlockTitle,
    slotId: payload.slotId,
    liveMinutes: totalLiveMinutes,
    followups: payload.followups,
    riotTag: contact.riotTag,
    discordId: contact.discordId ?? null,
    discordName: contact.discordName ?? null,
    notes: contact.notes,
    waiverAccepted: waiver,
    couponCode: coupon.code ?? null,
    couponDiscount: coupon.discount,
    holdKey: payload.holdKey,
    productId: payload.productId ?? null,
    champions,
  };
}
