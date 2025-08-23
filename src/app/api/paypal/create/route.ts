import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import {
  getBlockIdsByTime,
  SLOT_SIZE_MIN,
} from "@/lib/booking/block";
import { paypalCreateOrder } from "@/lib/paypal";
import { CFG_PUBLIC } from "@/lib/config.public";
import { CFG_SERVER } from "@/lib/config.server";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

// base64url helpers for compact custom_id
function toBase64Url(s: string) {
  return Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function encodeMetaShort(meta: {
  a: string; // slotId
  m: number; // unified liveMinutes
  t: string; // sessionType
  d: string; // discord
  g: boolean; // inGame
  f: number; // followups
  l: number; // liveBlocks
  p: number; // priceEUR
}) {
  const b64u = toBase64Url(JSON.stringify(meta));
  return b64u.length <= 127 ? b64u : b64u.slice(0, 127);
}
function makeRequestId(slotId: string, amountCents: number) {
  return `${slotId}-${amountCents}-paypal`.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40);
}

export async function POST(req: Request) {
  try {
    const {
      slotId,
      sessionType,
      liveMinutes,
      discord,
      inGame,
      followups,
      liveBlocks = 0,
      holdKey,
    } = CheckoutZ.parse(await req.json());

    // 1) Load anchor slot and accept our own hold
    const anchor = await prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true, startTime: true, status: true, holdKey: true },
    });
    if (!anchor) return NextResponse.json({ error: "slot_missing" }, { status: 409 });
    if (anchor.status === SlotStatus.taken) {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    if (anchor.status === SlotStatus.blocked && anchor.holdKey && holdKey && anchor.holdKey !== holdKey) {
      return NextResponse.json({ error: "slot_held_by_other" }, { status: 409 });
    }

    const effKey = holdKey || anchor.holdKey || crypto.randomUUID();

    // 2) Try FREE-only helper first
    let slotIds = await getBlockIdsByTime(anchor.startTime, liveMinutes, prisma);

    // 3) Fallback: allow rows blocked by *our* holdKey
    if (!slotIds) {
      const { BUFFER_BEFORE_MIN, BUFFER_AFTER_MIN } = CFG_SERVER.booking;
      const windowStart = new Date(anchor.startTime.getTime() - BUFFER_BEFORE_MIN * 60_000);
      const windowEnd = new Date(anchor.startTime.getTime() + (liveMinutes + BUFFER_AFTER_MIN) * 60_000);

      const rows = await prisma.slot.findMany({
        where: {
          startTime: { gte: windowStart, lt: windowEnd },
          status: { in: [SlotStatus.free, SlotStatus.blocked] },
        },
        orderBy: { startTime: "asc" },
        select: { id: true, startTime: true, status: true, holdKey: true },
      });

      if (!rows.length || rows.some(r => r.status === SlotStatus.blocked && r.holdKey !== effKey)) {
        return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
      }

      const expected = Math.round((liveMinutes + BUFFER_BEFORE_MIN + BUFFER_AFTER_MIN) / SLOT_SIZE_MIN);
      if (rows.length !== expected) {
        return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
      }

      const stepMs = SLOT_SIZE_MIN * 60_000;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].startTime.getTime() !== rows[i - 1].startTime.getTime() + stepMs) {
          return NextResponse.json({ error: "block_unavailable" }, { status: 409 });
        }
      }
      slotIds = rows.map(r => r.id);
    }

    // 4) Extend/claim hold on the whole block
    const now = new Date();
    const until = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);
    await prisma.slot.updateMany({
      where: {
        id: { in: slotIds },
        OR: [
          { status: SlotStatus.free },
          { status: SlotStatus.blocked, holdKey: effKey },
        ],
      },
      data: { holdKey: effKey, holdUntil: until, status: SlotStatus.blocked },
    });

    // 5) Price (unified minutes; liveBlocks not priced separately here)
    const { priceEUR, amountCents } = computePriceEUR(liveMinutes, followups);

    // 6) Create PayPal order
    const requestId = makeRequestId(slotId, amountCents);
    const custom = encodeMetaShort({
      a: slotId,
      m: liveMinutes,
      t: sessionType,
      d: discord ?? "",
      g: !!inGame,
      f: followups ?? 0,
      l: liveBlocks,
      p: priceEUR,
    });

    const order = await paypalCreateOrder(
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: slotId,
            custom_id: custom,
            description: `${sessionType} (${liveMinutes}m)`,
            amount: { currency_code: "EUR", value: (amountCents / 100).toFixed(2) },
          },
        ],
        application_context: {
          brand_name: "Your Coaching",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: `${CFG_PUBLIC.SITE_URL}/checkout/success`,
          cancel_url: `${CFG_PUBLIC.SITE_URL}/checkout/cancel`,
        },
      },
      requestId
    );

    console.log("[paypal/create] ok", { slotId, count: slotIds.length, amountCents });
    return NextResponse.json({ id: order.id });
  } catch (e: any) {
    console.error("[paypal/create] fail", e?.message || e, e);
    return NextResponse.json({ error: "create_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
