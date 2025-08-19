import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckoutZ, computePriceEUR } from "@/lib/pricing";
import { getBlockIds } from "@/lib/booking/block";
import { paypalCreateOrder } from "@/lib/paypal";
import { CFG } from "@/lib/config.public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;

function toBase64Url(s: string) {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodeMetaShort(meta: {
  a: string;
  m: number;
  t: string;
  d: string;
  g: boolean;
  f: number;
  p: number;
}) {
  const b64u = toBase64Url(JSON.stringify(meta));
  return b64u.length <= 127 ? b64u : b64u.slice(0, 127);
}

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
    holdKey,
  } = CheckoutZ.parse(await req.json());

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.isTaken) {
    return NextResponse.json({ error: "Slot not found or already taken" }, { status: 409 });
  }

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

  const slotIds = await getBlockIds(slotId, liveMinutes, prisma);
  if (!slotIds?.length) {
    return NextResponse.json({ error: "Selected time isn’t fully available" }, { status: 409 });
  }

  const { priceEUR, amountCents } = computePriceEUR(liveMinutes, followups);

  const custom = encodeMetaShort({
    a: slotId,
    m: liveMinutes,
    t: sessionType,
    d: discord ?? "",
    g: !!inGame,
    f: followups ?? 0,
    p: priceEUR,
  });

  const requestId = makeRequestId(slotId, amountCents);

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
        return_url: `${CFG.public.SITE_URL}/checkout/success`,
        cancel_url: `${CFG.public.SITE_URL}/checkout/cancel`,
      },
    },
    requestId
  );

  return NextResponse.json({ id: order.id });
}
