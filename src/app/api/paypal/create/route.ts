import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIds } from "@/lib/booking/block";
import { paypalCreateOrder } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

// base64url without relying on Buffer "base64url" variant
function toBase64Url(s: string) {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// keep metadata short; we'll recompute the block on capture
function encodeMetaShort(meta: {
  a: string; // slotId
  m: number; // liveMinutes
  t: string; // sessionType
  d: string; // discord
  g: boolean; // inGame
  f: number; // followups
  p: number; // priceEUR
}) {
  const b64u = toBase64Url(JSON.stringify(meta));
  return b64u.length <= 127 ? b64u : b64u.slice(0, 127);
}

// safe ascii idempotency key (no crypto import)
function makeRequestId(slotId: string, amountCents: number) {
  return `${slotId}-${amountCents}-paypal`
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 40);
}

export async function POST(req: Request) {
  const {
    slotId,
    sessionType,
    liveMinutes,
    discord,
    inGame,
    followups,
    // liveBlocks (UI-only; not needed here)
    holdKey,
  } = CheckoutZ.parse(await req.json());

  // 1) Validate slot & not taken
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.isTaken) {
    return NextResponse.json(
      { error: "Slot not found or already taken" },
      { status: 409 }
    );
  }

  // 2) Enforce/refresh hold
  const now = new Date();
  if (slot.holdUntil && slot.holdUntil < now) {
    await prisma.slot.update({
      where: { id: slotId },
      data: { holdUntil: null, holdKey: null },
    });
    return NextResponse.json({ error: "hold_expired" }, { status: 409 });
  }
  if (slot.holdKey && holdKey && slot.holdKey !== holdKey) {
    return NextResponse.json({ error: "hold_mismatch" }, { status: 409 });
  }
  await prisma.slot.update({
    where: { id: slotId },
    data: {
      holdUntil: new Date(now.getTime() + HOLD_TTL_MIN * 60_000),
      ...(holdKey ? { holdKey } : {}),
    } as any,
  });

  // 3) Ensure contiguous block available
  const slotIds = await getBlockIds(slotId, liveMinutes, prisma);
  if (!slotIds?.length) {
    return NextResponse.json(
      { error: "Selected time isn’t fully available" },
      { status: 409 }
    );
  }

  // 4) Price
  const { priceEUR, amountCents } = computePriceEUR(liveMinutes, followups);

  // 5) Compact custom metadata (no block list here)
  const custom = encodeMetaShort({
    a: slotId,
    m: liveMinutes,
    t: sessionType,
    d: discord ?? "",
    g: !!inGame,
    f: followups ?? 0,
    p: priceEUR,
  });

  // 6) Safe idempotency key
  const requestId = makeRequestId(slotId, amountCents);

  // 7) Create order (currency must match your PayPalScriptProvider)
  const order = await paypalCreateOrder(
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: slotId,
          custom_id: custom,
          description: `${sessionType} (${liveMinutes}m)`,
          amount: {
            currency_code: "EUR",
            value: (amountCents / 100).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Your Coaching",
        user_action: "PAY_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
      },
    },
    requestId
  );

  return NextResponse.json({ id: order.id });
}
